import { loadReview, parseIds, shareOrigin } from '../lib/reviews.mjs';
import { renderHtml } from '../lib/html.mjs';
import { begin, fail } from '../lib/http.mjs';
export default async function handler(req, res) {
  if (!begin(req, res, 'text/html; charset=utf-8')) return;
  try {
    const { authorId, gameId } = parseIds(req.url, false, req.query);
    const post = await loadReview(authorId, gameId);
    const html = renderHtml(post, shareOrigin(req));
    res.statusCode = 200; res.end(req.method === 'HEAD' ? undefined : html);
  } catch (error) { fail(res, error); }
}
