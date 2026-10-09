// Jogos antigos já compartilhavam o texto com amigos. Novos textos são privados.
export function reviewVisibility(game) {
  return game?.reviewVisibility || (game ? 'friends' : 'private');
}

export function isStoredReview(value) {
  return value && typeof value.text === 'string' && value.text.length <= 3000
    && ['private', 'friends', 'public'].includes(value.visibility)
    && Number.isFinite(value.updatedAt) && value.updatedAt >= 0;
}

export function mergeReview(game, review) {
  return review ? { ...game, review: review.text, reviewVisibility: review.visibility, reviewUpdatedAt: review.updatedAt }
    : { ...game, reviewVisibility: reviewVisibility(game) };
}

export const REVIEW_FEED_LIMIT = 100;

export function makeReviewPost({ actorId, actorName, gameId, game, lists, genres, updatedAt }) {
  return {
    actorId, actorName: (actorName || 'Jogador').slice(0, 60), gameId,
    gameTitle: game.title, coverUrl: game.coverUrl, rating: game.rating, hoursPlayed: game.hoursPlayed || 0,
    status: game.status, statusLabel: lists.find(list => list.id === game.status)?.label || game.status,
    genreLabel: genres.find(genre => genre.id === game.genre)?.label || game.genre,
    text: game.review, visibility: game.reviewVisibility, updatedAt,
  };
}

export function isReviewPost(post) {
  return post && typeof post.actorId === 'string' && post.actorId.length > 0
    && typeof post.actorName === 'string' && post.actorName.length <= 60
    && typeof post.gameId === 'string' && post.gameId.length > 0
    && typeof post.gameTitle === 'string' && post.gameTitle.length > 0 && post.gameTitle.length <= 120
    && typeof post.text === 'string' && post.text.trim().length > 0 && post.text.length <= 3000
    && ['private', 'friends', 'public'].includes(post.visibility)
    && typeof post.coverUrl === 'string' && post.coverUrl.length <= 2000
    && (post.hoursPlayed === undefined || (Number.isFinite(post.hoursPlayed) && post.hoursPlayed >= 0 && post.hoursPlayed <= 1000000))
    && Number.isFinite(post.rating) && post.rating >= 0 && post.rating <= 5 && Number.isInteger(post.rating * 2)
    && typeof post.status === 'string' && typeof post.statusLabel === 'string' && post.statusLabel.length <= 100
    && typeof post.genreLabel === 'string' && post.genreLabel.length <= 100
    && Number.isFinite(post.updatedAt) && post.updatedAt >= 0;
}

export function readReviewPost(document) {
  const value = document.data({ serverTimestamps: 'estimate' });
  return { ...value, updatedAt: value.updatedAt?.toMillis?.() ?? value.updatedAt };
}

export function sortReviewPosts(posts) {
  return [...posts].sort((a, b) => b.updatedAt - a.updatedAt || `${a.actorId}/${a.gameId}`.localeCompare(`${b.actorId}/${b.gameId}`));
}
