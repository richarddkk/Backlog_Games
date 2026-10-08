import { describe, expect, it } from 'vitest';
import { reorderGames, safeImageUrl, sortGames, validateGame } from '../src/lib/model.js';

const fields = { title: ' Hades ', genre: 'Roguelike', status: 'completed', rating: 4.5, coverUrl: 'https://example.com/cover.jpg', review: ' Muito bom. ' };
const games = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, rank: (i + 1) * 1024 }));
const applyOrder = (updates, current = games) => sortGames(current.map((game) => ({ ...game, ...updates.find((update) => update.id === game.id) }))).map((game) => game.id);

describe('Dados da biblioteca', () => {
  it('salva notas de meia estrela e limpa os textos', () => {
    expect(validateGame(fields)).toEqual({ ...fields, title: 'Hades', review: 'Muito bom.' });
    expect(() => validateGame({ ...fields, rating: 4.3 })).toThrow();
    expect(() => validateGame({ ...fields, rating: 5.5 })).toThrow();
    expect(() => validateGame({ ...fields, status: 'unknown' })).toThrow();
  });
  it('permite capas HTTP/HTTPS e do catálogo, e bloqueia outros protocolos', () => {
    expect(safeImageUrl('/covers/1145360.jpg')).toBe('/covers/1145360.jpg');
    expect(safeImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    for (const input of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '/covers/../file.jpg', 'ftp://host/image.jpg']) expect(safeImageUrl(input)).toBe('');
  });
  it('reordena para frente e para trás mantendo os demais jogos', () => {
    expect(applyOrder(reorderGames(games, 'a', 'c'))).toEqual(['b', 'c', 'a', 'd']);
    expect(applyOrder(reorderGames(games, 'd', 'b'))).toEqual(['a', 'd', 'b', 'c']);
    expect(reorderGames(games, 'a', 'a')).toEqual([]);
  });
  it('redistribui as posições se o espaço entre números acabar', () => {
    const current = [{ id: 'a', rank: 1 }, { id: 'b', rank: 1 + Number.EPSILON }, { id: 'c', rank: 3 }];
    const updates = reorderGames(current, 'c', 'b');
    expect(updates).toHaveLength(3);
    expect(applyOrder(updates, current)).toEqual(['a', 'c', 'b']);
  });
});
