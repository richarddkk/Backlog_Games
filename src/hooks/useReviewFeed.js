import { useCallback, useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db, friendlyError } from '../lib/firebase.js';
import { isStoredGame } from '../lib/model.js';
import { isReviewPost, isStoredReview, mergeReview, makeReviewPost, readReviewPost, REVIEW_FEED_LIMIT, sortReviewPosts } from '../lib/reviews.js';
import { isStoredOption, mergeOptions } from '../lib/taxonomy.js';

export default function useReviewFeed(ownUid, friendIds, global, globalOptions = []) {
  const key = JSON.stringify([ownUid || null, [...new Set(friendIds)].sort(), global, globalOptions.filter(option => option.scope === 'global')]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: '', ready: false, posts: [], error: '' });
  useEffect(() => {
    let active = true;
    const [, ids, isGlobal, globals] = JSON.parse(key);
    const sources = new Map();
    const waiting = new Set(isGlobal ? ['global'] : ownUid ? ids : []);
    const errors = new Map();
    const publish = () => {
      if (active) setState({ key, ready: waiting.size === 0, posts: sortReviewPosts([...sources.values()].flat()), error: [...errors.values()].join(' ') });
    };
    publish();
    if (!db) { waiting.clear(); if (isGlobal) errors.set('global', 'Configure o Firebase para consultar e publicar reviews globais.'); publish(); return; }
    const fail = id => failure => {
      if (!active) return;
      sources.delete(id); waiting.delete(id);
      errors.set(id, `Não foi possível carregar ${id === 'global' ? 'as reviews globais' : 'as reviews de um amigo'}. ${friendlyError(failure)}`);
      publish();
    };
    const stops = [];
    if (isGlobal) {
      stops.push(onSnapshot(query(collection(db, 'publicReviews'), orderBy('updatedAt', 'desc'), limit(REVIEW_FEED_LIMIT)), snapshot => {
        if (!active) return;
        const posts = snapshot.docs.map(readReviewPost);
        if (!posts.every(post => isReviewPost(post) && post.visibility === 'public')) { fail('global')(new Error('Existem publicações inválidas.')); return; }
        sources.set('global', posts); waiting.delete('global'); errors.delete('global'); publish();
      }, fail('global')));
    } else if (ownUid) ids.forEach(uid => {
      let games = [], reviews = new Map(), options = [], name = 'Jogador', failed = false;
      const loaded = new Set();
      const failFriend = failure => { failed = true; fail(uid)(failure); };
      const update = () => {
        if (!active || failed || loaded.size !== 4) return;
        const posts = games.map(game => mergeReview(game, reviews.get(game.id))).filter(game => game.review?.trim() && game.reviewVisibility !== 'private')
          .map(game => makeReviewPost({ actorId: uid, actorName: name, gameId: game.id, game, lists: options.filter(option => option.kind === 'list'), genres: options.filter(option => option.kind === 'genre'), updatedAt: game.reviewUpdatedAt || game.updatedAt }));
        sources.set(uid, sortReviewPosts(posts).slice(0, REVIEW_FEED_LIMIT)); waiting.delete(uid); errors.delete(uid); publish();
      };
      stops.push(onSnapshot(collection(db, 'users', uid, 'games'), snapshot => {
        if (!active) return;
        games = snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
        if (!games.every(isStoredGame)) { failFriend(new Error('Há jogos inválidos na coleção.')); return; }
        loaded.add('games'); update();
      }, failFriend));
      // A consulta contém a condição exigida pelas regras; textos privados não chegam ao navegador.
      stops.push(onSnapshot(query(collection(db, 'users', uid, 'reviews'), where('visibility', 'in', ['friends', 'public'])), snapshot => {
        if (!active) return;
        const entries = snapshot.docs.map(document => [document.id, document.data()]);
        if (!entries.every(([, value]) => isStoredReview(value) && value.visibility !== 'private')) { failFriend(new Error('Há reviews inválidas na coleção.')); return; }
        reviews = new Map(entries); loaded.add('reviews'); update();
      }, failFriend));
      stops.push(onSnapshot(collection(db, 'users', uid, 'options'), snapshot => {
        if (!active) return;
        const personal = snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
        if (!personal.every(isStoredOption)) { failFriend(new Error('Há listas inválidas nesta coleção.')); return; }
        options = mergeOptions(globals, personal); loaded.add('options'); update();
      }, failFriend));
      stops.push(onSnapshot(doc(db, 'users', uid, 'profile', 'main'), snapshot => {
        if (!active) return;
        name = snapshot.exists() ? snapshot.data().displayName || 'Jogador' : 'Jogador';
        loaded.add('profile'); update();
      }, failFriend));
    });
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [key, attempt]);
  return { ...(state.key === key ? state : { ready: false, posts: [], error: '' }), retry: useCallback(() => setAttempt(value => value + 1), []) };
}
