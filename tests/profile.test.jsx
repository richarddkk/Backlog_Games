import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDialog from '../src/components/ProfileDialog.jsx';
import { preparePhoto, validateProfile } from '../src/lib/profile.js';
const profile = () => ({ displayName: 'Richard', photoData: '', ready: true, error: '', save: vi.fn(async () => {}) });
const user = { uid: 'alice', email: 'alice@example.com' };

describe('Perfil pessoal', () => {
  it('carrega o nome salvo, edita e remove a foto somente ao salvar', async () => {
    const actions = userEvent.setup(); const data = { ...profile(), photoData: 'data:image/jpeg;base64,YQ==' };
    render(<ProfileDialog user={user} profile={data} onClose={() => {}} onNotice={() => {}} />);
    expect(screen.getByLabelText('Nome de exibição').value).toBe('Richard');
    await actions.clear(screen.getByLabelText('Nome de exibição'));
    await actions.type(screen.getByLabelText('Nome de exibição'), 'Richie');
    await actions.click(screen.getByRole('button', { name: 'Remover foto' }));
    expect(data.save).not.toHaveBeenCalled();
    await actions.click(screen.getByRole('button', { name: 'Salvar perfil' }));
    expect(data.save).toHaveBeenCalledWith({ displayName: 'Richie', photoData: '' });
    await screen.findByText('Seu perfil foi atualizado.');
  });
  it('preenche o formulário quando o perfil termina de carregar e preserva falhas de salvamento', async () => {
    const data = profile(); data.save.mockRejectedValue(new Error('Sem conexão'));
    const props = { user, onClose() {}, onNotice() {} };
    const page = render(<ProfileDialog {...props} profile={{ ...data, ready: false, displayName: 'alice' }} />);
    page.rerender(<ProfileDialog {...props} profile={data} />);
    expect(screen.getByLabelText('Nome de exibição').value).toBe('Richard');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Nome de exibição').value).toBe('Richard');
  });
  it('bloqueia imagens executáveis, arquivos grandes e nomes acima do limite', async () => {
    expect(() => validateProfile({ displayName: 'X'.repeat(61), photoData: '' })).toThrow();
    expect(() => validateProfile({ displayName: 'Richie', photoData: 'javascript:alert(1)' })).toThrow();
    await expect(preparePhoto(new File(['<svg/>'], 'foto.svg', { type: 'image/svg+xml' }))).rejects.toThrow('JPG');
    await expect(preparePhoto(new File([new Uint8Array(6 * 1024 * 1024)], 'foto.jpg', { type: 'image/jpeg' }))).rejects.toThrow('5 MB');
  });
});
