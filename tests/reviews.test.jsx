import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import App from '../src/App.jsx';
import ReviewsPage from '../src/pages/ReviewsPage.jsx';
import ActivitiesPage from '../src/pages/ActivitiesPage.jsx';
import { GUEST_KEY, validateGame } from '../src/lib/model.js';
import { mergeReview } from '../src/lib/reviews.js';

vi.mock('../src/lib/firebase.js', () => ({ auth: null, db: null, firebaseConfigured: false, friendlyError: error => error.message }));
const state = vi.hoisted(() => ({ remote: { ready: true, game: null, error: '', unavailable: false }, general: [], global: [] }));
vi.mock('../src/hooks/useReviewFeed.js', () => ({ default: (_, __, global) => ({ ready: true, posts: global ? state.global : state.general, error: '', retry: vi.fn() }) }));
vi.mock('../src/hooks/useGameReview.js', () => ({ default: () => ({ ...state.remote, retry: vi.fn() }) }));
vi.mock('../src/hooks/useFriendActivity.js', () => ({ default: () => ({ ready: true, events: [{ id: 'event', actorId: 'bob', actorName: 'Bob', gameId: 'hades', gameTitle: 'Hades', type: 'status', status: 'completed', statusLabel: 'Zerado', coverUrl: '', createdAt: 100 }], error: '' }) }));
const game = { id: 'hades', title: 'Hades', genre: 'RPG', status: 'completed', rating: 4.5, coverUrl: '', review: '', rank: 1024, createdAt: 1, updatedAt: 2 };
beforeEach(() => { localStorage.clear(); localStorage.setItem(GUEST_KEY, JSON.stringify({ version: 1, games: [] })); window.location.hash = ''; state.general = []; state.global = []; });

it('usa privacidade por padrão, preserva a escolha e permite compartilhar ao editar', async () => {
  const user = userEvent.setup(); render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Adicionar jogo', exact: true }));
  expect(screen.getByLabelText('Quem pode ler o texto?').value).toBe('private');
  await user.type(screen.getByLabelText('Nome do jogo'), 'Meu jogo');
  await user.type(screen.getByLabelText(/Sua avaliação/), 'Uma experiência incrível.');
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Adicionar jogo', exact: true }));
  await user.click(await screen.findByRole('button', { name: 'Editar Meu jogo', exact: true }));
  expect(screen.getByLabelText('Quem pode ler o texto?').value).toBe('private');
  await user.selectOptions(screen.getByLabelText('Quem pode ler o texto?'), 'friends');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(GUEST_KEY)).games[0].reviewVisibility).toBe('friends'));
});

it('mantém as atividades como notificações, separadas das reviews', () => {
  const library = { user: { uid: 'alice' }, activities: [], activityReady: true, ready: true, games: [] };
  const friends = { ready: true, accepted: [{ fromId: 'alice', toId: 'bob', status: 'accepted' }] };
  render(<MemoryRouter><Routes><Route element={<Outlet context={{ library, friends }} />}><Route index element={<ActivitiesPage />} /></Route></Routes></MemoryRouter>);
  expect(screen.getByRole('listitem').textContent).toContain('Bob zerou Hades.');
  expect(screen.queryByRole('button', { name: /Ver avaliação/ })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('separa reviews próprias e de amigos das globais, exibindo nota e situação do jogo', async () => {
  const post = { actorId: 'bob', actorName: 'Bob', gameId: 'hades', gameTitle: 'Hades', status: 'platinum', statusLabel: 'Platinado', genreLabel: 'RPG', rating: 4.5, text: 'Combate incrível!', visibility: 'friends', coverUrl: '', updatedAt: 100 };
  state.general = [post];
  state.global = [{ ...post, actorId: 'charlie', actorName: 'Charlie', visibility: 'public', text: 'Review para todo mundo.', status: 'dropped', statusLabel: 'Desistiu' }];
  const library = { user: { uid: 'alice' }, profile: { displayName: 'Alice' }, games: [{ ...game, review: 'Meu texto privado', reviewVisibility: 'private' }], ready: true, taxonomy: { lists: [], genres: [], options: [] } };
  const friends = { ready: true, accepted: [{ fromId: 'alice', toId: 'bob', fromName: 'Alice', toName: 'Bob', status: 'accepted' }] };
  render(<MemoryRouter><Routes><Route element={<Outlet context={{ library, friends }} />}><Route index element={<ReviewsPage />} /></Route></Routes></MemoryRouter>);
  const user = userEvent.setup();
  expect(screen.getByText('Combate incrível!')).toBeTruthy();
  expect(screen.getByText('Meu texto privado')).toBeTruthy();
  expect(screen.getByText('Platinado')).toBeTruthy();
  expect(screen.queryByText('Review para todo mundo.')).toBeNull();
  await user.click(screen.getByRole('tab', { name: 'Global' }));
  expect(screen.getByText('Review para todo mundo.')).toBeTruthy();
  expect(screen.getByText('Desistiu')).toBeTruthy();
  expect(screen.getByLabelText('4,5 de 5 estrelas')).toBeTruthy();
  expect(screen.queryByText('Meu texto privado')).toBeNull();
  expect(screen.queryByText('Combate incrível!')).toBeNull();
});

it('usa a rota Reviews com Outlet e mantém o cabeçalho ao voltar às atividades', async () => {
  const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('link', { name: 'Reviews', exact: true }));
  expect(await screen.findByRole('heading', { name: 'Reviews.' })).toBeTruthy();
  expect(window.location.hash).toBe('#/reviews');
  expect(screen.getByRole('tab', { name: 'Geral' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: 'Atividades', exact: true }));
  expect(await screen.findByRole('heading', { name: 'Atividades.' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Minha conta' })).toBeTruthy();
});

it('preserva o acesso das reviews antigas e rejeita uma visibilidade inválida', () => {
  expect(mergeReview({ ...game, review: 'Antiga' }, null)).toMatchObject({ review: 'Antiga', reviewVisibility: 'friends' });
  expect(validateGame(game)).toMatchObject({ reviewVisibility: 'private' });
  expect(validateGame({ ...game, reviewVisibility: 'public' })).toMatchObject({ reviewVisibility: 'public' });
  expect(() => validateGame({ ...game, reviewVisibility: 'unknown' })).toThrow();
});

it('navega pelas abas de reviews com teclado', async () => {
  const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole('link', { name: 'Reviews', exact: true }));
  screen.getByRole('tab', { name: 'Geral' }).focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Global' }).getAttribute('aria-selected')).toBe('true');
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Global' }));
  await user.keyboard('{Home}');
  expect(screen.getByRole('tab', { name: 'Geral' }).getAttribute('aria-selected')).toBe('true');
});
