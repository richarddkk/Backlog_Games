export function parseFriendCode(value, ownUid) {
  const uid = value.trim().replace(/^checkpoint:/i, '');
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Cole o código completo do seu amigo.');
  if (uid === ownUid) throw new Error('Este é o seu código. Use o código de outra pessoa.');
  return uid;
}

export const friendshipId = (fromId, toId) => `${fromId}~${toId}`;
export const otherUid = (entry, uid) => entry.fromId === uid ? entry.toId : entry.fromId;
export const otherName = (entry, uid) => (entry.fromId === uid ? entry.toName : entry.fromName) || 'Jogador';
