import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { conversationId, validateMessage } from '../lib/conversations.js';

export default function useConversation(uid, friendUid) {
  const key = JSON.stringify([uid, friendUid]);
  const [state, setState] = useState({ key: '', ready: false, messages: [], error: '' });
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const scope = useRef(null);
  useEffect(() => {
    const session = { key, uid, friendUid, ready: false };
    scope.current = session; setBusy(false);
    setState({ key, ready: !uid || !friendUid, messages: [], error: '' });
    if (!uid || !friendUid || !db) return;
    const id = conversationId(uid, friendUid);
    const stop = onSnapshot(query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'desc'), limit(100)), snapshot => {
      if (scope.current !== session) return;
      const messages = snapshot.docs.map(record => {
        const value = record.data({ serverTimestamps: 'estimate' });
        return { ...value, id: record.id, createdAt: value.createdAt?.toMillis?.() ?? 0, pending: record.metadata?.hasPendingWrites || false };
      }).reverse();
      if (messages.some(message => ![uid, friendUid].includes(message.senderId) || typeof message.text !== 'string' || !message.text.trim() || message.text.length > 2000)) {
        session.ready = false; setState({ key, ready: false, messages: [], error: 'Há mensagens inválidas nesta conversa.' }); return;
      }
      session.ready = true; setState({ key, ready: true, messages, error: '' });
    }, failure => {
      if (scope.current !== session) return;
      session.ready = false; setState({ key, ready: false, messages: [], error: `Conversa indisponível. Confira se vocês ainda são amigos. ${friendlyError(failure)}` });
    });
    return () => { if (scope.current === session) scope.current = null; stop(); };
  }, [key, attempt]);
  const send = async text => {
    const session = scope.current;
    if (!uid || !friendUid || session?.key !== key || !session.ready) throw new Error('Aguarde a conversa carregar.');
    const message = validateMessage(text);
    const id = conversationId(uid, friendUid);
    setBusy(true);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'conversations', id), { participants: [uid, friendUid].sort(), updatedAt: serverTimestamp() });
      batch.set(doc(collection(db, 'conversations', id, 'messages')), { senderId: uid, text: message, createdAt: serverTimestamp() });
      await batch.commit();
    } catch (failure) { throw new Error(friendlyError(failure)); }
    finally { if (scope.current === session) setBusy(false); }
  };
  return { ...(state.key === key ? state : { ready: false, messages: [], error: '' }), busy: state.key === key && busy, send, retry: useCallback(() => setAttempt(value => value + 1), []) };
}
