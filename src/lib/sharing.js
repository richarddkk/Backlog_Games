export const validSocialId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function reviewPath(authorId, gameId) {
  if (!(validSocialId(authorId) && validSocialId(gameId))) throw new Error('Link de review inválido.');
  return `/reviews/${authorId}/${gameId}`;
}
export function reviewLinks(post, appUrl = window.location.href, serviceUrl = import.meta.env.VITE_SHARE_BASE_URL || '') {
  const direct = new URL(appUrl); direct.hash = reviewPath(post.actorId, post.gameId);
  let rich = '', image = '';
  if (post.visibility === 'public' && serviceUrl) {
    try {
      const base = new URL(serviceUrl);
      if (base.protocol === 'https:' && !base.username && !base.password) {
        base.pathname = base.pathname.replace(/\/$/, '') + '/'; base.search = ''; base.hash = '';
        rich = new URL(`r/${post.actorId}/${post.gameId}`, base).href;
        image = new URL(`card/${post.actorId}/${post.gameId}.png`, base).href;
      }
    } catch { /* O link direto permanece disponível. */ }
  }
  return { direct: direct.href, url: rich || direct.href, image, rich: Boolean(rich) };
}
