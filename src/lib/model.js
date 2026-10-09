import { reviewVisibility } from './reviews.js';
export const STATUSES = [
  { id: 'playing', label: 'Jogando', color: 'green', icon: 'play' },
  { id: 'completed', label: 'Zerado', color: 'blue', icon: 'check' },
  { id: 'planned', label: 'Planejo jogar', color: 'gray', icon: 'bookmark' },
  { id: 'platinum', label: 'Platinado', color: 'gold', icon: 'trophy' },
  { id: 'dropped', label: 'Desistiu', color: 'rose', icon: 'pause' },
];

export const GENRES = ['Ação', 'Aventura', 'RPG', 'Roguelike', 'Metroidvania', 'Plataforma', 'Puzzle', 'Estratégia', 'Simulação', 'Esporte', 'Corrida', 'FPS', 'Terror', 'Luta', 'MMO', 'Outro'];
export const GUEST_KEY = 'checkpoint.guest.v1';
export const normalizeText = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const formatHours = (value) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`;
export const formatRating = (value) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const sortGames = (games) => [...games].sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));

export function safeImageUrl(value) {
  if (!value) return '';
  if (/^\/covers\/[a-z\d-]+\.jpg$/i.test(value)) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export function validateGame(value, options = null, previous = null) {
  if (!value.title?.trim() || value.title.trim().length > 120) throw new Error('Informe um nome de jogo com até 120 caracteres.');
  if (typeof value.genre !== 'string' || !value.genre || value.genre.length > 100 || value.genre.includes('/')) throw new Error('Escolha um gênero válido.');
  if (typeof value.status !== 'string' || !value.status || value.status.length > 100 || value.status.includes('/')) throw new Error('Escolha uma lista válida.');
  if (!options?.allowUnknown) {
    const genres = options?.genres || GENRES.map((genre) => ({ id: genre, active: true }));
    const lists = options?.lists || STATUSES.map((status) => ({ ...status, active: true }));
    if (!genres.some((genre) => genre.id === value.genre && genre.active) && value.genre !== previous?.genre) throw new Error('Escolha um gênero ativo.');
    if (!lists.some((status) => status.id === value.status && status.active) && value.status !== previous?.status) throw new Error('Escolha uma lista ativa.');
  }
  if (!Number.isFinite(value.rating) || value.rating < 0 || value.rating > 5 || value.rating * 2 !== Math.floor(value.rating * 2)) throw new Error('A nota precisa ir de 0 a 5, em passos de 0,5.');
  if (value.coverUrl && !safeImageUrl(value.coverUrl)) throw new Error('Use uma URL de imagem começando com https:// ou http://.');
  if (value.coverUrl?.length > 2000) throw new Error('A URL da capa é muito longa.');
  if ((value.review || '').length > 3000) throw new Error('Sua avaliação pode ter até 3.000 caracteres.');
  const hoursPlayed = value.hoursPlayed ?? 0;
  if (!Number.isFinite(hoursPlayed) || hoursPlayed < 0 || hoursPlayed > 1000000) throw new Error('Informe horas de jogo entre 0 e 1.000.000.');
  const visibility = value.reviewVisibility ?? reviewVisibility(previous);
  if (!['private', 'friends', 'public'].includes(visibility)) throw new Error('Escolha quem pode ler sua avaliação.');
  return { hoursPlayed, reviewVisibility: visibility, title: value.title.trim(), genre: value.genre, status: value.status, rating: value.rating, coverUrl: safeImageUrl(value.coverUrl), review: (value.review || '').trim() };
}

export function isStoredGame(game) {
  try {
    validateGame(game, { allowUnknown: true });
    return typeof game.id === 'string' && Number.isFinite(game.rank) && Number.isFinite(game.createdAt) && Number.isFinite(game.updatedAt);
  } catch { return false; }
}

// Reordenação afeta somente o jogo arrastado. Os vizinhos definem sua nova posição.
// Se os espaços numéricos acabarem, as posições são redistribuídas na mesma operação.
export function reorderGames(games, activeId, overId) {
  const ordered = sortGames(games);
  const from = ordered.findIndex((game) => game.id === activeId);
  const to = ordered.findIndex((game) => game.id === overId);
  if (from < 0 || to < 0 || from === to) return [];
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  const index = ordered.findIndex((game) => game.id === activeId);
  const previous = ordered[index - 1]?.rank;
  const next = ordered[index + 1]?.rank;
  const rank = previous === undefined ? next - 1024 : next === undefined ? previous + 1024 : (previous + next) / 2;
  if (!Number.isFinite(rank) || (previous !== undefined && rank <= previous) || (next !== undefined && rank >= next)) {
    return ordered.map((game, position) => ({ id: game.id, rank: (position + 1) * 1024 }));
  }
  return [{ id: activeId, rank }];
}
