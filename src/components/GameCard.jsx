import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRating, formatHours } from '../lib/model.js';
import Cover from './Cover.jsx';
import { Stars } from './Rating.jsx';

export default function GameCard({ game, lists, genres, index, total, onEdit, onMove, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: game.id, disabled });
  const status = lists.find((item) => item.id === game.status) || { label: 'Lista indisponível', color: 'gray' };
  const genre = genres.find((item) => item.id === game.genre)?.label || 'Gênero indisponível';
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`game-card ${isDragging ? 'is-dragging' : ''}`} data-game-id={game.id}>
    <div className="cover-wrap">
      <button className="cover-open" onClick={() => onEdit(game)} aria-label={`Editar ${game.title}`} disabled={disabled}><Cover src={game.coverUrl} title={game.title} /></button>
      <span className="cover-position">{String(index + 1).padStart(2, '0')}</span>
      <button className="drag-handle" {...attributes} {...listeners} aria-label={`Reordenar ${game.title}`} title="Arraste para reordenar. No teclado: Espaço, setas e Espaço." disabled={disabled}><GripVertical size={19} /></button>
      <span className={`cover-status status-${status.color}`}>{status.label}</span>
    </div>
    <div className="game-card-info"><div className="game-card-heading"><h2><button onClick={() => onEdit(game)} disabled={disabled}>{game.title}</button></h2><button className="card-edit" onClick={() => onEdit(game)} disabled={disabled} aria-label={`Editar dados de ${game.title}`}><Pencil size={15} /></button></div>
      <div className="game-meta"><span>{genre}</span><span className={`status-label status-${status.color}`}>{status.label}</span></div>
      {game.hoursPlayed > 0 && <small className="game-hours">{formatHours(game.hoursPlayed)} de jogo</small>}<div className="card-rating"><Stars value={game.rating} /><span>{game.rating ? formatRating(game.rating) : '—'}</span><div className="move-buttons"><button aria-label={`Mover ${game.title} para antes`} disabled={disabled || index === 0} onClick={() => onMove(game.id, -1)}><ChevronLeft size={16} /></button><button aria-label={`Mover ${game.title} para depois`} disabled={disabled || index === total - 1} onClick={() => onMove(game.id, 1)}><ChevronRight size={16} /></button></div></div>
    </div>
  </article>;
}
