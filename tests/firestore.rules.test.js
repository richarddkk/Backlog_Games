import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, query, or, where } from 'firebase/firestore';

let environment;
const game = { title: 'Hades', genre: 'Roguelike', status: 'completed', rating: 4.5, coverUrl: '/covers/1145360.jpg', review: 'Muito bom', rank: 1024, createdAt: 100, updatedAt: 100 };
const ref = (client, uid = 'alice') => doc(client, 'users', uid, 'games', 'hades');
const option = { kind: 'list', label: 'Quero revisitar', color: 'blue', icon: 'library', completed: false, active: true, createdAt: 100, updatedAt: 100 };
const grantAdmin = async (uid, enabled = true) => environment.withSecurityRulesDisabled(async (context) => setDoc(doc(context.firestore(), 'admins', uid), { enabled }));

beforeAll(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-checkpoint', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
beforeEach(async () => { await environment.clearFirestore(); });
afterAll(async () => { await environment?.cleanup(); });

describe('Regras de segurança do Firestore', () => {
  it('permite criar, listar, atualizar a nota/ordem e excluir seus próprios jogos', async () => {
    const client = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(ref(client), game));
    await assertSucceeds(getDocs(collection(client, 'users', 'alice', 'games')));
    await assertSucceeds(updateDoc(ref(client), { rating: 5, rank: -1024, updatedAt: 200 }));
    await assertSucceeds(deleteDoc(ref(client)));
  });
  it('bloqueia visitantes e outra conta de ler/escrever a biblioteca', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(ref(alice), game));
    await assertFails(getDoc(ref(bob)));
    await assertFails(setDoc(ref(bob), game));
    await assertFails(deleteDoc(ref(bob)));
    await assertFails(getDocs(collection(bob, 'users', 'alice', 'games')));
    await assertFails(getDoc(ref(guest)));
    await assertFails(setDoc(ref(guest), game));
  });
  it('rejeita notas fora da escala, listas inválidas e URLs inseguras', async () => {
    const client = environment.authenticatedContext('alice').firestore();
    for (const invalid of [{ rating: 4.3 }, { rating: 6 }, { status: 'unknown' }, { genre: 'unknown' }, { coverUrl: 'javascript:alert(1)' }, { title: '' }, { rank: 'first' }]) {
      await assertFails(setDoc(ref(client), { ...game, ...invalid }));
    }
  });
  it('protege a data de criação e bloqueia campos ou coleções extras', async () => {
    const client = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(ref(client), game));
    await assertFails(updateDoc(ref(client), { createdAt: 50 }));
    await assertFails(updateDoc(ref(client), { isAdmin: true }));
    await assertFails(setDoc(doc(client, 'users', 'alice'), { isAdmin: true }));
  });
  it('cada conta pode criar e usar suas opções pessoais, mas não as de outra conta', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const privateList = doc(alice, 'users', 'alice', 'options', 'personal-replay');
    const privateGenre = doc(alice, 'users', 'alice', 'options', 'personal-soulslike');
    await assertSucceeds(setDoc(privateList, option));
    await assertSucceeds(setDoc(privateGenre, { ...option, kind: 'genre', label: 'Soulslike' }));
    await assertSucceeds(setDoc(ref(alice), { ...game, status: 'personal-replay', genre: 'personal-soulslike' }));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'options', 'personal-replay')));
    await assertFails(updateDoc(doc(bob, 'users', 'alice', 'options', 'personal-replay'), { label: 'Invadido' }));
    await assertFails(setDoc(ref(bob, 'bob'), { ...game, status: 'personal-replay' }));
    await assertFails(setDoc(doc(alice, 'users', 'alice', 'options', 'playing'), option));
    await assertFails(setDoc(doc(alice, 'users', 'alice', 'options', 'global-fake'), option));
  });
  it('somente admin modifica opções globais; usuários comuns podem usá-las', async () => {
    await grantAdmin('alice');
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const globalList = doc(alice, 'taxonomy', 'global-replay');
    await assertSucceeds(setDoc(globalList, option));
    await assertSucceeds(setDoc(doc(alice, 'taxonomy', 'global-soulslike'), { ...option, kind: 'genre', label: 'Soulslike' }));
    await assertSucceeds(getDocs(collection(bob, 'taxonomy')));
    await assertSucceeds(setDoc(ref(bob, 'bob'), { ...game, status: 'global-replay', genre: 'global-soulslike' }));
    await assertFails(updateDoc(doc(bob, 'taxonomy', 'global-replay'), { label: 'Invadido' }));
    await assertFails(setDoc(doc(bob, 'taxonomy', 'global-new'), option));
    await assertSucceeds(updateDoc(globalList, { label: 'Rejogar', updatedAt: 200 }));
    await assertSucceeds(getDoc(ref(bob, 'bob')));
    await assertFails(getDoc(ref(alice, 'bob')));
    await assertFails(deleteDoc(globalList));
    await grantAdmin('alice', false);
    await assertFails(updateDoc(globalList, { label: 'Sem permissão' }));
  });
  it('ninguém consegue se promover a administrador ou listar as permissões pelo app', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'admins', 'alice')));
    await assertFails(setDoc(doc(alice, 'admins', 'alice'), { enabled: true }));
    await assertFails(getDoc(doc(alice, 'admins', 'bob')));
    await assertFails(getDocs(collection(alice, 'admins')));
    await grantAdmin('alice');
    await assertFails(setDoc(doc(alice, 'admins', 'bob'), { enabled: true }));
    await assertFails(updateDoc(doc(alice, 'admins', 'alice'), { enabled: false }));
    await assertFails(setDoc(doc(alice, 'taxonomy', 'RPG'), { ...option, kind: 'list' }));
  });
  it('arquivar impede novos usos e preserva edição de jogos existentes', async () => {
    await grantAdmin('admin');
    const admin = environment.authenticatedContext('admin').firestore();
    const alice = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(ref(alice), { ...game, status: 'playing' }));
    await assertSucceeds(setDoc(doc(admin, 'taxonomy', 'playing'), { ...option, label: 'Em andamento', active: false }));
    await assertSucceeds(setDoc(doc(admin, 'taxonomy', 'Roguelike'), { ...option, kind: 'genre', label: 'Rogue', active: false }));
    await assertSucceeds(updateDoc(ref(alice), { rating: 5, updatedAt: 200 }));
    await assertFails(setDoc(doc(alice, 'users', 'alice', 'games', 'new'), { ...game, status: 'playing' }));
    await assertSucceeds(updateDoc(ref(alice), { status: 'planned', genre: 'RPG', updatedAt: 300 }));
    await assertFails(updateDoc(ref(alice), { status: 'playing', updatedAt: 400 }));
  });
});

describe('Perfil pessoal', () => {
  it('somente a própria conta lê e altera o perfil; foto e campos são validados', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const reference = doc(alice, 'users', 'alice', 'profile', 'main');
    const profile = { displayName: 'Richie', photoData: 'data:image/jpeg;base64,YQ==', updatedAt: 100 };
    await assertSucceeds(setDoc(reference, profile));
    await assertSucceeds(getDoc(reference));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'profile', 'main')));
    await assertFails(setDoc(doc(bob, 'users', 'alice', 'profile', 'main'), profile));
    for (const fields of [{ isAdmin: true }, { displayName: 'A'.repeat(61) }, { photoData: 'javascript:alert(1)' }, { photoData: 'data:image/jpeg;base64,' + 'A'.repeat(180000) }]) await assertFails(setDoc(reference, { ...profile, ...fields }));
    await assertSucceeds(updateDoc(reference, { photoData: '', displayName: 'Richard' }));
    await grantAdmin('bob');
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'profile', 'main')));
  });
});

const requestFriendship = client => setDoc(doc(client, 'friendships', 'alice~bob'), { fromId: 'alice', toId: 'bob', fromName: 'Alice', toName: '', status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const acceptFriendship = client => updateDoc(doc(client, 'friendships', 'alice~bob'), { toName: 'Bob', status: 'accepted', updatedAt: serverTimestamp() });
const activity = { actorId: 'alice', actorName: 'Alice', gameId: 'hades', gameTitle: 'Hades', coverUrl: game.coverUrl, type: 'added', status: 'completed', statusLabel: 'Zerado', createdAt: serverTimestamp() };

describe('Atividades e consentimento de amizade', () => {
  it('somente o destinatário aceita; um pedido pendente não libera acesso e a remoção revoga a leitura', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const charlie = environment.authenticatedContext('charlie').firestore();
    await assertSucceeds(setDoc(ref(alice), game));
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'profile', 'main'), { displayName: 'Alice', photoData: '', updatedAt: 100 }));
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'options', 'personal-replay'), option));
    await assertSucceeds(requestFriendship(alice));
    await assertSucceeds(getDocs(query(collection(bob, 'friendships'), or(where('fromId', '==', 'bob'), where('toId', '==', 'bob')))));
    await assertFails(getDocs(collection(bob, 'friendships')));
    await assertFails(getDoc(ref(bob)));
    await assertFails(acceptFriendship(alice));
    await assertFails(acceptFriendship(charlie));
    await assertSucceeds(acceptFriendship(bob));
    await assertSucceeds(getDoc(ref(bob)));
    await assertSucceeds(getDocs(collection(bob, 'users', 'alice', 'games')));
    await assertSucceeds(getDoc(doc(bob, 'users', 'alice', 'profile', 'main')));
    await assertSucceeds(getDocs(collection(bob, 'users', 'alice', 'options')));
    await assertSucceeds(setDoc(ref(bob, 'bob'), game));
    await assertSucceeds(getDoc(ref(alice, 'bob')));
    await assertFails(updateDoc(ref(bob), { rating: 5 }));
    await assertFails(deleteDoc(ref(bob)));
    await assertFails(getDoc(ref(charlie)));
    await assertFails(deleteDoc(doc(charlie, 'friendships', 'alice~bob')));
    await assertSucceeds(deleteDoc(doc(alice, 'friendships', 'alice~bob')));
    await assertFails(getDoc(ref(bob)));
    await assertFails(getDoc(ref(alice, 'bob')));
  });

  it('impede forjar uma amizade aceita ou trocar os participantes do pedido', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const fields = { fromId: 'alice', toId: 'bob', fromName: 'Alice', toName: 'Bob', status: 'accepted', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await assertFails(setDoc(doc(alice, 'friendships', 'alice~bob'), fields));
    await assertFails(setDoc(doc(bob, 'friendships', 'alice~bob'), { ...fields, status: 'pending', toName: '' }));
    await assertSucceeds(requestFriendship(alice));
    await assertFails(updateDoc(doc(bob, 'friendships', 'alice~bob'), { fromId: 'charlie', status: 'accepted', toName: 'Bob', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(bob, 'friendships', 'alice~bob'), { createdAt: serverTimestamp(), status: 'accepted', toName: 'Bob', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(bob, 'friendships', 'bob~alice'), { ...fields, fromId: 'bob', toId: 'alice', status: 'pending', toName: '' }));
    await assertSucceeds(deleteDoc(doc(bob, 'friendships', 'alice~bob')));
  });

  it('salva jogo e atividade na mesma operação, valida a conquista e mantém o histórico imutável', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const eventRef = doc(alice, 'users', 'alice', 'activities', 'added');
    const batch = writeBatch(alice);
    batch.set(ref(alice), game); batch.set(eventRef, activity);
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDocs(collection(alice, 'users', 'alice', 'activities')));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'activities', 'added')));
    await assertFails(updateDoc(eventRef, { actorName: 'Forjado' }));
    await assertFails(deleteDoc(eventRef));
    await assertFails(setDoc(doc(alice, 'users', 'alice', 'activities', 'fake'), { ...activity, type: 'status' }));
    const platinum = writeBatch(alice);
    platinum.update(ref(alice), { status: 'platinum', updatedAt: 200 });
    platinum.set(doc(alice, 'users', 'alice', 'activities', 'platinum'), { ...activity, type: 'status', status: 'platinum', statusLabel: 'Platinado' });
    await assertSucceeds(platinum.commit());
    await assertSucceeds(requestFriendship(alice)); await assertSucceeds(acceptFriendship(bob));
    await assertSucceeds(getDocs(collection(bob, 'users', 'alice', 'activities')));
    await assertFails(setDoc(doc(bob, 'users', 'alice', 'activities', 'invasion'), activity));
    await assertSucceeds(deleteDoc(ref(alice)));
    await assertSucceeds(getDoc(eventRef));
    await assertSucceeds(deleteDoc(doc(bob, 'friendships', 'alice~bob')));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'activities', 'added')));
  });

  it('um histórico inválido impede a gravação parcial do jogo', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const batch = writeBatch(alice);
    batch.set(ref(alice), game);
    batch.set(doc(alice, 'users', 'alice', 'activities', 'fake'), { ...activity, actorId: 'bob' });
    await assertFails(batch.commit());
    const snapshot = await assertSucceeds(getDoc(ref(alice)));
    if (snapshot.exists()) throw new Error('A gravação deveria ser atômica.');
  });
});
