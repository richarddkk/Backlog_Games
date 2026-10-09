import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, query, or, where, orderBy, limit } from 'firebase/firestore';

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

  it('protege textos privados no servidor, sem impedir notas e jogos compartilhados', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const admin = environment.authenticatedContext('admin').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    await grantAdmin('admin');
    const reviewRef = client => doc(client, 'users', 'alice', 'reviews', 'hades');
    const batch = writeBatch(alice);
    batch.set(ref(alice), { ...game, review: '' });
    batch.set(reviewRef(alice), { text: 'Texto privado', visibility: 'private', updatedAt: 100 });
    await assertSucceeds(batch.commit());
    await assertSucceeds(requestFriendship(alice)); await assertSucceeds(acceptFriendship(bob));
    await assertSucceeds(getDoc(reviewRef(alice)));
    await assertSucceeds(getDocs(collection(alice, 'users', 'alice', 'reviews')));
    await assertSucceeds(getDocs(collection(bob, 'users', 'alice', 'games')));
    const shared = await assertSucceeds(getDoc(ref(bob)));
    if (shared.data().review !== '' || shared.data().rating !== 4.5) throw new Error('O jogo deve conter a nota, mas nenhum texto privado.');
    await assertFails(getDoc(reviewRef(bob)));
    await assertFails(getDocs(collection(bob, 'users', 'alice', 'reviews')));
    await assertFails(getDoc(reviewRef(admin)));
    await assertFails(getDoc(reviewRef(guest)));
    await assertFails(updateDoc(reviewRef(bob), { visibility: 'friends' }));
    await assertFails(updateDoc(ref(alice), { review: 'Não pode duplicar o texto privado no jogo' }));
    await assertSucceeds(updateDoc(reviewRef(alice), { visibility: 'friends', updatedAt: 200 }));
    await assertSucceeds(getDoc(reviewRef(bob)));
    await assertFails(getDoc(reviewRef(admin)));
    await assertSucceeds(updateDoc(reviewRef(alice), { visibility: 'private', updatedAt: 300 }));
    await assertFails(getDoc(reviewRef(bob)));
    await assertSucceeds(deleteDoc(reviewRef(alice)));
    await assertSucceeds(getDoc(reviewRef(bob))); // Ausência permite mostrar “ainda sem texto”.
    await assertSucceeds(deleteDoc(doc(alice, 'friendships', 'alice~bob')));
    await assertFails(getDoc(reviewRef(bob)));
  });

  it('migra o texto antigo atomicamente e rejeita visibilidade ou texto inválidos', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const reviewRef = doc(alice, 'users', 'alice', 'reviews', 'hades');
    await assertSucceeds(setDoc(ref(alice), game));
    const fields = { text: game.review, visibility: 'private', updatedAt: 100 };
    await assertFails(setDoc(reviewRef, fields)); // O texto antigo precisa sair do documento público.
    const migration = writeBatch(alice);
    migration.update(ref(alice), { review: '' }); migration.set(reviewRef, fields);
    await assertSucceeds(migration.commit());
    await assertFails(updateDoc(reviewRef, { visibility: 'public' }));
    await assertFails(updateDoc(reviewRef, { text: 'x'.repeat(3001) }));
    await assertFails(updateDoc(reviewRef, { extra: true }));
    await assertFails(setDoc(doc(alice, 'users', 'alice', 'reviews', 'inexistente'), fields));
    const remove = writeBatch(alice);
    remove.delete(ref(alice)); remove.delete(reviewRef);
    await assertSucceeds(remove.commit());
  });

  const publication = fields => ({ actorId: 'alice', actorName: 'Alice', gameId: 'hades', gameTitle: 'Hades', coverUrl: game.coverUrl, rating: fields.rating ?? game.rating, status: fields.status ?? game.status, statusLabel: fields.status === 'platinum' ? 'Platinado' : 'Zerado', genreLabel: 'Roguelike', text: fields.text ?? 'Minha review pública', visibility: 'public', updatedAt: serverTimestamp() });
  const publishReview = async (client, fields = {}) => {
    const batch = writeBatch(client);
    batch.set(ref(client), { ...game, review: '', ...(fields.rating !== undefined ? { rating: fields.rating } : {}), ...(fields.status ? { status: fields.status } : {}) });
    batch.set(doc(client, 'users', 'alice', 'reviews', 'hades'), { text: fields.text ?? 'Minha review pública', visibility: 'public', updatedAt: 200 });
    batch.set(doc(client, 'publicReviews', 'alice~hades'), publication(fields));
    return batch.commit();
  };

  it('publica para todos sem abrir a biblioteca e impede forjar reviews de outra pessoa', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    await assertSucceeds(publishReview(alice));
    const publicRef = client => doc(client, 'publicReviews', 'alice~hades');
    await assertSucceeds(getDoc(publicRef(guest)));
    await assertSucceeds(getDocs(query(collection(guest, 'publicReviews'), orderBy('updatedAt', 'desc'), limit(100))));
    await assertFails(getDoc(ref(guest)));
    await assertFails(getDoc(ref(bob)));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'reviews', 'hades')));
    await assertFails(setDoc(publicRef(bob), publication({})));
    await assertFails(deleteDoc(publicRef(bob)));
    await assertFails(updateDoc(publicRef(alice), { text: 'Texto diferente da review original', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(alice, 'publicReviews', 'alice~wrong'), publication({})));
    await assertFails(updateDoc(ref(alice), { rating: 3 }));
    await assertSucceeds(publishReview(alice, { rating: 5, status: 'platinum', text: 'Atualizei a opinião' }));
    const changed = await assertSucceeds(getDoc(publicRef(guest)));
    if (changed.data().rating !== 5 || changed.data().status !== 'platinum' || changed.data().text !== 'Atualizei a opinião') throw new Error('A publicação precisa acompanhar a review.');
  });

  it('retira o texto público atomicamente ao mudar o público ou excluir o jogo', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    const publicRef = doc(alice, 'publicReviews', 'alice~hades');
    const reviewRef = doc(alice, 'users', 'alice', 'reviews', 'hades');
    await assertSucceeds(publishReview(alice));
    await assertFails(updateDoc(reviewRef, { visibility: 'friends' }));
    await assertFails(deleteDoc(publicRef));
    await assertFails(deleteDoc(reviewRef));
    await assertFails(deleteDoc(ref(alice)));
    const toFriends = writeBatch(alice);
    toFriends.update(reviewRef, { visibility: 'friends' }); toFriends.delete(publicRef);
    await assertSucceeds(toFriends.commit());
    const removed = await assertSucceeds(getDoc(doc(guest, 'publicReviews', 'alice~hades')));
    if (removed.exists()) throw new Error('O texto não pode continuar público.');
    await assertFails(setDoc(publicRef, publication({})));
    await assertSucceeds(publishReview(alice));
    const toPrivate = writeBatch(alice);
    toPrivate.update(reviewRef, { visibility: 'private' }); toPrivate.delete(publicRef);
    await assertSucceeds(toPrivate.commit());
    // O cliente também exclui publicações inexistentes ao salvar avaliações privadas.
    const privateSave = writeBatch(alice);
    privateSave.set(ref(alice), { ...game, review: '' });
    privateSave.set(reviewRef, { text: 'Só eu', visibility: 'private', updatedAt: 300 }); privateSave.delete(publicRef);
    await assertSucceeds(privateSave.commit());
    await assertSucceeds(publishReview(alice));
    const remove = writeBatch(alice);
    remove.delete(ref(alice)); remove.delete(reviewRef); remove.delete(publicRef);
    await assertSucceeds(remove.commit());
    const gone = await assertSucceeds(getDoc(doc(guest, 'publicReviews', 'alice~hades')));
    if (gone.exists()) throw new Error('A publicação do jogo excluído deve desaparecer.');
  });

  it('a consulta filtrada de amigos recebe apenas textos compartilhados e perde acesso sem amizade', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    await assertSucceeds(publishReview(alice));
    const privateGame = doc(alice, 'users', 'alice', 'games', 'private');
    const privateReview = doc(alice, 'users', 'alice', 'reviews', 'private');
    const batch = writeBatch(alice);
    batch.set(privateGame, { ...game, review: '' }); batch.set(privateReview, { text: 'Segredo', visibility: 'private', updatedAt: 2 });
    await assertSucceeds(batch.commit());
    await assertSucceeds(requestFriendship(alice)); await assertSucceeds(acceptFriendship(bob));
    const shared = query(collection(bob, 'users', 'alice', 'reviews'), where('visibility', 'in', ['friends', 'public']));
    const result = await assertSucceeds(getDocs(shared));
    if (result.size !== 1 || result.docs[0].data().text === 'Segredo') throw new Error('Textos privados não podem ser enviados na consulta.');
    await assertFails(getDocs(collection(bob, 'users', 'alice', 'reviews')));
    await assertFails(getDoc(doc(bob, 'users', 'alice', 'reviews', 'private')));
    await assertSucceeds(deleteDoc(doc(bob, 'friendships', 'alice~bob')));
    await assertFails(getDocs(shared));
    await assertSucceeds(getDocs(collection(bob, 'publicReviews'))); // Acesso público depende da publicação, não da amizade.
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

const publishProfile = (client, visibility = 'friends', fields = {}) => {
  const profile = { displayName: 'Alice', photoData: '', bio: 'Adoro RPGs.', libraryVisibility: visibility, updatedAt: 300, ...fields };
  const batch = writeBatch(client);
  batch.set(doc(client, 'users', 'alice', 'profile', 'main'), profile);
  batch.set(doc(client, 'publicProfiles', 'alice'), profile);
  return batch.commit();
};
const sendChat = (client, senderId = 'alice', text = 'Vamos jogar?', pair = 'alice~bob') => {
  const batch = writeBatch(client);
  batch.set(doc(client, 'conversations', pair), { participants: pair.split('~'), updatedAt: serverTimestamp() });
  batch.set(doc(client, 'conversations', pair, 'messages', 'message'), { senderId, text, createdAt: serverTimestamp() });
  return batch.commit();
};

describe('Perfis públicos e horas de jogo', () => {
  it('publica bio sem abrir biblioteca, impede campos extras e mantém a projeção sincronizada', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(ref(alice), { ...game, review: '', hoursPlayed: 42.5 }));
    await assertSucceeds(publishProfile(alice));
    await assertSucceeds(getDoc(doc(guest, 'publicProfiles', 'alice')));
    await assertFails(getDoc(ref(guest)));
    await assertFails(getDoc(doc(guest, 'users', 'alice', 'profile', 'main')));
    await assertFails(publishProfile(alice, 'friends', { email: 'private@example.com' }));
    await assertFails(publishProfile(alice, 'friends', { bio: 'x'.repeat(601) }));
    await assertFails(updateDoc(doc(bob, 'publicProfiles', 'alice'), { bio: 'Invadido' }));
    await assertFails(updateDoc(doc(alice, 'publicProfiles', 'alice'), { displayName: 'Desatualizado' }));
    await assertFails(updateDoc(doc(alice, 'users', 'alice', 'profile', 'main'), { bio: 'Mudança isolada' }));
    await assertSucceeds(publishProfile(alice, 'friends', { bio: 'Bio atualizada.' }));
  });
  it('abre apenas dados de jogos sem texto embutido e revoga leitura quando a biblioteca volta a Amigos', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(ref(alice), { ...game, review: '', hoursPlayed: 99.5 }));
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'games', 'legacy'), { ...game, review: 'Texto legado compartilhado só com amigos.' }));
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'reviews', 'hades'), { text: 'Segredo', visibility: 'private', updatedAt: 200 }));
    await assertSucceeds(publishProfile(alice, 'public'));
    await assertSucceeds(getDoc(ref(guest)));
    await assertSucceeds(getDocs(query(collection(guest, 'users', 'alice', 'games'), where('review', '==', ''))));
    await assertFails(getDocs(collection(guest, 'users', 'alice', 'games')));
    await assertFails(getDoc(doc(guest, 'users', 'alice', 'games', 'legacy')));
    await assertFails(getDoc(doc(guest, 'users', 'alice', 'reviews', 'hades')));
    await assertSucceeds(getDocs(collection(guest, 'users', 'alice', 'options')));
    await assertSucceeds(getDocs(collection(guest, 'taxonomy')));
    await assertSucceeds(publishProfile(alice, 'friends'));
    await assertFails(getDoc(ref(guest)));
    await assertFails(getDocs(collection(guest, 'users', 'alice', 'options')));
  });
  it('valida horas e exige que a publicação acompanhe horas alteradas', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    for (const hoursPlayed of [-1, 1000001, '10']) await assertFails(setDoc(ref(alice), { ...game, hoursPlayed }));
    const batch = writeBatch(alice);
    batch.set(ref(alice), { ...game, review: '', hoursPlayed: 10.5 });
    batch.set(doc(alice, 'users', 'alice', 'reviews', 'hades'), { text: 'Excelente!', visibility: 'public', updatedAt: 200 });
    batch.set(doc(alice, 'publicReviews', 'alice~hades'), { actorId: 'alice', actorName: 'Alice', gameId: 'hades', gameTitle: 'Hades', coverUrl: game.coverUrl, rating: game.rating, hoursPlayed: 10.5, status: game.status, statusLabel: 'Zerado', genreLabel: 'Roguelike', text: 'Excelente!', visibility: 'public', updatedAt: serverTimestamp() });
    await assertSucceeds(batch.commit());
    await assertFails(updateDoc(ref(alice), { hoursPlayed: 20 }));
    const update = writeBatch(alice);
    update.update(ref(alice), { hoursPlayed: 20 });
    update.update(doc(alice, 'publicReviews', 'alice~hades'), { hoursPlayed: 20, updatedAt: serverTimestamp() });
    await assertSucceeds(update.commit());
  });
});

describe('Conversas privadas entre amigos aceitos', () => {
  it('pedido pendente, visitante, terceiro e admin não podem ler ou enviar mensagens', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const third = environment.authenticatedContext('admin').firestore();
    const guest = environment.unauthenticatedContext().firestore();
    await grantAdmin('admin');
    await assertFails(sendChat(alice));
    await assertSucceeds(requestFriendship(alice));
    await assertFails(sendChat(alice));
    await assertSucceeds(acceptFriendship(bob));
    await assertSucceeds(getDocs(collection(alice, 'conversations', 'alice~bob', 'messages')));
    await assertSucceeds(sendChat(alice));
    await assertSucceeds(getDocs(collection(bob, 'conversations', 'alice~bob', 'messages')));
    await assertSucceeds(getDoc(doc(bob, 'conversations', 'alice~bob')));
    for (const client of [third, guest]) {
      await assertFails(getDocs(collection(client, 'conversations', 'alice~bob', 'messages')));
      await assertFails(getDoc(doc(client, 'conversations', 'alice~bob')));
      await assertFails(sendChat(client));
    }
    await assertFails(getDocs(collection(alice, 'conversations')));
  });
  it('valida autor, participantes, texto e data e não permite alterar mensagens já enviadas', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    await assertSucceeds(requestFriendship(alice)); await assertSucceeds(acceptFriendship(bob));
    await assertFails(sendChat(alice, 'bob'));
    for (const text of ['', '   \n', 'x'.repeat(2001)]) await assertFails(sendChat(alice, 'alice', text));
    await assertFails(sendChat(alice, 'alice', 'Oi', 'alice~alice'));
    await assertFails(setDoc(doc(alice, 'conversations', 'alice~bob'), { participants: ['alice', 'admin'], updatedAt: serverTimestamp() }));
    await assertSucceeds(sendChat(alice));
    const message = doc(bob, 'conversations', 'alice~bob', 'messages', 'reply');
    await assertFails(setDoc(message, { senderId: 'bob', text: 'Olá', createdAt: new Date() }));
    await assertSucceeds(setDoc(message, { senderId: 'bob', text: 'Olá', createdAt: serverTimestamp() }));
    await assertFails(updateDoc(message, { text: 'Editado' }));
    await assertFails(deleteDoc(message));
    await assertFails(setDoc(doc(bob, 'conversations', 'alice~bob', 'messages', 'extra'), { senderId: 'bob', text: 'Oi', createdAt: serverTimestamp(), secret: true }));
  });
  it('revoga acesso ao remover a amizade sem apagar o histórico', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    await assertSucceeds(requestFriendship(alice)); await assertSucceeds(acceptFriendship(bob));
    await assertSucceeds(sendChat(alice));
    await assertSucceeds(deleteDoc(doc(bob, 'friendships', 'alice~bob')));
    await assertFails(getDocs(collection(alice, 'conversations', 'alice~bob', 'messages')));
    await assertFails(getDocs(collection(bob, 'conversations', 'alice~bob', 'messages')));
    await assertFails(sendChat(alice));
    await assertSucceeds(requestFriendship(alice)); await assertSucceeds(acceptFriendship(bob));
    const saved = await assertSucceeds(getDocs(collection(bob, 'conversations', 'alice~bob', 'messages')));
    if (saved.size !== 1) throw new Error('O histórico deve ser preservado.');
  });
});
