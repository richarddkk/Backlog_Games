import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Bell, Trophy, Plus, History, LoaderCircle, RotateCcw } from 'lucide-react';
import Cover from '../components/Cover.jsx';
import useFriendActivity from '../hooks/useFriendActivity.js';
import { otherUid } from '../lib/friends.js';
import { activityVerb, formatActivityDate, sortActivities } from '../lib/activity.js';

export default function ActivitiesPage() {
  const { library, friends } = useOutletContext();
  const [filter, setFilter] = useState('all');
  const friendIds = library.user ? friends.accepted.map(entry => otherUid(entry, library.user.uid)) : [];
  const remote = useFriendActivity(library.user?.uid, friendIds);
  const events = sortActivities(filter === 'mine' ? library.activities : filter === 'friends' ? remote.events : [...library.activities, ...remote.events]);
  const ready = (filter === 'friends' || library.activityReady) && (filter === 'mine' || (friends.ready && remote.ready));
  return <main className="workspace activity-page">
    <div className="page-heading"><div><div className="eyebrow">CADA CONQUISTA TEM UMA HISTÓRIA</div><h1>Atividades<span className="heading-period">.</span></h1><p>Os novos jogos e conquistas da sua coleção e dos seus amigos.</p></div><Link className="button secondary" to="/amigos">Encontrar amigos</Link></div>
    <div className="activity-toolbar"><div className="segmented-control" role="group" aria-label="Filtrar atividades">
      {[['all', 'Todas'], ['mine', 'Minhas'], ['friends', 'Amigos']].map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <span className="activity-count">{events.length} {events.length === 1 ? 'atividade' : 'atividades'}</span></div>
    {(library.activityError || friends.error || remote.error) && <div className="social-error" role="alert"><p>{library.activityError || friends.error || remote.error}</p><button className="button secondary" onClick={() => { library.retry(); friends.retry(); }}><RotateCcw size={16} />Tentar novamente</button></div>}
    {!ready && !library.activityError && !friends.error ? <div className="loading-state" role="status"><LoaderCircle className="spin" /><p>Carregando atividades...</p></div> : events.length ? <ol className="activity-list">{events.map(event => {
      const Icon = event.type === 'added' ? Plus : event.status === 'platinum' ? Trophy : History;
      return <li className="activity-card" key={`${event.actorId}/${event.id}`}>
        <div className="activity-cover"><Cover src={event.coverUrl} title={event.gameTitle} /></div>
        <div className="activity-body"><span className={`activity-kind ${event.status === 'platinum' && event.type === 'status' ? 'gold' : ''}`}><Icon size={14} />{event.type === 'added' ? 'Novo jogo' : event.status === 'platinum' ? 'Platina conquistada' : 'Nova etapa'}</span>
          <p><strong>{event.actorName || 'Jogador'}</strong> {activityVerb(event)} <strong>{event.gameTitle}</strong>{event.type === 'status' && !['platinum', 'completed', 'playing', 'dropped', 'planned'].includes(event.status) ? <> para <strong>{event.statusLabel}</strong></> : null}.</p>
          <time dateTime={new Date(event.createdAt).toISOString()}>{formatActivityDate(event.createdAt)}</time>
        </div>
      </li>;
    })}</ol> : <div className="empty-state"><div className="empty-icon"><Bell size={32} /></div><h2>A próxima conquista aparece aqui.</h2><p>{filter === 'friends' ? 'Adicione amigos para acompanhar as atividades deles.' : 'Adicione um jogo ou mude sua lista para registrar uma atividade.'}</p><Link to={filter === 'friends' ? '/amigos' : '/'} className="button secondary">{filter === 'friends' ? 'Adicionar amigos' : 'Ir para a biblioteca'}</Link></div>}
    <p className="activity-footnote">{library.user ? 'Até 100 atividades recentes por pessoa. Amigos aceitos podem ver sua coleção e seu histórico.' : 'Até 500 atividades locais, somente neste navegador.'} O histórico começa nesta versão; ações antigas não recebem datas inventadas.</p>
  </main>;
}
