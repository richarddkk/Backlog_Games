import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CircleCheck, Globe, Lock, Pause, Play, Trophy, Gamepad2, Users } from 'lucide-react';
import Avatar from './Avatar.jsx';
import Cover from './Cover.jsx';
import { Stars } from './Rating.jsx';
import { formatRating, formatHours } from '../lib/model.js';
import { formatActivityDate } from '../lib/activity.js';

const icons = { planned: Bookmark, completed: CircleCheck, playing: Play, dropped: Pause, platinum: Trophy };
export default function ReviewCard({ post, own, local, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = icons[post.status] || Gamepad2;
  const AudienceIcon = local || post.visibility === 'private' ? Lock : post.visibility === 'public' ? Globe : Users;
  const audience = local ? 'Neste navegador' : post.visibility === 'private' ? 'Só eu' : post.visibility === 'public' ? 'Todos' : 'Amigos';
  const long = post.text.length > 650;
  return <article className="review-feed-card">
    <div className="review-card-heading"><Link className="review-feed-cover" aria-label={`Abrir review de ${post.gameTitle}`} to={`/reviews/${post.actorId}/${post.gameId}`}><Cover src={post.coverUrl} title={post.gameTitle} /></Link><div className="review-card-info"><div className="review-author"><Avatar name={post.actorName} /><Link to={local ? '/' : `/perfil/${post.actorId}`}>{post.actorName}{own && <small>Você</small>}</Link></div><h2><Link to={`/reviews/${post.actorId}/${post.gameId}`}>{post.gameTitle}</Link></h2><div className="review-card-rating"><Stars value={post.rating} /><span>{post.rating ? `${formatRating(post.rating)} / 5` : 'Sem nota'}</span></div><div className={`review-status ${post.status}`}><StatusIcon size={14} /><span>{post.statusLabel}</span></div></div></div>
    {post.hoursPlayed > 0 && <p className="game-hours">{formatHours(post.hoursPlayed)} de jogo</p>}<p className="review-feed-text">{long && !expanded ? `${post.text.slice(0, 650).trimEnd()}…` : post.text}</p>
    {long && <button className="text-button review-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Mostrar menos' : 'Ler review completa'}</button>}
    <Link className="text-button review-detail-link" to={`/reviews/${post.actorId}/${post.gameId}`}>Abrir review</Link><div className="review-card-footer"><span className="review-audience"><AudienceIcon size={13} />{audience}</span><time dateTime={new Date(post.updatedAt).toISOString()}>{formatActivityDate(post.updatedAt)}</time>{own && onEdit && <button className="text-button" onClick={onEdit}>Editar review</button>}</div>
  </article>;
}
