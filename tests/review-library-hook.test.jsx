import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ authCallback: null, listeners: [], batches: [] }));
vi.mock('../src/lib/firebase.js', () => ({ auth: {}, db: {}, firebaseConfigured: true, friendlyError: error => error.message }));
vi.mock('../src/hooks/useTaxonomy.js', () => ({ default: () => ({ ready: true, lists: [{ id: 'completed', label: 'Zerado', active: true }], genres: [{ id: 'RPG', active: true }] }) }));
vi.mock('../src/hooks/useProfile.js', () => ({ default: () => ({ displayName: 'Alice' }) }));
vi.mock('firebase/auth', () => ({ onAuthStateChanged: (_, callback) => { state.authCallback = callback; return vi.fn(); }, signOut: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  collection: (_, ...parts) => parts.join('/'), doc: (_, ...parts) => parts.join('/'),
  query: path => path, limit: vi.fn(), orderBy: vi.fn(), serverTimestamp: () => 'SERVER_TIME', updateDoc: vi.fn(),
  onSnapshot: (path, ...args) => { const [receive, fail] = typeof args[0] === 'object' ? args.slice(1) : args; const listener = { path, receive, fail, stop: vi.fn() }; state.listeners.push(listener); return listener.stop; },
  writeBatch: () => { const batch = { set: vi.fn(), delete: vi.fn(), commit: vi.fn(async () => {}) }; state.batches.push(batch); return batch; },
}));
import useLibrary from '../src/hooks/useLibrary.js';
const game = { id: 'hades', title: 'Hades', genre: 'RPG', status: 'completed', rating: 4.5, coverUrl: '', review: '', rank: 1024, createdAt: 1, updatedAt: 2 };
const snapshot = entries => ({ docs: entries.map(({ id, ...data }) => ({ id, data: () => data })), metadata: { hasPendingWrites: false, fromCache: false } });
const listener = suffix => state.listeners.find(entry => entry.path.endsWith(suffix));
beforeEach(() => { state.listeners.length = 0; state.batches.length = 0; });

it('espera reviews carregarem, hidrata o texto privado e o salva fora do jogo compartilhado', async () => {
  const page = renderHook(() => useLibrary());
  act(() => state.authCallback({ uid: 'alice' }));
  act(() => listener('/games').receive(snapshot([game])));
  expect(page.result.current.ready).toBe(false);
  act(() => listener('/reviews').receive(snapshot([{ id: 'hades', text: 'Meu texto privado', visibility: 'private', updatedAt: 2 }])));
  expect(page.result.current.ready).toBe(true);
  expect(page.result.current.games[0]).toMatchObject({ review: 'Meu texto privado', reviewVisibility: 'private' });
  await act(async () => page.result.current.saveGame({ ...page.result.current.games[0], review: 'Atualizado' }, 'hades'));
  expect(state.batches[0].set).toHaveBeenCalledWith('users/alice/games/hades', expect.objectContaining({ review: '', rating: 4.5 }));
  expect(state.batches[0].set.mock.calls[0][1]).not.toHaveProperty('reviewVisibility');
  expect(state.batches[0].set).toHaveBeenCalledWith('users/alice/reviews/hades', expect.objectContaining({ text: 'Atualizado', visibility: 'private' }));
  await act(async () => page.result.current.removeGame('hades'));
  expect(state.batches[1].delete).toHaveBeenCalledWith('users/alice/games/hades');
  expect(state.batches[1].delete).toHaveBeenCalledWith('users/alice/reviews/hades');
  expect(state.batches[1].delete).toHaveBeenCalledWith('publicReviews/alice~hades');
  await act(async () => page.result.current.saveGame({ ...page.result.current.games[0], reviewVisibility: 'public', review: 'Texto público' }, 'hades'));
  expect(state.batches[2].set).toHaveBeenCalledWith('publicReviews/alice~hades', expect.objectContaining({ actorId: 'alice', actorName: 'Alice', text: 'Texto público', visibility: 'public', rating: 4.5, status: 'completed', updatedAt: 'SERVER_TIME' }));
  await act(async () => page.result.current.saveGame({ ...page.result.current.games[0], reviewVisibility: 'friends', review: 'Só amigos' }, 'hades'));
  expect(state.batches[3].delete).toHaveBeenCalledWith('publicReviews/alice~hades');
});

it('uma falha nas reviews bloqueia edição para evitar sobrescrever avaliações não carregadas', async () => {
  const page = renderHook(() => useLibrary());
  act(() => state.authCallback({ uid: 'alice' }));
  act(() => listener('/games').receive(snapshot([game])));
  act(() => listener('/reviews').fail(new Error('Sem permissão')));
  act(() => listener('/games').receive(snapshot([game])));
  expect(page.result.current.ready).toBe(false);
  await expect(page.result.current.saveGame({ ...game, review: 'Perda' }, 'hades')).rejects.toThrow('Aguarde');
  expect(state.batches).toHaveLength(0);
});
