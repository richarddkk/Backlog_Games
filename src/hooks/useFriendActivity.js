import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { isActivity, readActivityDocument, RECENT_ACTIVITY_LIMIT, sortActivities } from '../lib/activity.js';

export default function useFriendActivity(ownUid, friendIds) {
  const ids = [...new Set(friendIds)].sort();
  const key = JSON.stringify([ownUid || null, ids]);
  const [state, setState] = useState({ key: '', events: [], ready: false, error: '' });
  useEffect(() => {
    let active = true;
    const entries = new Map();
    const loaded = new Set();
    const errors = new Map();
    const publish = () => {
      if (active) setState({ key, events: sortActivities([...entries.values()].flat()), ready: loaded.size === ids.length, error: [...errors.values()].join(' ') });
    };
    publish();
    const stops = ids.map(uid => onSnapshot(query(collection(db, 'users', uid, 'activities'), orderBy('createdAt', 'desc'), limit(RECENT_ACTIVITY_LIMIT)), snapshot => {
      if (!active) return;
      const events = snapshot.docs.map(readActivityDocument);
      entries.set(uid, events.filter(isActivity)); loaded.add(uid); errors.delete(uid); publish();
    }, failure => {
      if (!active) return;
      entries.delete(uid); loaded.add(uid); errors.set(uid, `Não foi possível ler as atividades de um amigo. ${friendlyError(failure)}`); publish();
    }));
    return () => { active = false; stops.forEach(stop => stop()); };
    // key encodes the complete set of accounts and prevents old-account data from rendering.
  }, [key]);
  return state.key === key ? state : { events: [], ready: false, error: '' };
}
