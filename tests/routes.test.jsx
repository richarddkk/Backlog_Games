import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App.jsx';
import App from '../src/App.jsx';
import { GUEST_KEY } from '../src/lib/model.js';

vi.mock('../src/lib/firebase.js', () => ({ auth: null, db: null, firebaseConfigured: false, friendlyError: error => error.message }));
beforeEach(() => { localStorage.clear(); localStorage.setItem(GUEST_KEY, JSON.stringify({ version: 1, games: [] })); });

it('navega entre biblioteca e atividades pelo Outlet mantendo o tema e o cabeçalho', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><AppRoutes /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }));
  await user.click(screen.getByRole('link', { name: 'Atividades' }));
  expect(await screen.findByRole('heading', { name: 'Atividades.' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: /Todos os jogos/ }));
  expect(screen.getByRole('heading', { name: 'Minha biblioteca.' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeTruthy();
});

it('mostra 404 em uma rota desconhecida e permite voltar para a biblioteca', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/nao-existe']}><AppRoutes /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: '404 — Página não encontrada' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: 'Voltar para a biblioteca' }));
  expect(screen.getByRole('heading', { name: 'Minha biblioteca.' })).toBeTruthy();
});

it('persiste adição e platina no histórico local e restaura ao abrir o link direto', async () => {
  const user = userEvent.setup();
  const page = render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Adicionar jogo', exact: true }));
  await user.type(screen.getByLabelText('Nome do jogo'), 'Hades');
  await user.click(screen.getByRole('button', { name: 'Selecionar Hades', exact: true }));
  await user.selectOptions(screen.getByLabelText('Sua lista'), 'planned');
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Adicionar jogo', exact: true }));
  await user.click(await screen.findByRole('button', { name: 'Editar Hades', exact: true }));
  await user.selectOptions(screen.getByLabelText('Sua lista'), 'platinum');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(GUEST_KEY)).activities).toHaveLength(2));
  await user.click(screen.getByRole('link', { name: 'Atividades' }));
  expect(window.location.hash).toBe('#/atividades');
  const items = await screen.findAllByRole('listitem');
  expect(items[0].textContent).toContain('Você platinou Hades.');
  expect(items[1].textContent).toContain('Você adicionou Hades.');
  expect(items[0].querySelector('time').getAttribute('datetime')).toBeTruthy();
  page.unmount(); render(<App />);
  expect(await screen.findByRole('heading', { name: 'Atividades.' })).toBeTruthy();
  expect((await screen.findAllByRole('listitem'))[0].textContent).toContain('Você platinou Hades.');
});

it('explica que amigos exigem login sem expor a biblioteca local', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/amigos']}><AppRoutes /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Entre na conta para adicionar amigos.' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: 'Atividades' }));
  await user.click(screen.getByRole('button', { name: 'Amigos', exact: true }));
  expect(await screen.findByText('A próxima conquista aparece aqui.')).toBeTruthy();
});
