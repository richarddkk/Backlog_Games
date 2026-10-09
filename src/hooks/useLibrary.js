import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, firebaseConfigured, friendlyError } from '../lib/firebase.js';
import { createExamples } from '../data/examples.js';
import { GUEST_KEY, isStoredGame, reorderGames, sortGames, validateGame } from '../lib/model.js';
import useTaxonomy from './useTaxonomy.js';
import useProfile from './useProfile.js';
import { buildActivities, isActivity, LOCAL_ACTIVITY_LIMIT, RECENT_ACTIVITY_LIMIT, readActivityDocument, sortActivities } from '../lib/activity.js';

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
  const [activities, setActivities] = useState([]);
  const [activityReady, setActivityReady] = useState(false);
  const [activityError, setActivityError] = useState('');
  const activityScope = useRef({ uid: null, activities: [] });
  const context = useRef({ uid: null, ready: false, games: [] });
  const taxonomy = useTaxonomy(user, authReady);
  const profile = useProfile(user);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      context.current = { uid: nextUser?.uid || null, ready: false, games: [] };
      setReady(false);
      setGames([]);
      activityScope.current = { uid: nextUser?.uid || null, activities: [] };
      setActivities([]); setActivityReady(false); setActivityError('');
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

  useEffect(() => {
    if (!authReady) return;
    const uid = user?.uid || null;
    const state = { uid, activities: [] };
    activityScope.current = state;
    setActivities([]); setActivityReady(false); setActivityError('');
    if (!uid) {
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        const stored = raw ? JSON.parse(raw) : null;
        const entries = stored?.activities || [];
        if (!Array.isArray(entries) || !entries.every(isActivity)) throw new Error('O histórico local contém dados inválidos.');
        state.activities = sortActivities(entries);
        setActivities(state.activities); setActivityReady(true);
      } catch (failure) { setActivityError(failure.message); }
      return;
    }
    const recent = query(collection(db, 'users', uid, 'activities'), orderBy('createdAt', 'desc'), limit(RECENT_ACTIVITY_LIMIT));
    const stop = onSnapshot(recent, snapshot => {
      if (activityScope.current !== state) return;
      const entries = snapshot.docs.map(readActivityDocument);
      if (!entries.every(isActivity)) { setActivityReady(false); setActivityError('Há atividades inválidas no banco. Confira os documentos.'); return; }
      state.activities = sortActivities(entries);
      setActivities(state.activities); setActivityReady(true); setActivityError('');
    }, failure => {
      if (activityScope.current !== state) return;
      setActivityReady(false); setActivityError(`${friendlyError(failure)} Publique as regras da versão 1.3 para usar o histórico.`);
    });
    return () => { if (activityScope.current === state) activityScope.current = { uid: null, activities: [] }; stop(); };
  }, [user?.uid, authReady, retryKey]);

  const getContext = () => {
    const current = context.current;
    if (!current.ready) throw new Error('Aguarde a biblioteca carregar antes de alterar os jogos.');
    return current;
  };

  const saveLocal = (records, events = []) => {
    const sorted = sortGames(records);
    if (activityError) throw new Error('Não foi possível ler o histórico local. Corrija o armazenamento antes de editar para preservar seus dados.');
    const entries = sortActivities([...events, ...activityScope.current.activities]).slice(0, LOCAL_ACTIVITY_LIMIT);
    try { localStorage.setItem(GUEST_KEY, JSON.stringify({ version: 1, games: sorted, activities: entries })); }
    catch { throw new Error('O navegador não conseguiu salvar. Libere espaço ou permita o armazenamento local.'); }
    context.current = { uid: null, ready: true, games: sorted };
    setGames(sorted);
    activityScope.current.activities = entries; setActivities(entries); setActivityReady(true);
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
    const events = buildActivities({ previous, game: record, gameId, actorId: current.uid, actorName: current.uid ? profile.displayName : 'Você', lists: taxonomy.lists, now });
    if (current.uid) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', current.uid, 'games', gameId), record);
      events.forEach(({ id: eventId, ...event }) => batch.set(doc(db, 'users', current.uid, 'activities', eventId), { ...event, createdAt: serverTimestamp() }));
      await batch.commit();
    } else saveLocal([...current.games.filter((entry) => entry.id !== gameId), { ...record, id: gameId }], events);
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
  return { user, games, activities, activityReady, activityError, ready, authReady, error, fromCache, taxonomy, profile, saving: saving > 0 || pending, saveGame, removeGame, reorder, clearLocal, retry, logout };
}
