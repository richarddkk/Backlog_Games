import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ listeners: [], set: vi.fn(async () => {}), update: vi.fn(async () => {}), remove: vi.fn(async () => {}) }));
vi.mock('../src/lib/firebase.js', () => ({ db: {}, friendlyError: error => error.message }));
vi.mock('firebase/firestore', () => ({
  collection: (_, ...parts) => parts.join('/'), doc: (_, ...parts) => parts.join('/'),
  where: (...args) => args, or: (...args) => args, query: (...args) => args,
  serverTimestamp: () => 'SERVER_TIME',
  onSnapshot: (path, receive, fail) => { const listener = { path, receive, fail, stop: vi.fn() }; state.listeners.push(listener); return listener.stop; },
  setDoc: (...args) => state.set(...args), updateDoc: (...args) => state.update(...args), deleteDoc: (...args) => state.remove(...args),
}));
import useFriends from '../src/hooks/useFriends.js';
const snapshot = entries => ({ docs: entries.map(entry => ({ id: `${entry.fromId}~${entry.toId}`, data: () => entry })) });
beforeEach(() => { state.listeners.length = 0; state.set.mockClear(); state.update.mockClear(); state.remove.mockClear(); });

it('separa pedidos recebidos/enviados de amigos aceitos e salva apenas a própria solicitação', async () => {
  const page = renderHook(() => useFriends({ uid: 'alice' }, true, 'Richard'));
  act(() => state.listeners[0].receive(snapshot([])));
  await act(async () => page.result.current.sendRequest('bob'));
  expect(state.set).toHaveBeenCalledWith('friendships/alice~bob', expect.objectContaining({ fromId: 'alice', toId: 'bob', fromName: 'Richard', toName: '', status: 'pending' }));
  act(() => state.listeners[0].receive(snapshot([
    { fromId: 'alice', toId: 'bob', status: 'pending' },
    { fromId: 'charlie', toId: 'alice', status: 'pending' },
    { fromId: 'alice', toId: 'dave', status: 'accepted' },
  ])));
  expect(page.result.current.outgoing).toHaveLength(1);
  expect(page.result.current.incoming).toHaveLength(1);
  expect(page.result.current.accepted).toHaveLength(1);
  await act(async () => page.result.current.accept('charlie~alice'));
  expect(state.update).toHaveBeenCalledWith('friendships/charlie~alice', { status: 'accepted', toName: 'Richard', updatedAt: 'SERVER_TIME' });
  await act(async () => page.result.current.remove('alice~dave'));
  expect(state.remove).toHaveBeenCalledWith('friendships/alice~dave');
  await expect(page.result.current.accept('alice~bob')).rejects.toThrow();
});

it('trocar de conta encerra a assinatura e impede callbacks antigos de exibirem amigos', () => {
  const page = renderHook(({ uid }) => useFriends({ uid }, true, uid), { initialProps: { uid: 'alice' } });
  const old = state.listeners[0];
  act(() => old.receive(snapshot([{ fromId: 'alice', toId: 'bob', status: 'accepted' }])));
  expect(page.result.current.accepted).toHaveLength(1);
  page.rerender({ uid: 'charlie' });
  expect(old.stop).toHaveBeenCalled();
  expect(page.result.current.accepted).toEqual([]);
  act(() => old.receive(snapshot([{ fromId: 'alice', toId: 'bob', status: 'accepted' }])));
  expect(page.result.current.accepted).toEqual([]);
  act(() => state.listeners[1].fail(new Error('Sem permissão')));
  expect(page.result.current.ready).toBe(false);
  expect(page.result.current.error).toContain('Sem permissão');
});
