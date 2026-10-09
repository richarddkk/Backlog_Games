import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, or, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { friendshipId, otherUid, parseFriendCode } from '../lib/friends.js';

export default function useFriends(user, authReady, displayName) {
  const [state, setState] = useState({ uid: null, ready: false, entries: [], error: '' });
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const scope = useRef(null);
  const uid = user?.uid || null;
  const current = state.uid === uid ? state : { uid, ready: false, entries: [], error: '' };

  useEffect(() => {
    const session = { uid, ready: false, entries: [] };
    scope.current = session;
    setState({ ...session, error: '' }); setBusy(false);
    if (!authReady || !uid) {
      session.ready = authReady;
      setState({ ...session, error: '' });
      return;
    }
    const requests = query(collection(db, 'friendships'), or(where('fromId', '==', uid), where('toId', '==', uid)));
    const stop = onSnapshot(requests, snapshot => {
      if (scope.current !== session) return;
      session.entries = snapshot.docs.map(record => ({ ...record.data(), id: record.id }));
      session.ready = true;
      setState({ ...session, error: '' });
    }, failure => {
      if (scope.current !== session) return;
      session.ready = false;
      setState({ ...session, error: `Não foi possível carregar os amigos. ${friendlyError(failure)} Publique as regras da versão 1.3.` });
    });
    return () => { if (scope.current === session) scope.current = null; stop(); };
  }, [uid, authReady, attempt]);

  const write = async operation => {
    const session = scope.current;
    if (!uid || session?.uid !== uid || !session.ready) throw new Error('Entre na conta e aguarde os amigos carregarem.');
    setBusy(true);
    try { await operation(session); }
    catch (error) { throw new Error(friendlyError(error)); }
    finally { if (scope.current === session) setBusy(false); }
  };
  const sendRequest = code => write(async session => {
    const toId = parseFriendCode(code, uid);
    if (session.entries.some(entry => otherUid(entry, uid) === toId)) throw new Error('Já existe uma amizade ou pedido entre vocês. Confira a lista abaixo.');
    await setDoc(doc(db, 'friendships', friendshipId(uid, toId)), {
      fromId: uid, toId, fromName: (displayName || 'Jogador').slice(0, 60), toName: '',
      status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  });
  const accept = id => write(async session => {
    const entry = session.entries.find(item => item.id === id && item.toId === uid && item.status === 'pending');
    if (!entry) throw new Error('Este pedido não está mais disponível.');
    await updateDoc(doc(db, 'friendships', id), { status: 'accepted', toName: (displayName || 'Jogador').slice(0, 60), updatedAt: serverTimestamp() });
  });
  const remove = id => write(async session => {
    if (!session.entries.some(entry => entry.id === id)) throw new Error('Este pedido ou amizade não está mais disponível.');
    await deleteDoc(doc(db, 'friendships', id));
  });
  return {
    ready: current.ready, error: current.error, busy,
    accepted: current.entries.filter(entry => entry.status === 'accepted'),
    incoming: current.entries.filter(entry => entry.status === 'pending' && entry.toId === uid),
    outgoing: current.entries.filter(entry => entry.status === 'pending' && entry.fromId === uid),
    sendRequest, accept, remove, retry: useCallback(() => setAttempt(value => value + 1), []),
  };
}
