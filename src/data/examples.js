import catalog from './catalog.json';

const examples = [
  [1245620, 'playing', 4.5], [367520, 'platinum', 5],
  [1145360, 'completed', 4.5], [1174180, 'completed', 5],
  [1091500, 'planned', 0], [413150, 'playing', 4],
  [504230, 'completed', 4.5], [292030, 'planned', 0],
];
export const createExamples = () => examples.flatMap(([steamId, status, rating], index) => {
  const game = catalog.find((entry) => entry.steamId === steamId);
  return game ? [{ id: `example-${steamId}`, title: game.title, genre: game.genre, coverUrl: game.coverUrl, status, rating, review: '', rank: (index + 1) * 1024, createdAt: 1, updatedAt: 1 }] : [];
});
