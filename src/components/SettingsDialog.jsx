import { useState } from 'react';
import { Archive, Check, Globe, LockKeyhole, Pencil, Plus, RotateCcw, ShieldCheck, UserRound, LoaderCircle } from 'lucide-react';
import Modal from './Modal.jsx';
import { COLORS, ICONS } from '../lib/taxonomy.js';

const colorLabels = { green: 'Verde', blue: 'Azul', gold: 'Dourado', rose: 'Rosa', gray: 'Cinza' };
const iconLabels = { play: 'Jogar', check: 'Concluído', bookmark: 'Marcador', trophy: 'Troféu', pause: 'Pausa', library: 'Coleção' };
const initialFields = (kind) => ({ kind, label: '', color: kind === 'list' ? 'green' : 'gray', icon: kind === 'list' ? 'library' : 'bookmark', completed: false, active: true });

export default function SettingsDialog({ taxonomy, user, onClose }) {
  const [kind, setKind] = useState('list');
  const [scope, setScope] = useState('personal');
  const [editor, setEditor] = useState(null);
  const [fields, setFields] = useState(initialFields('list'));
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const canManage = scope === 'personal' || taxonomy.isAdmin;
  const options = taxonomy.options.filter((option) => option.kind === kind && option.scope === scope);
  const switchView = (nextKind, nextScope) => { setKind(nextKind); setScope(nextScope); setEditor(null); setConfirmation(null); setError(''); setMessage(''); };
  const openEditor = (option = null) => { setEditor({ option }); setFields(option || initialFields(kind)); setError(''); setMessage(''); setConfirmation(null); };
  const update = (name, value) => setFields((current) => ({ ...current, [name]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await taxonomy.saveOption(fields, editor.option, scope); setMessage(editor.option ? 'Opção atualizada. Os jogos continuam associados a ela.' : 'Opção criada. Ela já pode ser usada na biblioteca.'); setEditor(null); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const toggleActive = async () => {
    setBusy(true); setError('');
    try { await taxonomy.saveOption({ ...confirmation, active: !confirmation.active }, confirmation, scope); setMessage(confirmation.active ? 'Opção arquivada. Os jogos existentes foram preservados.' : 'Opção reativada.'); setConfirmation(null); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };

  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title="Configurações da biblioteca" description="Organize as listas e os gêneros disponíveis na sua coleção." className="settings-modal" busy={busy}>
    <div className="settings-role">{taxonomy.isAdmin ? <><ShieldCheck size={18} /><strong>Administrador</strong><span>Você também gerencia opções para todas as contas.</span></> : <><UserRound size={18} /><strong>{user ? 'Conta padrão' : 'Modo local'}</strong><span>{user ? 'Suas opções pessoais ficam somente na sua conta.' : 'Suas opções ficam neste navegador.'}</span></>}</div>
    <div className="settings-tabs" role="group" aria-label="Tipo de configuração"><button disabled={busy} aria-pressed={kind === 'list'} onClick={() => switchView('list', scope)}>Listas / categorias</button><button disabled={busy} aria-pressed={kind === 'genre'} onClick={() => switchView('genre', scope)}>Gêneros</button></div>
    <div className="settings-scopes" role="group" aria-label="Alcance da configuração"><button disabled={busy} aria-pressed={scope === 'personal'} onClick={() => switchView(kind, 'personal')}><UserRound size={16} />{user ? 'Minha conta' : 'Neste navegador'}</button><button disabled={busy} aria-pressed={scope === 'global'} onClick={() => switchView(kind, 'global')}><Globe size={16} />Opções globais</button></div>
    <p className="settings-scope-note">{scope === 'personal' ? 'Crie e personalize opções que aparecem apenas para você.' : taxonomy.isAdmin ? 'As mudanças abaixo ficam disponíveis para todas as contas. Os jogos e as avaliações continuam individuais.' : 'Estas opções estão disponíveis para todos. Apenas o administrador pode alterá-las.'}</p>
    {taxonomy.error && <div className="form-error" role="alert"><p>{taxonomy.error}</p><button className="button secondary" onClick={taxonomy.retry}>Tentar novamente</button></div>}
    {!taxonomy.ready && !taxonomy.error && <p className="settings-loading" role="status"><LoaderCircle size={18} className="spin" />Carregando configurações...</p>}
    {editor && canManage ? <form className="option-editor" onSubmit={submit}><h3>{editor.option ? 'Editar' : 'Criar'} {kind === 'list' ? 'lista / categoria' : 'gênero'}</h3><fieldset disabled={busy || !taxonomy.ready}>
      <div className="field"><label htmlFor="option-name">Nome {kind === 'list' ? 'da lista' : 'do gênero'}</label><input id="option-name" value={fields.label} onChange={(event) => update('label', event.target.value)} required maxLength={60} placeholder={kind === 'list' ? 'Ex.: Quero revisitar' : 'Ex.: Soulslike'} autoFocus /></div>
      {kind === 'list' && <><div className="field-pair"><div className="field"><label htmlFor="option-color">Cor</label><select id="option-color" value={fields.color} onChange={(event) => update('color', event.target.value)}>{COLORS.map((color) => <option key={color} value={color}>{colorLabels[color]}</option>)}</select></div><div className="field"><label htmlFor="option-icon">Ícone</label><select id="option-icon" value={fields.icon} onChange={(event) => update('icon', event.target.value)}>{ICONS.map((icon) => <option key={icon} value={icon}>{iconLabels[icon]}</option>)}</select></div></div><label className="checkbox-label"><input type="checkbox" checked={fields.completed} onChange={(event) => update('completed', event.target.checked)} /><span>Contar os jogos desta lista como concluídos</span></label></>}
      {scope === 'global' && <p className="global-change-note"><Globe size={16} />Esta alteração será aplicada para todas as contas.</p>}
      <div className="modal-footer"><span /><div><button type="button" className="button secondary" onClick={() => setEditor(null)}>Cancelar edição</button><button type="submit" className="button primary">{busy ? <LoaderCircle size={17} className="spin" /> : <Check size={17} />}{scope === 'global' ? 'Salvar para todos' : 'Salvar para mim'}</button></div></div>
    </fieldset></form> : <>
      <div className="settings-list-heading"><h3>{scope === 'global' ? 'Disponíveis para todos' : 'Suas opções pessoais'}</h3>{canManage && <button className="button secondary" disabled={busy || !taxonomy.ready} onClick={() => openEditor()}><Plus size={17} />{kind === 'list' ? 'Nova lista' : 'Novo gênero'}</button>}</div>
      <div className="options-list">{options.length ? options.map((option) => <div key={option.id} className={`option-row ${!option.active ? 'option-archived' : ''}`}><div><span className={`option-color color-${option.color}`} /><strong>{option.label}</strong><span className="option-detail">{!option.active ? 'Arquivada' : option.completed ? 'Conta como concluído' : option.builtin ? 'Padrão' : scope === 'global' ? 'Global' : 'Pessoal'}</span></div>{canManage ? <div className="option-actions"><button className="icon-button" disabled={busy || !taxonomy.ready} aria-label={`Editar ${option.label}`} onClick={() => openEditor(option)}><Pencil size={16} /></button><button className="icon-button" disabled={busy || !taxonomy.ready} aria-label={`${option.active ? 'Arquivar' : 'Reativar'} ${option.label}`} onClick={() => { setConfirmation(option); setError(''); setMessage(''); }}>{option.active ? <Archive size={16} /> : <RotateCcw size={16} />}</button></div> : <LockKeyhole size={16} aria-label="Gerenciada pelo administrador" />}</div>) : <p className="settings-empty">{kind === 'list' ? 'Você ainda não criou uma lista pessoal.' : 'Você ainda não criou um gênero pessoal.'}</p>}</div>
    </>}
    {confirmation && canManage && <div className="delete-confirm" role="group" aria-label="Confirmar alteração da opção"><p>{confirmation.active ? 'Arquivar' : 'Reativar'} <strong>{confirmation.label}</strong>{scope === 'global' ? ' para todas as contas' : ''}?</p><p className="settings-scope-note">{confirmation.active ? 'Ela deixará de aparecer para novos jogos. Os jogos já associados a ela serão mantidos e poderão ser editados.' : 'Ela voltará a aparecer ao adicionar e editar jogos.'}</p><div><button className="button secondary" disabled={busy} onClick={() => setConfirmation(null)}>Cancelar</button><button className="button primary" disabled={busy} onClick={toggleActive}>{busy ? 'Aguarde...' : confirmation.active ? 'Confirmar arquivamento' : 'Confirmar reativação'}</button></div></div>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
  </Modal>;
}
