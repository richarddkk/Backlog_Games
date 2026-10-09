import { expect, it } from 'vitest';
import { validateGame, formatHours } from '../src/lib/model.js';
import { validateProfile } from '../src/lib/profile.js';
import { reviewLinks } from '../src/lib/sharing.js';
import { conversationId, validateMessage } from '../src/lib/conversations.js';
const fields = { title:'Hades', genre:'Roguelike', status:'completed', rating:4.5, coverUrl:'', review:'' };
it('preserva jogos e perfis antigos, aceita horas fracionadas e valida a bio', () => {
  expect(validateGame(fields).hoursPlayed).toBe(0);
  expect(validateGame({ ...fields, hoursPlayed:42.5 }).hoursPlayed).toBe(42.5);
  expect(formatHours(42.5)).toBe('42,5 h');
  for (const hoursPlayed of [-1,NaN,Infinity,1000001,'42']) expect(() => validateGame({ ...fields,hoursPlayed })).toThrow();
  expect(validateProfile({ displayName:'Alice',photoData:'' })).toMatchObject({ bio:'',libraryVisibility:'friends' });
  expect(() => validateProfile({ displayName:'Alice',photoData:'',bio:'x'.repeat(601) })).toThrow();
});
it('usa prévia só para review pública, mantém links protegidos e respeita o caminho do GitHub', () => {
  const post = { actorId:'alice',gameId:'hades',visibility:'public' };
  const app = 'https://richarddkk.github.io/Backlog_Games/#/reviews';
  expect(reviewLinks(post,app,'https://share.example.com').url).toBe('https://share.example.com/r/alice/hades');
  expect(reviewLinks({ ...post,visibility:'friends' },app,'https://share.example.com')).toMatchObject({ rich:false,image:'',url:'https://richarddkk.github.io/Backlog_Games/#/reviews/alice/hades' });
  expect(reviewLinks(post,app,'javascript:alert(1)').rich).toBe(false);
  expect(reviewLinks(post,app,'').url).toContain('/Backlog_Games/#/reviews/alice/hades');
});
it('gera a mesma conversa para as duas pessoas e rejeita texto vazio, longo ou auto-conversa', () => {
  expect(conversationId('alice','bob')).toBe(conversationId('bob','alice'));
  expect(validateMessage('  Olá!  ')).toBe('Olá!');
  expect(() => conversationId('alice','alice')).toThrow();
  expect(() => validateMessage(' \n ')).toThrow();
  expect(() => validateMessage('x'.repeat(2001))).toThrow();
});
