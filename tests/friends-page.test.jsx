import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import FriendsPage from '../src/pages/FriendsPage.jsx';

vi.mock('../src/hooks/useFriendLibrary.js', () => ({ default: () => ({ ready: true, error: '', profile: { displayName: 'Bob', photoData: '' }, options: [{ id: 'platinum', label: 'Platinado' }, { id: 'RPG', label: 'RPG' }], games: [{ id: 'hades', title: 'Hades', genre: 'RPG', status: 'platinum', rating: 4.5, coverUrl: '', review: 'Excelente!' }] }) }));
const incoming = { id: 'bob~alice', fromId: 'bob', toId: 'alice', fromName: 'Bob', toName: '', status: 'pending' };
const notify = vi.fn();
const friends = { ready: true, error: '', busy: false, accepted: [], incoming: [], outgoing: [], sendRequest: vi.fn(async () => {}), accept: vi.fn(async () => {}), remove: vi.fn(async () => {}), retry: vi.fn() };
const library = { user: { uid: 'alice' }, taxonomy: { options: [] } };
const page = () => render(<MemoryRouter><Routes><Route element={<Outlet context={{ library, friends, notify }} />}><Route index element={<FriendsPage />} /></Route></Routes></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); friends.accepted = []; friends.incoming = []; friends.outgoing = []; });

it('envia o código informado e oferece aceitar ou recusar pedidos recebidos', async () => {
  friends.incoming = [incoming];
  const user = userEvent.setup(); page();
  expect(screen.getByLabelText('Seu código de amigo').value).toBe('alice');
  await user.type(screen.getByLabelText('Código do seu amigo'), 'charlie');
  await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));
  expect(friends.sendRequest).toHaveBeenCalledWith('charlie');
  await user.click(screen.getByRole('button', { name: 'Aceitar' }));
  expect(friends.accept).toHaveBeenCalledWith('bob~alice');
  await user.click(screen.getByRole('button', { name: 'Recusar' }));
  expect(friends.remove).toHaveBeenCalledWith('bob~alice');
});

it('mostra a coleção do amigo sem controles de edição e confirma antes de remover a amizade', async () => {
  friends.accepted = [{ ...incoming, toName: 'Alice', status: 'accepted' }];
  const user = userEvent.setup(); page();
  await user.click(screen.getByRole('button', { name: 'Ver biblioteca' }));
  expect(screen.getByRole('heading', { name: 'Biblioteca de Bob.' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Hades' })).toBeTruthy();
  expect(screen.getByText('Excelente!')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Editar Hades' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Voltar aos amigos' }));
  await user.click(screen.getByRole('button', { name: 'Remover amigo' }));
  expect(friends.remove).not.toHaveBeenCalled();
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar remoção' }));
  expect(friends.remove).toHaveBeenCalledWith('bob~alice');
});
