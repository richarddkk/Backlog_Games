export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function parseIds(url, card = false, queryValues = {}) {
  const parsed = new URL(url, 'http://localhost');
  const route = parsed.pathname.match(/^\/(r|card)\/([^/]+)\/([^/]+)$/);
  const authorId = parsed.searchParams.get('u') || queryValues.u || route?.[2];
  const rawGame = parsed.searchParams.get('g') || queryValues.g || route?.[3];
  const gameId = card && rawGame?.endsWith('.png') ? rawGame.slice(0, -4) : rawGame;
  if (!validId(authorId) || !validId(gameId) || authorId === 'local') throw new HttpError(404, 'Review indisponível.');
  return { authorId, gameId };
}
export function appBase(env = process.env) {
  try {
    const app = new URL(env.PUBLIC_APP_URL);
    if (app.protocol !== 'https:' && !(app.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(app.hostname))) throw new Error();
    if (app.username || app.password) throw new Error();
    app.hash = ''; app.search = ''; app.pathname = app.pathname.replace(/\/$/, '') + '/';
    return app;
  } catch { throw new HttpError(503, 'Configure PUBLIC_APP_URL no serviço de compartilhamento.'); }
}
export function targetUrl(post, env = process.env) {
  const app = appBase(env); app.hash = `/reviews/${post.actorId}/${post.gameId}`; return app.href;
}
export function shareOrigin(req, env = process.env) {
  if (env.SHARE_ORIGIN) {
    const origin = new URL(env.SHARE_ORIGIN);
    if (origin.protocol !== 'https:' || origin.username || origin.password) throw new HttpError(503, 'SHARE_ORIGIN inválida.');
    return origin.origin;
  }
  const host = req.headers?.host || '';
  if (!/^[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(host)) throw new HttpError(400, 'Endereço inválido.');
  return `${host.startsWith('localhost:') || host.startsWith('127.0.0.1:') ? 'http' : 'https'}://${host}`;
}
export function decodeReview(document, authorId, gameId) {
  const result = {};
  for (const [name, field] of Object.entries(document.fields || {})) {
    if ('stringValue' in field) result[name] = field.stringValue;
    else if ('doubleValue' in field) result[name] = field.doubleValue;
    else if ('integerValue' in field) result[name] = Number(field.integerValue);
    else if ('timestampValue' in field) result[name] = Date.parse(field.timestampValue);
  }
  if (result.visibility !== 'public' || result.actorId !== authorId || result.gameId !== gameId
      || !result.gameTitle || result.gameTitle.length > 120 || !result.actorName || result.actorName.length > 60
      || !result.text?.trim() || result.text.length > 3000 || typeof result.coverUrl !== 'string' || result.coverUrl.length > 2000
      || typeof result.statusLabel !== 'string' || result.statusLabel.length > 100
      || !Number.isFinite(result.rating) || result.rating < 0 || result.rating > 5 || !Number.isInteger(result.rating * 2)
      || (result.hoursPlayed !== undefined && (!Number.isFinite(result.hoursPlayed) || result.hoursPlayed < 0 || result.hoursPlayed > 1000000))) {
    throw new HttpError(404, 'Review indisponível.');
  }
  return { ...result, hoursPlayed: result.hoursPlayed || 0 };
}
export async function loadReview(authorId, gameId, { env = process.env, fetchImpl = fetch } = {}) {
  const project = env.FIREBASE_PROJECT_ID;
  if (!/^[a-z][a-z0-9-]{4,62}$/.test(project || '')) throw new HttpError(503, 'Configure FIREBASE_PROJECT_ID no serviço de compartilhamento.');
  // Sem credenciais administrativas: as regras do Firestore só liberam publicReviews.
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/publicReviews/${authorId}~${gameId}`;
  let response;
  try { response = await fetchImpl(url, { signal: AbortSignal.timeout(5000), redirect: 'error' }); }
  catch { throw new HttpError(503, 'Não foi possível consultar a review. Tente novamente.'); }
  if (response.status === 404 || response.status === 403) throw new HttpError(404, 'Review indisponível.');
  if (!response.ok) throw new HttpError(503, 'Não foi possível consultar a review. Tente novamente.');
  const text = await response.text();
  if (text.length > 80000) throw new HttpError(404, 'Review indisponível.');
  try { return decodeReview(JSON.parse(text), authorId, gameId); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(503, 'Resposta inválida do banco.'); }
}
