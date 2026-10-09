import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ listeners: [] }));
vi.mock('../src/lib/firebase.js', () => ({ db: {}, friendlyError: error => error.message }));
vi.mock('firebase/firestore', () => ({
  collection: (_, ...parts) => parts.join('/'), doc: (_, ...parts) => parts.join('/'),
  where: (...args) => args, orderBy: (...args) => args, limit: value => value, query: (path, ...constraints) => ({ path, constraints }),
  onSnapshot: (reference, receive, fail) => { const listener = { path: reference.path || reference, reference, receive, fail, stop: vi.fn() }; state.listeners.push(listener); return listener.stop; },
}));
import useReviewFeed from '../src/hooks/useReviewFeed.js';
const game = { id: 'hades', title: 'Hades', genre: 'RPG', status: 'platinum', rating: 4.5, coverUrl: '', review: '', rank: 1, createdAt: 1, updatedAt: 10 };
const post = { actorId: 'bob', actorName: 'Bob', gameId: 'hades', gameTitle: 'Hades', genreLabel: 'RPG', status: 'platinum', statusLabel: 'Platinado', rating: 4.5, coverUrl: '', text: 'Excelente!', visibility: 'public', updatedAt: { toMillis: () => 200 } };
const snapshot = entries => ({ docs: entries.map(({ id = 'hades', ...data }) => ({ id, data: () => data })) });
const byPath = path => state.listeners.find(entry => entry.path === path);
beforeEach(() => { state.listeners.length = 0; });

it('consulta apenas textos compartilhados e mantém reviews antigas de amigos legíveis', () => {
  const page = renderHook(() => useReviewFeed('alice', ['bob'], false));
  expect(byPath('users/bob/reviews').reference.constraints).toEqual([['visibility', 'in', ['friends', 'public']]]);
  act(() => {
    byPath('users/bob/games').receive(snapshot([game, { ...game, id: 'old', title: 'Antigo', review: 'Review antiga' }]));
    byPath('users/bob/reviews').receive(snapshot([{ id: 'hades', text: 'Só para amigos', visibility: 'friends', updatedAt: 50 }]));
    byPath('users/bob/options').receive(snapshot([]));
    byPath('users/bob/profile/main').receive({ exists: () => true, data: () => ({ displayName: 'Bob atual' }) });
  });
  expect(page.result.current.ready).toBe(true);
  expect(page.result.current.posts[0]).toMatchObject({ text: 'Só para amigos', actorName: 'Bob atual', statusLabel: 'Platinado' });
  expect(page.result.current.posts[1].text).toBe('Review antiga');
  act(() => byPath('users/bob/reviews').receive(snapshot([])));
  expect(page.result.current.posts.map(entry => entry.text)).toEqual(['Review antiga']);
});

it('consulta o feed público sem login e remove uma publicação retirada pelo autor', () => {
  const page = renderHook(() => useReviewFeed(null, [], true));
  const listener = byPath('publicReviews');
  expect(listener.reference.constraints).toEqual([['updatedAt', 'desc'], 100]);
  act(() => listener.receive(snapshot([post])));
  expect(page.result.current.posts[0]).toMatchObject({ text: 'Excelente!', visibility: 'public', updatedAt: 200 });
  act(() => listener.receive(snapshot([])));
  expect(page.result.current.posts).toEqual([]);
  act(() => listener.receive(snapshot([{ ...post, visibility: 'private' }])));
  expect(page.result.current.posts).toEqual([]);
  expect(page.result.current.error).toContain('inválidas');
});

it('remove textos ao desfazer amizade, trocar conta ou mudar de feed e ignora callbacks antigos', () => {
  const page = renderHook(({ uid, friends, global }) => useReviewFeed(uid, friends, global), { initialProps: { uid: 'alice', friends: ['bob'], global: false } });
  const previous = [...state.listeners];
  act(() => {
    byPath('users/bob/games').receive(snapshot([game]));
    byPath('users/bob/reviews').receive(snapshot([{ id: 'hades', text: 'Amigos', visibility: 'friends', updatedAt: 2 }]));
    byPath('users/bob/options').receive(snapshot([]));
    byPath('users/bob/profile/main').receive({ exists: () => false });
  });
  expect(page.result.current.posts).toHaveLength(1);
  page.rerender({ uid: 'alice', friends: [], global: false });
  expect(page.result.current.posts).toEqual([]);
  previous.forEach(listener => expect(listener.stop).toHaveBeenCalled());
  act(() => previous[1].receive(snapshot([{ id: 'hades', text: 'Residual', visibility: 'friends', updatedAt: 3 }])));
  expect(page.result.current.posts).toEqual([]);
  page.rerender({ uid: 'charlie', friends: [], global: true });
  expect(page.result.current.posts).toEqual([]);
  act(() => byPath('publicReviews').fail(new Error('Conexão indisponível')));
  expect(page.result.current.ready).toBe(true);
  expect(page.result.current.error).toContain('Conexão indisponível');
});
