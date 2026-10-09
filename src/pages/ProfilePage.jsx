import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { BookOpen, Clock, LoaderCircle, MessageSquare, Pencil, UserPlus, Lock } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import Cover from '../components/Cover.jsx';
import { Stars } from '../components/Rating.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import usePublicDocument from '../hooks/usePublicDocument.js';
import useProfileContent from '../hooks/useProfileContent.js';
import { formatHours } from '../lib/model.js';
import { otherName, otherUid } from '../lib/friends.js';
import { makeReviewPost, reviewVisibility, sortReviewPosts } from '../lib/reviews.js';
import { validSocialId } from '../lib/sharing.js';

export default function ProfilePage() {
  const { userId } = useParams();
  const { library, friends, notify, openProfile, openAuth, setEditor, disabled } = useOutletContext();
  const uid = library.user?.uid;
  const own = Boolean(uid && userId === uid);
  const valid = validSocialId(userId) && userId !== 'local';
  const accepted = friends.accepted.find(item => otherUid(item, uid) === userId);
  const incoming = friends.incoming.find(item => item.fromId === userId);
  const outgoing = friends.outgoing.find(item => item.toId === userId);
  const publicProfile = usePublicDocument('publicProfiles', valid ? userId : null);
  const friend = Boolean(uid && accepted);
  const publicLibrary = publicProfile.data?.libraryVisibility === 'public';
  const content = useProfileContent(uid, !own && valid ? userId : null, friend, publicLibrary, library.taxonomy.options);
  const [tab, setTab] = useState('library');
  const profile = own ? library.profile : publicProfile.data;
  const name = profile?.displayName || (accepted ? otherName(accepted, uid) : content.posts[0]?.actorName) || 'Jogador';
  const games = own ? library.games : content.games;
  const options = own ? library.taxonomy.options : content.options;
  const canReadLibrary = own || friend || publicLibrary;
  const posts = own || friend ? sortReviewPosts(games.filter(game => game.review?.trim()).map(game => makeReviewPost({ actorId: userId, actorName: name, gameId: game.id, game: { ...game, reviewVisibility: reviewVisibility(game) }, lists: options.filter(item => item.kind === 'list'), genres: options.filter(item => item.kind === 'genre'), updatedAt: game.reviewUpdatedAt || game.updatedAt }))) : content.posts;
  const ready = library.authReady && publicProfile.ready && (own ? library.ready : content.ready) && (!uid || friends.ready);
  const error = publicProfile.error || content.error || friends.error || (own && library.error);
  const known = valid && (own || profile || accepted || content.posts.length > 0);
  const act = async (operation, message) => { try { await operation(); notify(message); } catch (failure) { notify(failure.message, true); } };
  return <main className="workspace public-profile-page">
    {!ready && !error ? <div className="loading-state" role="status"><LoaderCircle className="spin" /><p>Carregando perfil...</p></div> : error ? <div className="social-error" role="alert"><p>{error}</p></div> : !known ? <div className="empty-state"><h1>Perfil indisponível.</h1><p>Este jogador ainda não publicou um perfil ou o endereço está incorreto.</p><Link to="/reviews" className="button secondary">Explorar reviews</Link></div> : <>
      <section className="public-profile-hero"><Avatar name={name} src={profile?.photoData} className="public-profile-avatar" /><div className="public-profile-intro"><div className="eyebrow">O JOGADOR POR TRÁS DA JORNADA</div><h1>{name}<span className="heading-period">.</span></h1><p className="profile-bio">{profile?.bio || 'Cada jogo conta uma história.'}</p><div className="profile-actions">{own ? <button className="button primary" onClick={openProfile}><Pencil size={16} />Editar perfil</button> : friend ? <><span className="friendship-label">Vocês são amigos</span><Link className="button primary" to={`/conversas?com=${userId}`}><MessageSquare size={16} />Conversar</Link></> : !uid ? <button className="button primary" onClick={openAuth}><UserPlus size={16} />Entrar para adicionar amigo</button> : incoming ? <><button className="button primary" disabled={friends.busy} onClick={() => act(() => friends.accept(incoming.id), 'Amizade aceita.')}>Aceitar pedido</button><button className="button secondary" disabled={friends.busy} onClick={() => act(() => friends.remove(incoming.id), 'Pedido recusado.')}>Recusar</button></> : outgoing ? <><span className="friendship-label">Pedido enviado</span><button className="button secondary" disabled={friends.busy} onClick={() => act(() => friends.remove(outgoing.id), 'Pedido cancelado.')}>Cancelar pedido</button></> : <button className="button primary" disabled={!friends.ready || friends.busy} onClick={() => act(() => friends.sendRequest(userId), 'Pedido de amizade enviado.')}><UserPlus size={16} />Adicionar amigo</button>}</div></div></section>
      {own && !publicProfile.data && <p className="sharing-note">Salve seu perfil em Editar perfil para publicar seu nome, foto e bio.</p>}
      <div className="profile-stats"><div><BookOpen size={19} /><strong>{canReadLibrary ? games.length : '—'}</strong><span>Jogos</span></div><div><MessageSquare size={19} /><strong>{posts.length}</strong><span>Reviews visíveis</span></div><div><Clock size={19} /><strong>{canReadLibrary ? formatHours(games.reduce((sum, game) => sum + (game.hoursPlayed || 0), 0)) : '—'}</strong><span>Tempo de jogo</span></div></div>
      <div className="segmented-control profile-tabs" role="tablist" aria-label="Conteúdo do perfil" onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); const next = event.key === 'Home' ? 'library' : event.key === 'End' ? 'reviews' : tab === 'library' ? 'reviews' : 'library';
        setTab(next); event.currentTarget.querySelector(`#profile-${next}-tab`)?.focus();
      }}><button role="tab" id="profile-library-tab" aria-controls="profile-panel" tabIndex={tab === 'library' ? 0 : -1} aria-selected={tab === 'library'} className={tab === 'library' ? 'selected' : ''} onClick={() => setTab('library')}>Biblioteca</button><button role="tab" id="profile-reviews-tab" aria-controls="profile-panel" tabIndex={tab === 'reviews' ? 0 : -1} aria-selected={tab === 'reviews'} className={tab === 'reviews' ? 'selected' : ''} onClick={() => setTab('reviews')}>Reviews</button></div>
      <section id="profile-panel" role="tabpanel" aria-labelledby={`profile-${tab}-tab`}>
        {tab === 'reviews' ? posts.length ? <div className="reviews-grid">{posts.map(post => <ReviewCard key={post.gameId} post={post} own={own} onEdit={own && !disabled ? () => setEditor({ game: games.find(game => game.id === post.gameId) }) : undefined} />)}</div> : <div className="empty-state"><h2>Nenhuma review visível por aqui.</h2><p>As avaliações aparecem de acordo com a privacidade de cada jogo.</p></div> : !canReadLibrary ? <div className="empty-state"><div className="empty-icon"><Lock size={28} /></div><h2>Biblioteca compartilhada com amigos.</h2><p>Adicione este jogador e aguarde a aceitação para ver seus jogos. As reviews públicas continuam na outra aba.</p></div> : games.length ? <div className="game-grid">{games.map(game => { const hasReview = posts.some(post => post.gameId === game.id); return <article className="friend-game-card" key={game.id}><div className="cover-wrap">{hasReview ? <Link aria-label={`Abrir review de ${game.title}`} to={`/reviews/${userId}/${game.id}`}><Cover src={game.coverUrl} title={game.title} /></Link> : <Cover src={game.coverUrl} title={game.title} />}</div><h2>{hasReview ? <Link to={`/reviews/${userId}/${game.id}`}>{game.title}</Link> : game.title}</h2><div className="game-meta"><span>{options.find(item => item.id === game.genre)?.label || game.genre}</span><span>{options.find(item => item.id === game.status)?.label || game.status}</span></div><Stars value={game.rating} />{game.hoursPlayed > 0 && <p className="game-hours">{formatHours(game.hoursPlayed)} de jogo</p>}{hasReview && <Link className="text-button" to={`/reviews/${userId}/${game.id}`}>Ler review</Link>}</article>; })}</div> : <div className="empty-state"><h2>Uma nova coleção está começando.</h2></div>}
      </section>
    </>}
  </main>;
}
