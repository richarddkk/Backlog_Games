import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { OPTIONS_KEY, DEFAULT_OPTIONS, checkOptionName, isStoredOption, mergeOptions, validateOption } from '../lib/taxonomy.js';

export function loadLocalOptions() {
  const raw = localStorage.getItem(OPTIONS_KEY);
  if (raw === null) return [];
  const stored = JSON.parse(raw);
  if (stored.version !== 1 || !Array.isArray(stored.options) || !stored.options.every(isStoredOption)) throw new Error('As configurações locais não puderam ser lidas. Elas foram preservadas.');
  return stored.options;
}

export default function useTaxonomy(user, authReady) {
  const [globals, setGlobals] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const context = useRef({ uid: null, ready: false, isAdmin: false, globals: [], personal: [] });

  useEffect(() => {
    if (!authReady) return;
    const uid = user?.uid || null;
    const state = { uid, ready: false, isAdmin: false, failed: false, globals: [], personal: [] };
    context.current = state;
    setGlobals([]); setPersonal([]); setIsAdmin(false); setReady(false); setError('');
    if (!uid) {
      try { state.personal = loadLocalOptions(); state.ready = true; setPersonal(state.personal); setReady(true); }
      catch (failure) { setError(failure.message); }
      return;
    }
    const loaded = new Set();
    const fail = (failure) => {
      if (context.current !== state) return;
      state.ready = false; state.failed = true; setReady(false); setError(friendlyError(failure));
    };
    const recordLoaded = (key) => {
      loaded.add(key);
      if (loaded.size === 3 && !state.failed) { state.ready = true; setReady(true); setError(''); }
    };
    const readOptions = (snapshot, scope) => {
      if (context.current !== state) return;
      const options = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id, scope }));
      if (!options.every(isStoredOption)) { fail(new Error('Existem configurações inválidas no banco. Confira os documentos de listas e gêneros.')); return; }
      state[scope === 'global' ? 'globals' : 'personal'] = options;
      if (scope === 'global') setGlobals(options); else setPersonal(options);
      recordLoaded(scope);
    };
    const unsubscribes = [
      onSnapshot(collection(db, 'taxonomy'), (snapshot) => readOptions(snapshot, 'global'), fail),
      onSnapshot(collection(db, 'users', uid, 'options'), (snapshot) => readOptions(snapshot, 'personal'), fail),
      onSnapshot(doc(db, 'admins', uid), (snapshot) => {
        if (context.current !== state) return;
        state.isAdmin = snapshot.exists() && snapshot.data().enabled === true;
        setIsAdmin(state.isAdmin); recordLoaded('role');
      }, fail),
    ];
    return () => { state.ready = false; unsubscribes.forEach((unsubscribe) => unsubscribe()); };
  }, [user?.uid, authReady, retryKey]);

  const options = useMemo(() => mergeOptions(globals, personal), [globals, personal]);
  const saveOption = async (fields, existing = null, scope = 'personal') => {
    const current = context.current;
    if (!current.ready || (user?.uid || null) !== current.uid) throw new Error('Aguarde as configurações carregarem.');
    if (scope === 'global' && !current.isAdmin) throw new Error('Somente o administrador pode alterar opções globais.');
    if (!['global', 'personal'].includes(scope)) throw new Error('Escolha um destino válido.');
    const existingOption = existing && mergeOptions(current.globals, current.personal).find((entry) => entry.id === existing.id);
    if (existing && (!existingOption || existingOption.scope !== scope)) throw new Error('A opção não está mais disponível para edição.');
    const clean = validateOption(fields);
    if (existingOption && existingOption.kind !== clean.kind) throw new Error('O tipo de uma opção existente não pode ser alterado.');
    checkOptionName(mergeOptions(current.globals, current.personal), clean, existingOption?.id);
    const id = existingOption?.id || `${scope === 'global' ? 'global' : 'personal'}-${crypto.randomUUID()}`;
    const now = Math.max(Date.now(), existingOption?.createdAt || 0);
    const record = { ...clean, createdAt: existingOption?.createdAt ?? now, updatedAt: now };
    setSaving(true);
    try {
      if (current.uid) await setDoc(scope === 'global' ? doc(db, 'taxonomy', id) : doc(db, 'users', current.uid, 'options', id), record);
      else {
        if (DEFAULT_OPTIONS.some((entry) => entry.id === id)) throw new Error('As opções padrão são gerenciadas pelo administrador.');
        const next = [...current.personal.filter((entry) => entry.id !== id), { ...record, id, scope: 'personal' }];
        localStorage.setItem(OPTIONS_KEY, JSON.stringify({ version: 1, options: next }));
        current.personal = next; setPersonal(next);
      }
    } catch (failure) { throw new Error(friendlyError(failure)); }
    finally { setSaving(false); }
  };

  const lists = options.filter((option) => option.kind === 'list');
  const genres = options.filter((option) => option.kind === 'genre');
  return { options, lists, genres, isAdmin, ready, error, saving, saveOption, retry: useCallback(() => setRetryKey((key) => key + 1), []) };
}
