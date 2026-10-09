import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Globe, LoaderCircle, MessageSquare, RotateCcw, Users } from 'lucide-react';
import ReviewCard from '../components/ReviewCard.jsx';
import useReviewFeed from '../hooks/useReviewFeed.js';
import { otherName, otherUid } from '../lib/friends.js';
import { makeReviewPost, reviewVisibility, sortReviewPosts } from '../lib/reviews.js';

export default function ReviewsPage() {
  const { library, friends, setEditor, disabled } = useOutletContext();
  const [tab, setTab] = useState('general');
  const uid = library.user?.uid;
  const accepted = uid ? friends.accepted : [];
  const ids = accepted.map(entry => otherUid(entry, uid));
  const remote = useReviewFeed(uid, ids, tab === 'global', library.taxonomy.options || []);
  const ownPosts = library.games.filter(game => game.review?.trim()).map(game => makeReviewPost({ actorId: uid || 'local', actorName: library.user ? library.profile.displayName : 'Você', gameId: game.id, game: { ...game, reviewVisibility: reviewVisibility(game) }, lists: library.taxonomy.lists, genres: library.taxonomy.genres, updatedAt: game.reviewUpdatedAt || game.updatedAt }));
  const friendPosts = remote.posts.filter(post => ids.includes(post.actorId)).map(post => ({ ...post, actorName: post.actorName === 'Jogador' ? otherName(accepted.find(entry => otherUid(entry, uid) === post.actorId), uid) : post.actorName }));
  const posts = tab === 'global' ? remote.posts : sortReviewPosts([...ownPosts, ...friendPosts]);
  const ready = remote.ready && (tab === 'global' || (library.ready && (!uid || friends.ready)));
  return <main className="workspace reviews-page">
    <div className="page-heading"><div><div className="eyebrow">CADA JOGO RENDE UMA OPINIÃO</div><h1>Reviews<span className="heading-period">.</span></h1><p>Leia experiências, descubra jogos e compartilhe o que ficou da sua jornada.</p></div><Link className="button secondary" to="/">Escrever na biblioteca</Link></div>
    <div className="reviews-toolbar"><div className="segmented-control" role="tablist" aria-label="Feeds de reviews" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'general' : event.key === 'End' ? 'global' : tab === 'general' ? 'global' : 'general';
      setTab(next); event.currentTarget.querySelector(`#reviews-${next}-tab`)?.focus();
    }}><button role="tab" id="reviews-general-tab" tabIndex={tab === 'general' ? 0 : -1} aria-controls="reviews-panel" aria-selected={tab === 'general'} className={tab === 'general' ? 'selected' : ''} onClick={() => setTab('general')}><Users size={16} />Geral</button><button role="tab" id="reviews-global-tab" tabIndex={tab === 'global' ? 0 : -1} aria-controls="reviews-panel" aria-selected={tab === 'global'} className={tab === 'global' ? 'selected' : ''} onClick={() => setTab('global')}><Globe size={16} />Global</button></div><span className="activity-count">{posts.length} {posts.length === 1 ? 'review' : 'reviews'}</span></div>
    <p className="reviews-tab-description">{tab === 'global' ? 'Avaliações que jogadores escolheram compartilhar com todos. Você não precisa ser amigo para ler.' : 'Suas avaliações e as compartilhadas pelos seus amigos. Textos marcados como Só eu aparecem apenas para você.'}</p>
    {(remote.error || (tab === 'general' && (library.error || friends.error))) && <div className="social-error" role="alert"><p>{remote.error || library.error || friends.error}</p><button className="button secondary" onClick={() => { remote.retry(); library.retry(); friends.retry(); }}><RotateCcw size={16} />Tentar novamente</button></div>}
    <div id="reviews-panel" role="tabpanel" aria-labelledby={tab === 'global' ? 'reviews-global-tab' : 'reviews-general-tab'}>
      {!ready && !remote.error && !(tab === 'general' && (library.error || friends.error)) ? <div className="loading-state" role="status"><LoaderCircle className="spin" /><p>Carregando reviews...</p></div> : posts.length ? <div className="reviews-grid">{posts.map(post => <ReviewCard key={`${post.actorId}/${post.gameId}`} post={post} own={post.actorId === (uid || 'local')} local={!uid && tab === 'general'} onEdit={post.actorId === (uid || 'local') && !disabled && library.games.some(game => game.id === post.gameId) ? () => setEditor({ game: library.games.find(game => game.id === post.gameId) }) : undefined} />)}</div> : <div className="empty-state"><div className="empty-icon">{tab === 'global' ? <Globe size={32} /> : <MessageSquare size={32} />}</div><h2>{tab === 'global' ? 'As primeiras opiniões começam com você.' : 'Toda experiência merece uma review.'}</h2><p>{tab === 'global' ? 'Ao escrever sua avaliação, escolha Todos para ela aparecer aqui.' : 'Escreva sobre um jogo na biblioteca ou adicione amigos para acompanhar as avaliações deles.'}</p><Link className="button secondary" to={tab === 'global' ? '/' : '/amigos'}>{tab === 'global' ? 'Ir para a biblioteca' : 'Encontrar amigos'}</Link></div>}
    </div>
    {!uid && tab === 'general' && <p className="reviews-footnote">No modo local, suas reviews ficam apenas neste navegador. Entre na conta para publicar e acompanhar amigos.</p>}
    {tab === 'global' && <p className="reviews-footnote">Até 100 reviews públicas recentes, ordenadas pela atualização. Cada jogador mantém uma review por jogo; mudar a visibilidade atualiza a publicação.</p>}
  </main>;
}
