import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';

// A chave impede que um snapshot de outra página apareça após navegar ou sair.
export default function usePublicDocument(collectionName, id, reader = value => value.data()) {
  const key = `${collectionName}/${id || ''}`;
  const [state, setState] = useState({ key: '', ready: false, data: null, error: '' });
  useEffect(() => {
    let active = true;
    setState({ key, ready: false, data: null, error: '' });
    if (!db || !id) { setState({ key, ready: true, data: null, error: '' }); return; }
    const stop = onSnapshot(doc(db, collectionName, id), snapshot => {
      if (!active) return;
      try { setState({ key, ready: true, data: snapshot.exists() ? reader(snapshot) : null, error: '' }); }
      catch { setState({ key, ready: true, data: null, error: 'Os dados desta página são inválidos.' }); }
    }, failure => { if (active) setState({ key, ready: true, data: null, error: friendlyError(failure) }); });
    return () => { active = false; stop(); };
  }, [key]);
  return state.key === key ? state : { ready: false, data: null, error: '' };
}
