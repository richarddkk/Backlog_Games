import { describe, expect, it } from 'vitest';
import { activityVerb, buildActivities, isActivity, sortActivities } from '../src/lib/activity.js';
import { friendshipId, parseFriendCode } from '../src/lib/friends.js';

const game = { title: 'Hades', status: 'planned', coverUrl: '/covers/1145360.jpg' };
const params = { game, gameId: 'hades', actorId: 'richard', actorName: 'Richard', lists: [{ id: 'planned', label: 'Planejo jogar' }, { id: 'platinum', label: 'Platinado' }], now: 100 };

describe('Histórico de atividades', () => {
  it('registra nome, jogo e data da adição, sem criar eventos para simples edições', () => {
    const events = buildActivities(params);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ actorName: 'Richard', gameTitle: 'Hades', createdAt: 100, type: 'added' });
    expect(isActivity(events[0])).toBe(true);
    expect(buildActivities({ ...params, previous: game, game: { ...game, title: 'Hades atualizado' } })).toEqual([]);
  });
  it('registra uma nova platina ao mudar de lista e preserva a data de cada ação', () => {
    const added = buildActivities(params)[0];
    const platinum = buildActivities({ ...params, previous: game, game: { ...game, status: 'platinum' }, now: 200 })[0];
    expect(activityVerb(platinum)).toBe('platinou');
    expect(platinum).toMatchObject({ type: 'status', statusLabel: 'Platinado', createdAt: 200 });
    expect(sortActivities([added, platinum])).toEqual([platinum, added]);
    expect(buildActivities({ ...params, game: { ...game, status: 'platinum' } })).toHaveLength(2);
  });
  it('rejeita dados inválidos e códigos de amizade inseguros ou da própria conta', () => {
    const event = buildActivities(params)[0];
    expect(isActivity({ ...event, createdAt: NaN })).toBe(false);
    expect(isActivity({ ...event, coverUrl: 'javascript:alert(1)' })).toBe(false);
    expect(parseFriendCode(' checkpoint:bob ', 'alice')).toBe('bob');
    expect(friendshipId('alice', 'bob')).toBe('alice~bob');
    expect(() => parseFriendCode('alice', 'alice')).toThrow();
    expect(() => parseFriendCode('../bob', 'alice')).toThrow();
  });
});
