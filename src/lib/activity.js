import { safeImageUrl } from './model.js';

export const RECENT_ACTIVITY_LIMIT = 100;
export const LOCAL_ACTIVITY_LIMIT = 500;

export function buildActivities({ previous, game, gameId, actorId, actorName, lists, now = Date.now() }) {
  const base = {
    actorId: actorId || 'local', actorName: (actorName || 'Você').slice(0, 60),
    gameId, gameTitle: game.title, coverUrl: game.coverUrl,
    status: game.status, statusLabel: lists.find(list => list.id === game.status)?.label || game.status,
    createdAt: now,
  };
  const events = [];
  if (!previous) events.push({ ...base, id: crypto.randomUUID(), type: 'added' });
  if ((previous && previous.status !== game.status) || (!previous && ['completed', 'platinum'].includes(game.status))) {
    events.push({ ...base, id: crypto.randomUUID(), type: 'status' });
  }
  return events;
}

export function activityVerb(event) {
  if (event.type === 'added') return 'adicionou';
  return ({ platinum: 'platinou', completed: 'zerou', playing: 'começou a jogar', dropped: 'desistiu de jogar', planned: 'planeja jogar' })[event.status] || 'moveu';
}

export function isActivity(event) {
  return typeof event.id === 'string' && typeof event.actorId === 'string' && event.actorId.length > 0
    && typeof event.actorName === 'string' && event.actorName.length <= 60
    && typeof event.gameId === 'string' && event.gameId.length > 0
    && typeof event.gameTitle === 'string' && event.gameTitle.length > 0 && event.gameTitle.length <= 120
    && typeof event.coverUrl === 'string' && (!event.coverUrl || Boolean(safeImageUrl(event.coverUrl)))
    && ['added', 'status'].includes(event.type)
    && typeof event.status === 'string' && event.status.length > 0
    && typeof event.statusLabel === 'string' && event.statusLabel.length > 0 && event.statusLabel.length <= 60
    && Number.isFinite(event.createdAt) && event.createdAt >= 0;
}

export function readActivityDocument(record) {
  const data = record.data({ serverTimestamps: 'estimate' });
  return { ...data, id: record.id, createdAt: data.createdAt?.toMillis?.() ?? data.createdAt };
}

export function sortActivities(events) {
  return [...events].sort((a, b) => b.createdAt - a.createdAt || (a.type === 'added' ? 1 : 0) - (b.type === 'added' ? 1 : 0) || b.id.localeCompare(a.id));
}

export function formatActivityDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}
