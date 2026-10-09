import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import sharp from 'sharp';
import opentype from 'opentype.js';
import { appBase } from './reviews.mjs';

const parseFont = name => {
  const bytes = readFileSync(fileURLToPath(new URL(`../assets/${name}`, import.meta.url)));
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
};
const normal = parseFont('DejaVuSans.ttf');
const bold = parseFont('DejaVuSans-Bold.ttf');
export function textPath(text, x, y, size, color = '#fff2f5', strong = false) {
  return `<path d="${(strong ? bold : normal).getPath(text, x, y, size).toPathData(2)}" fill="${color}"/>`;
}
function wrap(text, width, size, maximum, font = bold) {
  const words = text.split(/\s+/); const lines = []; let line = '';
  for (const word of words) {
    // Quebra inclusive nomes sem espaços; o desenho nunca sai da imagem.
    for (const chunk of word.match(/.{1,22}/gu) || ['']) {
      const next = line ? `${line} ${chunk}` : chunk;
      if (font.getAdvanceWidth(next, size) > width && line) { lines.push(line); line = chunk; } else line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maximum) { lines.length = maximum; let last = lines[maximum - 1]; while (font.getAdvanceWidth(`${last}…`, size) > width) last = last.slice(0,-1); lines[maximum - 1] = `${last}…`; }
  return lines;
}
const fit = (text, width, size, font = normal) => {
  let result = text; while (result && font.getAdvanceWidth(result, size) > width) result = result.slice(0,-1);
  return result.length < text.length ? `${result.slice(0,-1)}…` : result;
};
function star(cx, cy) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 10 : 22;
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(' ');
}
export function cardSvg(post) {
  const lines = wrap(post.gameTitle, 720, 48, 3);
  let body = lines.map((line, i) => textPath(line, 398, 148 + i * 58, 48, '#fff2f5', true)).join('');
  const authorY = 170 + lines.length * 58;
  body += textPath(fit(`por ${post.actorName}`, 680, 23), 398, authorY, 23, '#cbb8c0');
  const ratingY = authorY + 54;
  for (let i = 0; i < 5; i++) {
    const cx = 420 + i * 49;
    const fill = Math.max(0, Math.min(1, post.rating - i));
    body += `<polygon points="${star(cx, ratingY)}" fill="#49343d"/>`;
    if (fill > 0) body += `<clipPath id="s${i}"><rect x="${cx-22}" y="${ratingY-23}" width="${44 * fill}" height="46"/></clipPath><polygon points="${star(cx, ratingY)}" fill="#ff6a82" clip-path="url(#s${i})"/>`;
  }
  body += textPath(post.rating ? `${post.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} / 5` : 'Sem nota', 665, ratingY + 8, 26, '#ff9eb0', true);
  const statusY = ratingY + 46;
  body += `<rect x="398" y="${statusY}" width="700" height="50" rx="14" fill="#34212a"/>`;
  body += textPath(fit(post.statusLabel, 430, 22, bold), 416, statusY + 33, 22, '#ff9eb0', true);
  if (post.hoursPlayed) body += textPath(`${post.hoursPlayed.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`, 932, statusY + 33, 21, '#ead5dc');
  const quoteY = statusY + 90;
  const quote = wrap(post.text, 695, 19, lines.length > 2 ? 1 : 2, normal);
  body += quote.map((line, i) => textPath(line, 398, quoteY + i * 27, 19, '#cbb8c0')).join('');
  const initials = post.gameTitle.slice(0,2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#21171d"/><stop offset="1" stop-color="#120e11"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="1140" cy="-130" r="360" fill="#d6254f" opacity=".10"/><rect x="52" y="65" width="312" height="464" rx="20" fill="#403038"/>${textPath(initials, 122, 310, 100, '#87616d', true)}${textPath('CHECKPOINT',398,83,20,'#ff6a82',true)}${body}<path d="M56 565H1144" stroke="#403038"/>${textPath('checkpoint.',56,605,23,'#ff6a82',true)}${textPath('Abra o link para ler a review completa',680,605,20,'#b69ea8')}</svg>`;
}
export function allowedCover(value, env = process.env) {
  if (!value) return null;
  const app = appBase(env);
  let url;
  try { url = value.startsWith('/covers/') ? new URL(`${app.pathname.replace(/\/$/, '')}${value}`, app.origin) : new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || isIP(url.hostname) || !url.hostname.includes('.') || url.hostname.endsWith('.local') || url.hostname.endsWith('.internal')) return null;
  const bundled = url.origin === app.origin && url.pathname.startsWith(`${app.pathname}covers/`) && /\/covers\/[A-Za-z0-9-]+\.jpg$/.test(url.pathname);
  const extra = (env.PREVIEW_IMAGE_HOSTS || '').split(',').map(host => host.trim().toLowerCase()).filter(Boolean);
  return bundled || extra.includes(url.hostname) ? url : null;
}
function publicAddress(address) {
  if (address.includes(':')) {
    const lower = address.toLowerCase();
    return /^[23]/.test(lower) && !lower.startsWith('2001:db8') && !lower.startsWith('2002:') && !lower.startsWith('2001:0:');
  }
  const [a,b] = address.split('.').map(Number);
  return ![0,10,127].includes(a) && a < 224 && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && (b === 168 || b === 0 || b === 2)) && !(a === 100 && b >= 64 && b <= 127) && !(a === 198 && [18,19,51].includes(b)) && !(a === 203 && b === 0);
}
export async function fetchCover(value, { env = process.env, fetchImpl = fetch, lookupImpl = lookup } = {}) {
  const url = allowedCover(value, env); if (!url) return null;
  try {
    const addresses = await lookupImpl(url.hostname, { all: true });
    if (!addresses.length || addresses.some(item => !publicAddress(item.address))) return null;
    const response = await fetchImpl(url.href, { signal: AbortSignal.timeout(4500), redirect: 'error' });
    if (!response.ok || !/^image\/(jpeg|png|webp)(;|$)/i.test(response.headers.get('content-type') || '')) return null;
    if (Number(response.headers.get('content-length')) > 3 * 1024 * 1024 || !response.body) return null;
    const parts = []; let length = 0;
    for await (const part of response.body) { length += part.length; if (length > 3 * 1024 * 1024) { await response.body.cancel().catch(() => {}); return null; } parts.push(Buffer.from(part)); }
    return await sharp(Buffer.concat(parts), { limitInputPixels: 20000000 }).resize(300,450,{ fit: 'cover' }).png().toBuffer();
  } catch { return null; }
}
export async function renderCard(post, cover = null) {
  const svg = Buffer.from(cardSvg(post));
  const composites = cover ? [{ input: cover, top: 72, left: 58 }] : [];
  return sharp(svg).composite(composites).png().toBuffer();
}
