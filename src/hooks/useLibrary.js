import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, firebaseConfigured, friendlyError } from '../lib/firebase.js';
import { createExamples } from '../data/examples.js';
import { GUEST_KEY, isStoredGame, reorderGames, sortGames, validateGame } from '../lib/model.js';
import useTaxonomy from './useTaxonomy.js';
import useProfile from './useProfile.js';

export function loadGuestGames() {
  const raw = localStorage.getItem(GUEST_KEY);
  if (raw === null) return createExamples();
  const stored = JSON.parse(raw);
  if (stored.version !== 1 || !Array.isArray(stored.games) || !stored.games.every(isStoredGame)) {
    throw new Error('Os dados locais não puderam ser lidos. Eles foram preservados.');
  }
  return sortGames(stored.games);
}

export default function useLibrary() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [games, setGames] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [saving, setSaving] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const context = useRef({ uid: null, ready: false, games: [] });
  const taxonomy = useTaxonomy(user, authReady);
  const profile = useProfile(user);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      context.current = { uid: nextUser?.uid || null, ready: false, games: [] };
      setReady(false);
      setGames([]);
      setUser(nextUser);
      setAuthReady(true);
    }, (failure) => { setError(friendlyError(failure)); setAuthReady(true); });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const uid = user?.uid || null;
    context.current = { uid, ready: false, games: [] };
    setReady(false);
    setPending(false);
    setFromCache(false);
    setError('');
    if (!uid) {
      try {
        const local = loadGuestGames();
        context.current = { uid: null, ready: true, games: local };
        setGames(local); setReady(true);
      } catch { setGames([]); setError('Não foi possível ler os jogos locais. Os dados foram preservados. Verifique se o navegador permite armazenamento.'); }
      return;
    }
    return onSnapshot(collection(db, 'users', uid, 'games'), { includeMetadataChanges: true }, (snapshot) => {
      if (context.current.uid !== uid) return;
      const records = snapshot.docs.map((record) => ({ ...record.data(), id: record.id }));
      if (!records.every(isStoredGame)) {
        context.current.ready = false;
        setReady(false); setError('Existem jogos com dados inválidos na conta. Confira os documentos no Firestore antes de editar.');
        return;
      }
      const sorted = sortGames(records);
      context.current = { uid, ready: true, games: sorted };
      setGames(sorted); setReady(true); setError('');
      setPending(snapshot.metadata.hasPendingWrites);
      setFromCache(snapshot.metadata.fromCache);
    }, (failure) => {
      if (context.current.uid !== uid) return;
      context.current.ready = false;
      setReady(false); setError(friendlyError(failure));
    });
  }, [user?.uid, authReady, retryKey]);

  const getContext = () => {
    const current = context.current;
    if (!current.ready) throw new Error('Aguarde a biblioteca carregar antes de alterar os jogos.');
    return current;
  };

  const saveLocal = (records) => {
    const sorted = sortGames(records);
    try { localStorage.setItem(GUEST_KEY, JSON.stringify({ version: 1, games: sorted })); }
    catch { throw new Error('O navegador não conseguiu salvar. Libere espaço ou permita o armazenamento local.'); }
    context.current = { uid: null, ready: true, games: sorted };
    setGames(sorted);
  };

  const runWrite = async (operation) => {
    setSaving((count) => count + 1);
    try { return await operation(); } catch (failure) { throw new Error(friendlyError(failure)); }
    finally { setSaving((count) => Math.max(0, count - 1)); }
  };

  const saveGame = (fields, id) => runWrite(async () => {
    const current = getContext();
    const previous = id ? current.games.find((entry) => entry.id === id) : null;
    if (id && !previous) throw new Error('Este jogo não está mais na biblioteca.');
    if (!taxonomy.ready) throw new Error('Aguarde as listas e gêneros carregarem.');
    const clean = validateGame(fields, taxonomy, previous);
    const now = Math.max(Date.now(), previous?.createdAt || 0);
    const gameId = id || crypto.randomUUID();
    const record = { ...clean, rank: previous?.rank ?? Math.max(0, ...current.games.map((entry) => entry.rank)) + 1024, createdAt: previous?.createdAt ?? now, updatedAt: now };
    if (current.uid) await setDoc(doc(db, 'users', current.uid, 'games', gameId), record);
    else saveLocal([...current.games.filter((entry) => entry.id !== gameId), { ...record, id: gameId }]);
    return gameId;
  });

  const removeGame = (id) => runWrite(async () => {
    const current = getContext();
    if (current.uid) await deleteDoc(doc(db, 'users', current.uid, 'games', id));
    else saveLocal(current.games.filter((entry) => entry.id !== id));
  });

  const reorder = (activeId, overId) => runWrite(async () => {
    const current = getContext();
    const updates = reorderGames(current.games, activeId, overId);
    if (!updates.length) return;
    const now = Date.now();
    if (current.uid) {
      if (updates.length === 1) await updateDoc(doc(db, 'users', current.uid, 'games', updates[0].id), { rank: updates[0].rank, updatedAt: now });
      else {
        for (let start = 0; start < updates.length; start += 450) {
          const batch = writeBatch(db);
          updates.slice(start, start + 450).forEach((entry) => batch.update(doc(db, 'users', current.uid, 'games', entry.id), { rank: entry.rank, updatedAt: now }));
          await batch.commit();
        }
      }
    } else {
      const positions = new Map(updates.map((entry) => [entry.id, entry.rank]));
      saveLocal(current.games.map((entry) => positions.has(entry.id) ? { ...entry, rank: positions.get(entry.id), updatedAt: now } : entry));
    }
  });

  const clearLocal = () => runWrite(async () => {
    const current = getContext();
    if (current.uid) throw new Error('Esta ação está disponível somente no modo local.');
    saveLocal([]);
  });

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);
  const logout = () => auth ? signOut(auth) : Promise.resolve();
  return { user, games, ready, authReady, error, fromCache, taxonomy, profile, saving: saving > 0 || pending, saveGame, removeGame, reorder, clearLocal, retry, logout };
}
