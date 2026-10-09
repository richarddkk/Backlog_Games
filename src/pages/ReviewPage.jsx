import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, LoaderCircle, Share2, Pencil } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import Cover from '../components/Cover.jsx';
import { Stars } from '../components/Rating.jsx';
import ShareDialog from '../components/ShareDialog.jsx';
import useGameReview from '../hooks/useGameReview.js';
import usePublicDocument from '../hooks/usePublicDocument.js';
import { otherName, otherUid } from '../lib/friends.js';
import { formatHours, formatRating } from '../lib/model.js';
import { formatActivityDate } from '../lib/activity.js';
import { isReviewPost, makeReviewPost, readReviewPost, reviewVisibility } from '../lib/reviews.js';
import { validSocialId } from '../lib/sharing.js';

const readPost = snapshot => { const post = readReviewPost(snapshot); if (!isReviewPost(post)) throw new Error('Review inválida.'); return post; };
export default function ReviewPage() {
  const { authorId, gameId } = useParams();
  const { library, friends, setEditor, disabled, openAuth } = useOutletContext();
  const uid = library.user?.uid;
  const valid = validSocialId(authorId) && validSocialId(gameId);
  const local = authorId === 'local' && !uid;
  const own = uid === authorId || local;
  const friendship = friends.accepted.find(item => otherUid(item, uid) === authorId);
  const friend = Boolean(uid && friendship);
  const remote = useGameReview(uid, friend && valid ? authorId : null, valid ? gameId : null);
  const publication = usePublicDocument('publicReviews', valid && authorId !== 'local' ? `${authorId}~${gameId}` : null, readPost);
  const profile = usePublicDocument('publicProfiles', valid && authorId !== 'local' ? authorId : null);
  const game = own ? library.games.find(item => item.id === gameId) : friend ? remote.game : null;
  const personalStatus = usePublicDocument(`users/${authorId}/options`, friend ? game?.status : null);
  const personalGenre = usePublicDocument(`users/${authorId}/options`, friend ? game?.genre : null);
  const [share, setShare] = useState(false);
  useEffect(() => { setShare(false); }, [authorId, gameId, uid]);
  let post = own || friend ? game?.review?.trim() && makeReviewPost({ actorId: authorId, actorName: own ? local ? 'Você' : library.profile.displayName : profile.data?.displayName || otherName(friendship, uid), gameId, game: { ...game, reviewVisibility: reviewVisibility(game) }, lists: personalStatus.data ? [{ ...personalStatus.data, id: game.status }, ...library.taxonomy.lists] : library.taxonomy.lists, genres: personalGenre.data ? [{ ...personalGenre.data, id: game.genre }, ...library.taxonomy.genres] : library.taxonomy.genres, updatedAt: game.reviewUpdatedAt || game.updatedAt }) : publication.data;
  if (!own && friend && game?.reviewVisibility === 'public' && publication.data) post = { ...publication.data, actorName: profile.data?.displayName || publication.data.actorName };
  const ready = !valid || (own ? library.ready : friend ? remote.ready : publication.ready && library.authReady && (!uid || friends.ready));
  const error = own ? library.error : friend ? remote.error : publication.error || friends.error;
  return <main className="workspace review-detail-page"><Link to="/reviews" className="text-button back-link"><ArrowLeft size={17} />Voltar às reviews</Link>
    {!ready && !error ? <div className="loading-state" role="status"><LoaderCircle className="spin" /><p>Carregando review...</p></div> : !post || !valid || error ? <div className="empty-state"><h1>Review indisponível.</h1><p>{error || 'O jogo pode ter sido removido, a review pode ser privada ou vocês ainda não são amigos.'}</p>{!uid && <button className="button primary" onClick={openAuth}>Entrar na conta</button>}{valid && authorId !== 'local' && <Link className="button secondary" to={`/perfil/${authorId}`}>Ver perfil do jogador</Link>}</div> : <>
      <div className="review-detail-hero"><Cover src={post.coverUrl} title={post.gameTitle} className="review-detail-cover" /><div><div className="eyebrow">UMA EXPERIÊNCIA, UMA OPINIÃO</div><h1>{post.gameTitle}<span className="heading-period">.</span></h1><Link className="profile-author-link" to={local ? '/' : `/perfil/${authorId}`}><Avatar name={post.actorName} src={own ? library.profile.photoData : profile.data?.photoData} /><span>Review de <strong>{post.actorName}</strong></span></Link><div className="review-card-rating"><Stars value={post.rating} /><strong>{post.rating ? `${formatRating(post.rating)} / 5` : 'Sem nota'}</strong></div><div className="review-detail-facts"><span className={`review-status ${post.status}`}>{post.statusLabel}</span><span>{post.genreLabel}</span><span><Clock size={16} />{post.hoursPlayed > 0 ? formatHours(post.hoursPlayed) : 'Horas não informadas'}</span></div><time dateTime={new Date(post.updatedAt).toISOString()}>{formatActivityDate(post.updatedAt)}</time><div className="profile-actions">{!local && <button className="button primary" onClick={() => setShare(true)}><Share2 size={16} />Compartilhar</button>}{own && !disabled && <button className="button secondary" onClick={() => setEditor({ game })}><Pencil size={16} />Editar review</button>}</div></div></div>
      <article className="review-detail-body"><h2>Sobre o jogo</h2><p className="review-feed-text">{post.text}</p><span className="review-audience">{local ? 'Somente neste navegador' : post.visibility === 'public' ? 'Review pública' : post.visibility === 'friends' ? 'Compartilhada com amigos' : 'Somente você'}</span></article>
      {share && <ShareDialog post={post} onClose={() => setShare(false)} />}
    </>}
  </main>;
}
