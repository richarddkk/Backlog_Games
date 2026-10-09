import { targetUrl } from './reviews.mjs';
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const rating = value => value ? `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}/5` : 'Sem nota';
export function renderHtml(post, origin, env = process.env) {
  const share = `${origin}/r/${post.actorId}/${post.gameId}`;
  const image = `${origin}/card/${post.actorId}/${post.gameId}.png`;
  const direct = targetUrl(post, env);
  const title = `${post.gameTitle} · ${rating(post.rating)} · Checkpoint`;
  const description = `${post.actorName} · ${post.statusLabel}${post.hoursPlayed ? ` · ${post.hoursPlayed.toLocaleString('pt-BR')} h` : ''}. ${post.text.slice(0, 180)}`;
  const safe = escapeHtml;
  // O crawler recebe HTML completo. Só navegadores executam este redirecionamento.
  const script = `window.location.replace(${JSON.stringify(direct).replace(/</g, '\\u003c')});`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${safe(title)}</title>
<meta name="description" content="${safe(description)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Checkpoint"><meta property="og:title" content="${safe(title)}"><meta property="og:description" content="${safe(description)}"><meta property="og:url" content="${safe(share)}"><meta property="og:image" content="${safe(image)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${safe(`${post.gameTitle}, ${rating(post.rating)}, ${post.statusLabel}, por ${post.actorName}`)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${safe(image)}"><link rel="canonical" href="${safe(share)}"><style>body{background:#171215;color:#fff1f3;font:18px/1.6 system-ui;margin:0;padding:40px;max-width:860px;margin:auto}img{width:100%;border-radius:20px}a{color:#ff8797}p{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><h1>${safe(post.gameTitle)}</h1><p>${safe(post.actorName)} · ${safe(post.statusLabel)} · ${safe(rating(post.rating))}</p><img src="${safe(image)}" alt="Card da review"><p>${safe(post.text.slice(0, 350))}</p><a href="${safe(direct)}">Abrir review completa no Checkpoint</a><script>${script}</script></body></html>`;
}
