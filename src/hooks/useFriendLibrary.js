import { useCallback, useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { isStoredGame, sortGames } from '../lib/model.js';
import { isStoredOption, mergeOptions } from '../lib/taxonomy.js';

export default function useFriendLibrary(ownUid, friendUid, globalOptions) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([ownUid, friendUid]);
  const [state, setState] = useState({ key: '', ready: false, error: '', games: [], options: [], profile: null });
  useEffect(() => {
    let active = true;
    const next = { key, ready: !friendUid, error: '', games: [], options: [], profile: null };
    const loaded = new Set();
    const publish = () => { if (active) setState({ ...next, ready: loaded.size === 3 && !next.error }); };
    setState(next);
    if (!friendUid || !ownUid) return;
    const fail = failure => {
      if (!active) return;
      next.games = []; next.options = []; next.profile = null;
      next.error = `A biblioteca não está disponível. Confira se vocês ainda são amigos. ${friendlyError(failure)}`;
      publish();
    };
    const stops = [
      onSnapshot(collection(db, 'users', friendUid, 'games'), snapshot => {
        if (!active || next.error) return;
        const games = snapshot.docs.map(record => ({ ...record.data(), id: record.id }));
        if (!games.every(isStoredGame)) { fail(new Error('Há jogos inválidos nesta biblioteca.')); return; }
        next.games = sortGames(games); loaded.add('games'); publish();
      }, fail),
      onSnapshot(collection(db, 'users', friendUid, 'options'), snapshot => {
        if (!active || next.error) return;
        next.options = snapshot.docs.map(record => ({ ...record.data(), id: record.id }));
        if (!next.options.every(isStoredOption)) { fail(new Error('Há categorias inválidas nesta biblioteca.')); return; }
        loaded.add('options'); publish();
      }, fail),
      onSnapshot(doc(db, 'users', friendUid, 'profile', 'main'), snapshot => {
        if (!active || next.error) return;
        next.profile = snapshot.exists() ? snapshot.data() : null;
        loaded.add('profile'); publish();
      }, fail),
    ];
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [key, attempt]);
  const current = state.key === key ? state : { ready: false, error: '', games: [], options: [], profile: null };
  return { ...current, retry: useCallback(() => setAttempt(value => value + 1), []), options: mergeOptions(globalOptions.filter(option => option.scope === 'global'), current.options) };
}
