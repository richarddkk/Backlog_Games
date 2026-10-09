import { LoaderCircle, Lock, Users, Globe } from 'lucide-react';
import Modal from './Modal.jsx';
import Cover from './Cover.jsx';
import { Stars } from './Rating.jsx';
import useGameReview from '../hooks/useGameReview.js';
import { formatRating } from '../lib/model.js';
import { formatActivityDate } from '../lib/activity.js';

export default function ReviewDialog({ selection, library, onClose }) {
  const own = selection.actorId === (library.user?.uid || 'local');
  const remote = useGameReview(library.user?.uid, own ? null : selection.actorId, own ? null : selection.gameId);
  const game = own ? library.games.find(entry => entry.id === selection.gameId) : remote.game;
  const ready = own ? library.ready : remote.ready;
  const unavailable = !own && remote.unavailable;
  return <Modal open onOpenChange={open => { if (!open) onClose(); }} title={`Avaliação de ${selection.actorName || 'Jogador'}`} description="A nota e a opinião atuais sobre este jogo." className="review-modal">
    {!own && remote.error ? <div className="social-error" role="alert"><p>{remote.error}</p><button className="button secondary" onClick={remote.retry}>Tentar novamente</button></div>
      : !ready ? <div className="loading-state" role="status"><LoaderCircle className="spin" /><p>Carregando avaliação...</p></div>
        : !game ? <div className="review-empty"><h3>{selection.gameTitle}</h3><p>Este jogo não está mais na biblioteca. A atividade permanece no histórico.</p></div>
          : <><div className="review-game-heading"><Cover src={game.coverUrl} title={game.title} /><div><span className="eyebrow">OPINIÃO DO JOGADOR</span><h3>{game.title}</h3><div className="review-score"><Stars value={game.rating} /><span>{game.rating ? `${formatRating(game.rating)} / 5` : 'Ainda sem nota'}</span></div><span className="review-audience">{own && !library.user ? <><Lock size={14} />Somente neste navegador</> : own && game.reviewVisibility === 'private' ? <><Lock size={14} />Só você</> : game.reviewVisibility === 'public' ? <><Globe size={14} />Visível para todos</> : unavailable ? <><Lock size={14} />Texto não compartilhado</> : <><Users size={14} />Visível para amigos</>}</span></div></div>
            {unavailable ? <p className="review-empty">Esta avaliação não está compartilhada com você.</p> : game.review ? <p className="review-text">{game.review}</p> : <p className="review-empty">{own ? 'Você ainda não escreveu uma avaliação para este jogo.' : 'Seu amigo ainda não escreveu uma avaliação para este jogo.'}</p>}
            {!unavailable && game.reviewUpdatedAt && <p className="review-date">Avaliação atualizada em {formatActivityDate(game.reviewUpdatedAt)}.</p>}
          </>}
    <div className="modal-footer"><span /><button className="button secondary" onClick={onClose}>Fechar avaliação</button></div>
  </Modal>;
}
