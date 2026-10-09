import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { validateProfile } from '../lib/profile.js';

export default function useProfile(user) {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const scope = useRef(null);
  useEffect(() => {
    scope.current = user?.uid || null;
    setProfile(null); setError(''); setReady(false);
    if (!user?.uid) return;
    let active = true;
    const fail = (failure) => { if (active) { setReady(false); setError(friendlyError(failure)); } };
    const stop = onSnapshot(doc(db, 'users', user.uid, 'profile', 'main'), (snapshot) => {
      if (!active) return;
      try {
        setProfile(snapshot.exists() ? { ...validateProfile(snapshot.data()), uid: user.uid } : null);
        setReady(true); setError('');
      } catch (failure) { fail(failure); }
    }, fail);
    return () => { active = false; stop(); };
  }, [user?.uid]);
  const save = async (value) => {
    if (!user?.uid || scope.current !== user.uid || !ready || error) throw new Error('Aguarde seu perfil carregar. Confira as regras do Firestore se aparecer um erro.');
    const clean = validateProfile(value);
    try {
      const value = { ...clean, updatedAt: Date.now() };
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', user.uid, 'profile', 'main'), value);
      batch.set(doc(db, 'publicProfiles', user.uid), value);
      await batch.commit();
    }
    catch (failure) { throw new Error(friendlyError(failure)); }
  };
  const current = profile?.uid === user?.uid ? profile : null;
  return { displayName: current?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Jogador', photoData: current?.photoData || '', bio: current?.bio || '', libraryVisibility: current?.libraryVisibility || 'friends', ready: ready && scope.current === user?.uid, error: scope.current === user?.uid ? error : '', save };
}
