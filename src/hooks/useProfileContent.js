import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { isStoredGame, sortGames } from '../lib/model.js';
import { isStoredOption, mergeOptions } from '../lib/taxonomy.js';
import { isReviewPost, isStoredReview, mergeReview, readReviewPost, sortReviewPosts } from '../lib/reviews.js';

export default function useProfileContent(viewerId, targetId, friend, publicLibrary, globalOptions) {
  const key = JSON.stringify([viewerId, targetId, friend, publicLibrary]);
  const [state, setState] = useState({ key: '', ready: false, games: [], posts: [], options: [], remoteGlobals: [], error: '' });
  useEffect(() => {
    let active = true;
    const next = { key, ready: false, games: [], posts: [], options: [], remoteGlobals: [], error: '' };
    const needed = friend ? 4 : publicLibrary ? 4 : 1;
    const loaded = new Set();
    let games = [], reviews = new Map();
    const publish = () => {
      if (!active) return;
      setState({ ...next, games: next.error ? [] : sortGames(games.map(game => friend ? mergeReview(game, reviews.get(game.id)) : game)), ready: loaded.size === needed });
    };
    const fail = failure => { if (!active) return; next.error = friendlyError(failure); next.posts = []; games = []; publish(); };
    setState(next);
    if (!db || !targetId) { setState({ ...next, ready: true }); return; }
    const stops = [onSnapshot(query(collection(db, 'publicReviews'), where('actorId', '==', targetId), limit(100)), snapshot => {
      if (!active) return;
      next.posts = snapshot.docs.map(readReviewPost).filter(isReviewPost); loaded.add('posts'); publish();
    }, fail)];
    if (friend || publicLibrary) {
      const path = collection(db, 'users', targetId, 'games');
      // Textos antigos embutidos no jogo continuam restritos aos amigos.
      stops.push(onSnapshot(friend ? path : query(path, where('review', '==', '')), snapshot => {
        if (!active) return;
        games = snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
        if (!games.every(isStoredGame)) { fail(new Error('Há jogos inválidos nesta biblioteca.')); return; }
        loaded.add('games'); publish();
      }, fail));
      stops.push(onSnapshot(collection(db, 'users', targetId, 'options'), snapshot => {
        if (!active) return;
        next.options = snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
        if (!next.options.every(isStoredOption)) { fail(new Error('Há listas inválidas neste perfil.')); return; }
        loaded.add('options'); publish();
      }, fail));
    }
    if (publicLibrary && !friend) stops.push(onSnapshot(collection(db, 'taxonomy'), snapshot => {
      if (!active) return;
      next.remoteGlobals = snapshot.docs.map(document => ({ ...document.data(), id: document.id, scope: 'global' }));
      if (!next.remoteGlobals.every(isStoredOption)) { fail(new Error('Há gêneros globais inválidos.')); return; }
      loaded.add('taxonomy'); publish();
    }, fail));
    if (friend) stops.push(onSnapshot(query(collection(db, 'users', targetId, 'reviews'), where('visibility', 'in', ['friends', 'public'])), snapshot => {
      if (!active) return;
      const entries = snapshot.docs.map(document => [document.id, document.data()]);
      if (!entries.every(([, value]) => isStoredReview(value))) { fail(new Error('Há reviews inválidas neste perfil.')); return; }
      reviews = new Map(entries); loaded.add('reviews'); publish();
    }, fail));
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [key]);
  const current = state.key === key ? state : { ready: false, games: [], posts: [], options: [], remoteGlobals: [], error: '' };
  return { ...current, posts: sortReviewPosts(current.posts), options: mergeOptions([...(globalOptions || []).filter(item => item.scope === 'global'), ...(current.remoteGlobals || [])], current.options) };
}
