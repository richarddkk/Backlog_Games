import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { isStoredGame } from '../lib/model.js';
import { isStoredReview, mergeReview } from '../lib/reviews.js';

// Leitura de um único texto. Nunca consultamos todas as reviews de um amigo.
export default function useGameReview(ownUid, friendUid, gameId) {
  const key = JSON.stringify([ownUid, friendUid, gameId]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: '', ready: false, game: null, unavailable: false, error: '' });
  useEffect(() => {
    let active = true;
    const next = { key, ready: false, game: null, unavailable: false, error: '' };
    let game = null, review = null, gameReady = false, reviewReady = false;
    const publish = () => {
      if (!active) return;
      setState({ ...next, ready: gameReady && (reviewReady || !game), game: next.error ? null : game && mergeReview({ ...game, review: next.unavailable ? '' : game.review }, next.unavailable ? null : review) });
    };
    setState(next);
    if (!ownUid || !friendUid || !gameId) return;
    const fail = failure => {
      next.error = `Não foi possível abrir o jogo. Confira se vocês ainda são amigos. ${friendlyError(failure)}`;
      gameReady = true; reviewReady = true; publish();
    };
    const stops = [
      onSnapshot(doc(db, 'users', friendUid, 'games', gameId), snapshot => {
        if (!active) return;
        game = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
        if (game && !isStoredGame(game)) { fail(new Error('Dados do jogo inválidos.')); return; }
        gameReady = true; publish();
      }, fail),
      onSnapshot(doc(db, 'users', friendUid, 'reviews', gameId), snapshot => {
        if (!active) return;
        review = snapshot.exists() ? snapshot.data() : null;
        if (review && !isStoredReview(review)) { fail(new Error('Dados da avaliação inválidos.')); return; }
        next.unavailable = false; reviewReady = true; publish();
      }, failure => {
        if (!active) return;
        review = null; reviewReady = true;
        if (failure.code === 'permission-denied') { next.unavailable = true; publish(); }
        else fail(failure);
      }),
    ];
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [key, attempt]);
  return { ...(state.key === key ? state : { ready: false, game: null, unavailable: false, error: '' }), retry: useCallback(() => setAttempt(value => value + 1), []) };
}
