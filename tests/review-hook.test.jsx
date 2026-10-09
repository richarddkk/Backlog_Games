import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ listeners: [] }));
vi.mock('../src/lib/firebase.js', () => ({ db: {}, friendlyError: error => error.message }));
vi.mock('firebase/firestore', () => ({
  doc: (_, ...path) => path.join('/'),
  onSnapshot: (path, receive, fail) => { const listener = { path, receive, fail, stop: vi.fn() }; state.listeners.push(listener); return listener.stop; },
}));
import useGameReview from '../src/hooks/useGameReview.js';
const game = { title: 'Hades', genre: 'RPG', status: 'completed', rating: 4.5, coverUrl: '', review: '', rank: 1024, createdAt: 1, updatedAt: 2 };
const snapshot = (data, id = 'hades') => ({ id, exists: () => Boolean(data), data: () => data });
beforeEach(() => { state.listeners.length = 0; });

it('abre o texto compartilhado e o remove imediatamente quando a leitura é revogada', () => {
  const page = renderHook(() => useGameReview('alice', 'bob', 'hades'));
  act(() => state.listeners[0].receive(snapshot(game)));
  expect(page.result.current.ready).toBe(false);
  act(() => state.listeners[1].receive(snapshot({ text: 'Excelente!', visibility: 'friends', updatedAt: 2 })));
  expect(page.result.current.game.review).toBe('Excelente!');
  act(() => state.listeners[1].fail({ code: 'permission-denied' }));
  expect(page.result.current.game.review).toBe('');
  expect(page.result.current.unavailable).toBe(true);
  expect(page.result.current.game.rating).toBe(4.5);
});

it('mantém a review antiga e não exibe dados da conta ou jogo anterior', () => {
  const page = renderHook(({ uid, gameId }) => useGameReview(uid, 'bob', gameId), { initialProps: { uid: 'alice', gameId: 'hades' } });
  const old = [...state.listeners];
  act(() => { old[0].receive(snapshot({ ...game, review: 'Texto antigo' })); old[1].receive(snapshot(null)); });
  expect(page.result.current.game.review).toBe('Texto antigo');
  page.rerender({ uid: 'charlie', gameId: 'other' });
  expect(page.result.current.game).toBeNull();
  expect(old[0].stop).toHaveBeenCalled(); expect(old[1].stop).toHaveBeenCalled();
  act(() => old[1].receive(snapshot({ text: 'Segredo antigo', visibility: 'friends', updatedAt: 2 })));
  expect(page.result.current.game).toBeNull();
  act(() => state.listeners[2].receive(snapshot(null, 'other')));
  expect(page.result.current.ready).toBe(true);
  expect(page.result.current.game).toBeNull();
});

it('não mostra texto residual quando a amizade é removida e permite nova tentativa', () => {
  const page = renderHook(() => useGameReview('alice', 'bob', 'hades'));
  act(() => { state.listeners[0].receive(snapshot(game)); state.listeners[1].receive(snapshot({ text: 'Texto', visibility: 'friends', updatedAt: 2 })); });
  act(() => state.listeners[0].fail({ code: 'permission-denied', message: 'Sem permissão' }));
  expect(page.result.current.game).toBeNull();
  expect(page.result.current.error).toContain('amigos');
  act(() => page.result.current.retry());
  expect(state.listeners).toHaveLength(4);
  expect(page.result.current.error).toBe('');
});
