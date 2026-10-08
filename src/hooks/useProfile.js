import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { validateProfile } from '../lib/profile.js';

export default function useProfile(user) {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setProfile(null); setError(''); setReady(false);
    if (!user?.uid) return;
    let active = true;
    const fail = (failure) => { if (active) { setReady(false); setError(friendlyError(failure)); } };
    const stop = onSnapshot(doc(db, 'users', user.uid, 'profile', 'main'), (snapshot) => {
      if (!active) return;
      try {
        setProfile(snapshot.exists() ? validateProfile(snapshot.data()) : null);
        setReady(true); setError('');
      } catch (failure) { fail(failure); }
    }, fail);
    return () => { active = false; stop(); };
  }, [user?.uid]);
  const save = async (value) => {
    if (!user?.uid || !ready || error) throw new Error('Aguarde seu perfil carregar. Confira as regras do Firestore se aparecer um erro.');
    const clean = validateProfile(value);
    try { await setDoc(doc(db, 'users', user.uid, 'profile', 'main'), { ...clean, updatedAt: Date.now() }); }
    catch (failure) { throw new Error(friendlyError(failure)); }
  };
  return { displayName: profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Jogador', photoData: profile?.photoData || '', ready, error, save };
}
