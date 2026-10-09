import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ listeners: [], write: vi.fn(async () => {}) }));
vi.mock('../src/lib/firebase.js', () => ({ db: {}, friendlyError: error => error.message }));
vi.mock('firebase/firestore', () => ({
  doc: (_, ...path) => path.join('/'),
  onSnapshot: (path, receive, fail) => { const listener = { path, receive, fail, stop: vi.fn() }; state.listeners.push(listener); return listener.stop; },
  writeBatch: () => ({ set: (...args) => state.write(...args), commit: async () => {} }),
}));
import useProfile from '../src/hooks/useProfile.js';
beforeEach(() => { state.listeners.length = 0; state.write.mockClear(); });
it('carrega e salva o perfil individual sem outra integração e ignora eventos da conta anterior', async () => {
  const alice = { uid: 'alice', email: 'alice@example.com' };
  const bob = { uid: 'bob', email: 'bob@example.com' };
  const page = renderHook(({ user }) => useProfile(user), { initialProps: { user: alice } });
  expect(state.listeners).toHaveLength(1);
  expect(state.listeners[0].path).toBe('users/alice/profile/main');
  act(() => state.listeners[0].receive({ exists: () => true, data: () => ({ displayName: 'Richie', photoData: '' }) }));
  expect(page.result.current.ready).toBe(true);
  expect(page.result.current.displayName).toBe('Richie');
  await act(async () => page.result.current.save({ displayName: 'Richard', photoData: 'data:image/jpeg;base64,YQ==' }));
  expect(state.write).toHaveBeenCalledWith('users/alice/profile/main', expect.objectContaining({ displayName: 'Richard', photoData: 'data:image/jpeg;base64,YQ==', updatedAt: expect.any(Number) }));
  expect(state.write).toHaveBeenCalledWith('publicProfiles/alice', expect.objectContaining({ displayName: 'Richard', bio: '', libraryVisibility: 'friends' }));
  page.rerender({ user: bob });
  expect(state.listeners[0].stop).toHaveBeenCalled();
  act(() => state.listeners[0].receive({ exists: () => true, data: () => ({ displayName: 'Nome antigo', photoData: '' }) }));
  expect(page.result.current.displayName).toBe('bob');
  act(() => state.listeners[1].fail(new Error('Sem conexão')));
  expect(page.result.current.ready).toBe(false);
  act(() => state.listeners[1].receive({ exists: () => false }));
  expect(page.result.current.ready).toBe(true);
  expect(page.result.current.error).toBe('');
});
