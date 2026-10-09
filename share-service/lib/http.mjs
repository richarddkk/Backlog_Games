import { escapeHtml } from './html.mjs';
export function begin(req, res, type) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); res.statusCode = 405; res.end('Método não permitido.'); return false; }
  return true;
}
export function fail(res, error) {
  res.statusCode = [400, 404, 503].includes(error.status) ? error.status : 503;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const message = res.statusCode === 404 ? 'Review indisponível. Ela pode ter sido removida ou deixado de ser pública.' : 'Não foi possível carregar esta review. Confira a configuração do serviço ou tente novamente.';
  res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Review indisponível — Checkpoint</title></head><body><h1>Checkpoint</h1><p>${escapeHtml(message)}</p></body></html>`);
}
