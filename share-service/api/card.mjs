import { loadReview, parseIds } from '../lib/reviews.mjs';
import { fetchCover, renderCard } from '../lib/card.mjs';
import { begin, fail } from '../lib/http.mjs';
export default async function handler(req, res) {
  if (!begin(req, res, 'image/png')) return;
  try {
    const { authorId, gameId } = parseIds(req.url, true, req.query);
    const post = await loadReview(authorId, gameId);
    const png = await renderCard(post, await fetchCover(post.coverUrl));
    res.statusCode = 200; res.setHeader('Content-Length', png.length); res.end(req.method === 'HEAD' ? undefined : png);
  } catch (error) { fail(res, error); }
}
