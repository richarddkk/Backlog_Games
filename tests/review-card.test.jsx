import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReviewCard from '../src/components/ReviewCard.jsx';

it('expande e recolhe textos longos sem perder nota, situação ou público', async () => {
  const user = userEvent.setup();
  const text = 'Uma experiência excelente. '.repeat(35) + 'Última frase da opinião.';
  render(<MemoryRouter><ReviewCard post={{ actorId: 'alice', actorName: 'Alice', gameId: 'hades', gameTitle: 'Hades', coverUrl: '', rating: 4.5, status: 'platinum', statusLabel: 'Platinado', visibility: 'public', text, updatedAt: 100 }} /></MemoryRouter>);
  expect(screen.queryByText(/Última frase da opinião/)).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Ler review completa' }));
  expect(screen.getByText(/Última frase da opinião/)).toBeTruthy();
  expect(screen.getByLabelText('4,5 de 5 estrelas')).toBeTruthy();
  expect(screen.getByText('Platinado')).toBeTruthy();
  expect(screen.getByText('Todos')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Alice' }).getAttribute('href')).toBe('/perfil/alice');
  expect(screen.getByRole('link', { name: 'Hades' }).getAttribute('href')).toBe('/reviews/alice/hades');
  await user.click(screen.getByRole('button', { name: 'Mostrar menos' }));
  expect(screen.queryByText(/Última frase da opinião/)).toBeNull();
});
