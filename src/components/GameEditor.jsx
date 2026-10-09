import { useState } from 'react';
import { Check, LoaderCircle, Search, Trash2, ImagePlus } from 'lucide-react';
import Modal from './Modal.jsx';
import Cover from './Cover.jsx';
import Rating from './Rating.jsx';
import catalog from '../data/catalog.json';
import { normalizeText } from '../lib/model.js';
import { reviewVisibility } from '../lib/reviews.js';
import { selectableOptions } from '../lib/taxonomy.js';

export default function GameEditor({ game, initialStatus, lists, genres, onClose, onSave, onDelete }) {
  const editing = Boolean(game);
  const preferredStatus = initialStatus === 'all' ? 'planned' : initialStatus;
  const [fields, setFields] = useState(game ? { ...game, hoursPlayed: game.hoursPlayed || 0, reviewVisibility: reviewVisibility(game) } : { title: '', genre: genres.find((option) => option.id === 'Aventura' && option.active)?.id || genres.find((option) => option.active)?.id || '', status: lists.find((option) => option.id === preferredStatus && option.active)?.id || lists.find((option) => option.active)?.id || '', rating: 0, hoursPlayed: 0, coverUrl: '', review: '', reviewVisibility: 'private' });
  const [hours, setHours] = useState(game?.hoursPlayed ? String(game.hoursPlayed) : '');
  const [manualCover, setManualCover] = useState(editing);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const term = normalizeText(fields.title);
  const suggestions = term.length >= 2 ? catalog.filter((entry) => normalizeText(entry.title).includes(term)).slice(0, 6) : [];
  const change = (name, value) => setFields((current) => ({ ...current, [name]: value }));

  const changeTitle = (value) => {
    const match = catalog.find((entry) => normalizeText(entry.title) === normalizeText(value));
    setFields((current) => ({ ...current, title: value, ...(!manualCover ? { coverUrl: match?.coverUrl || '', ...(match && genres.some((option) => option.id === match.genre && option.active) ? { genre: match.genre } : {}) } : {}) }));
    setShowSuggestions(true);
  };
  const selectSuggestion = (entry) => {
    setFields((current) => ({ ...current, title: entry.title, coverUrl: entry.coverUrl, ...(genres.some((option) => option.id === entry.genre && option.active) ? { genre: entry.genre } : {}) }));
    setManualCover(false); setShowSuggestions(false);
  };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onSave({ ...fields, hoursPlayed: hours === '' ? 0 : Number(hours) }, game?.id); onClose(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setError(''); setBusy(true);
    try { await onDelete(game.id); onClose(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };

  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={editing ? 'Seu jogo, sua opinião.' : 'Mais um para a coleção.'} description={editing ? 'Atualize a lista, a nota ou os detalhes do jogo.' : 'Encontre um jogo no catálogo ou adicione o seu.'} className="game-modal" busy={busy}>
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="editor-fieldset"><div className="editor-layout"><div className="editor-art"><Cover src={fields.coverUrl} title={fields.title} className="editor-cover" /><span className="caption"><ImagePlus size={14} />{fields.coverUrl ? 'Prévia da capa' : 'Adicione uma capa'}</span></div>
        <div className="editor-fields"><div className="field search-field"><label htmlFor="game-title">Nome do jogo</label><div className="input-with-icon"><Search size={18} /><input id="game-title" value={fields.title} onChange={(event) => changeTitle(event.target.value)} onFocus={() => setShowSuggestions(true)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setShowSuggestions(false); } }} maxLength={120} required placeholder="Ex.: Hollow Knight" autoComplete="off" aria-expanded={showSuggestions && suggestions.length > 0} aria-controls={showSuggestions && suggestions.length > 0 ? 'catalog-suggestions' : undefined} /></div>
          {showSuggestions && suggestions.length > 0 && <div id="catalog-suggestions" className="suggestions" aria-label="Sugestões do catálogo">{suggestions.map((entry) => <button key={entry.steamId} type="button" aria-label={`Selecionar ${entry.title}`} onClick={() => selectSuggestion(entry)}><Cover src={entry.coverUrl} title={entry.title} /><span><strong>{entry.title}</strong><small>{entry.genre}</small></span><Check size={16} /></button>)}</div>}
          <small>Capas automáticas para {catalog.length} jogos do catálogo.</small></div>
          <div className="field-pair"><div className="field"><label htmlFor="game-genre">Gênero</label><select id="game-genre" value={fields.genre} required onChange={(event) => change('genre', event.target.value)}>{!fields.genre && <option value="">Crie um gênero nas configurações</option>}{selectableOptions(genres, fields.genre).map((option) => <option key={option.id} value={option.id}>{option.label}{!option.active ? ' (arquivado)' : ''}</option>)}</select></div><div className="field"><label htmlFor="game-status">Sua lista</label><select id="game-status" value={fields.status} required onChange={(event) => change('status', event.target.value)}>{!fields.status && <option value="">Crie uma lista nas configurações</option>}{selectableOptions(lists, fields.status).map((option) => <option key={option.id} value={option.id}>{option.label}{!option.active ? ' (arquivada)' : ''}</option>)}</select></div></div>
          <div className="field"><label>Sua nota</label><Rating value={fields.rating} onChange={(value) => change('rating', value)} /><small>Clique na metade de uma estrela para notas como 4,5.</small></div>
          <div className="field"><label htmlFor="game-hours">Horas de jogo <span className="optional">opcional</span></label><input id="game-hours" type="number" min="0" max="1000000" step="0.01" value={hours} placeholder="Ex.: 42,5" onChange={event => setHours(event.target.value)} /><small>Preencha manualmente. Você pode usar horas fracionadas, como 42,5.</small></div>
          <div className="field"><label htmlFor="game-cover">URL da capa <span className="optional">opcional</span></label><input id="game-cover" inputMode="url" value={fields.coverUrl.startsWith('/covers/') ? '' : fields.coverUrl} onChange={(event) => { setManualCover(true); change('coverUrl', event.target.value); }} maxLength={2000} placeholder={fields.coverUrl.startsWith('/covers/') ? 'Capa do catálogo selecionada' : 'https://exemplo.com/capa.jpg'} /><div className="field-help"><small>Use um link direto para uma imagem.</small>{fields.coverUrl && <button type="button" className="text-button" onClick={() => { setManualCover(true); change('coverUrl', ''); }}>Remover capa</button>}</div></div>
        </div></div>
        <div className="field review-field"><label htmlFor="game-review">Sua avaliação <span className="optional">opcional</span></label><textarea id="game-review" value={fields.review} onChange={(event) => change('review', event.target.value)} maxLength={3000} rows={3} placeholder="O que ficou dessa experiência?" /><small className="char-count">{fields.review.length.toLocaleString('pt-BR')} / 3.000</small></div>
        <div className="field review-privacy"><label htmlFor="review-visibility">Quem pode ler o texto?</label><select id="review-visibility" value={fields.reviewVisibility} onChange={event => change('reviewVisibility', event.target.value)}><option value="private">Só eu</option><option value="friends">Amigos</option><option value="public">Todos</option></select><small>Só eu mantém o texto privado. Amigos compartilha com os amigos aceitos. Todos publica seu nome, jogo, nota, lista e texto na aba Global, visível para qualquer pessoa que acessar o site. No modo local, nada é publicado. Horas, nota e coleção ficam visíveis aos amigos aceitos e também a todos se você tornar a biblioteca pública no perfil.</small></div>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      {confirmDelete ? <div className="delete-confirm" role="group" aria-label="Confirmar exclusão"><p>Excluir <strong>{game.title}</strong> da biblioteca?</p><div><button type="button" className="button secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancelar</button><button type="button" className="button danger" disabled={busy} onClick={remove}>{busy ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}Excluir jogo</button></div></div> : <div className="modal-footer">{editing ? <button type="button" className="text-button destructive" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={16} />Excluir</button> : <span />}<div><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}{busy ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar jogo'}</button></div></div>}
    </form>
  </Modal>;
}
