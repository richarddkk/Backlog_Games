import { GENRES, STATUSES, normalizeText } from './model.js';

export const OPTIONS_KEY = 'checkpoint.options.local.v1';
export const COLORS = ['green', 'blue', 'gold', 'rose', 'gray'];
export const ICONS = ['play', 'check', 'bookmark', 'trophy', 'pause', 'library'];
export const DEFAULT_OPTIONS = [
  ...STATUSES.map((status) => ({ ...status, kind: 'list', completed: ['completed', 'platinum'].includes(status.id), active: true, createdAt: 0, updatedAt: 0, scope: 'global', builtin: true })),
  ...GENRES.map((label) => ({ id: label, label, kind: 'genre', color: 'gray', icon: 'bookmark', completed: false, active: true, createdAt: 0, updatedAt: 0, scope: 'global', builtin: true })),
];

export function validateOption(option) {
  if (!['list', 'genre'].includes(option.kind)) throw new Error('Escolha lista ou gênero.');
  if (typeof option.label !== 'string' || !option.label.trim() || option.label.trim().length > 60) throw new Error('Use um nome com até 60 caracteres.');
  if (!COLORS.includes(option.color) || !ICONS.includes(option.icon)) throw new Error('Escolha uma cor e um ícone válidos.');
  if (typeof option.completed !== 'boolean' || typeof option.active !== 'boolean') throw new Error('Confira as opções da categoria.');
  return { kind: option.kind, label: option.label.trim(), color: option.color, icon: option.icon, completed: option.kind === 'list' && option.completed, active: option.active };
}

export function isStoredOption(option) {
  try {
    validateOption(option);
    return typeof option.id === 'string' && option.id.length > 0 && option.id.length <= 100 && !option.id.includes('/') && Number.isFinite(option.createdAt) && Number.isFinite(option.updatedAt);
  } catch { return false; }
}

export function mergeOptions(globalOptions = [], personalOptions = []) {
  const options = new Map(DEFAULT_OPTIONS.map((option) => [option.id, option]));
  globalOptions.forEach((option) => options.set(option.id, { ...option, scope: 'global', builtin: DEFAULT_OPTIONS.some((entry) => entry.id === option.id) }));
  personalOptions.forEach((option) => { if (!options.has(option.id)) options.set(option.id, { ...option, scope: 'personal', builtin: false }); });
  return [...options.values()];
}

export function checkOptionName(options, next, id) {
  if (options.some((option) => option.kind === next.kind && option.id !== id && option.active && normalizeText(option.label) === normalizeText(next.label))) {
    throw new Error('Já existe uma opção ativa com esse nome. Escolha outro nome.');
  }
}

export function selectableOptions(options, currentId) {
  return options.filter((option) => option.active || option.id === currentId);
}
