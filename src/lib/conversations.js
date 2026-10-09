import { validSocialId } from './sharing.js';
export function conversationId(first, second) {
  if (!validSocialId(first) || !validSocialId(second) || first === second) throw new Error('Escolha um amigo para conversar.');
  return [first, second].sort().join('~');
}
export function validateMessage(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 2000) throw new Error('Escreva uma mensagem com até 2.000 caracteres.');
  return value.trim();
}
