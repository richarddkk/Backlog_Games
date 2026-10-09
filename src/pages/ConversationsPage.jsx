import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { LoaderCircle, MessageSquare, Send } from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import useConversation from '../hooks/useConversation.js';
import { otherName, otherUid } from '../lib/friends.js';

export default function ConversationsPage() {
  const { library, friends, notify, openAuth } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const uid = library.user?.uid;
  const selected = params.get('com');
  const chosen = friends.accepted.find(entry => otherUid(entry, uid) === selected);
  const chat = useConversation(uid, chosen ? selected : null);
  const [text, setText] = useState('');
  const sessionKey = `${uid || ''}/${selected || ''}`;
  const currentKey = useRef(sessionKey); currentKey.current = sessionKey;
  const end = useRef(null);
  useEffect(() => { setText(''); }, [sessionKey]);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }); }, [sessionKey, chat.messages.length]);
  const submit = async event => {
    event.preventDefault(); const key = sessionKey;
    try { await chat.send(text); if (currentKey.current === key) setText(''); }
    catch (failure) { if (currentKey.current === key) notify(failure.message, true); }
  };
  return <main className="workspace conversations-page"><div className="page-heading"><div><div className="eyebrow">A PRÓXIMA PARTIDA COMEÇA NA CONVERSA</div><h1>Conversas<span className="heading-period">.</span></h1><p>Mensagens privadas entre amigos, atualizadas em tempo real.</p></div></div>
    {!uid ? <div className="empty-state"><div className="empty-icon"><MessageSquare size={30} /></div><h2>Entre na conta para conversar.</h2><button className="button primary" onClick={openAuth}>Entrar na conta</button></div> : friends.error ? <div className="social-error" role="alert"><p>{friends.error}</p><button className="button secondary" onClick={friends.retry}>Tentar novamente</button></div> : !friends.ready ? <div className="loading-state"><LoaderCircle className="spin" /><p>Carregando amigos...</p></div> : <div className="chat-layout">
      <aside className="chat-friends" aria-label="Escolher conversa"><h2>Seus amigos</h2>{friends.accepted.length ? friends.accepted.map(entry => { const id = otherUid(entry, uid); return <button className={`chat-friend ${id === selected ? 'selected' : ''}`} key={entry.id} onClick={() => setParams({ com: id })} aria-pressed={id === selected}><Avatar name={otherName(entry, uid)} /><span>{otherName(entry, uid)}</span></button>; }) : <p>Adicione um amigo para começar.<br /><Link to="/amigos">Encontrar amigos</Link></p>}</aside>
      <section className="chat-panel" aria-label="Conversa privada">{chosen ? <><header className="chat-header"><Link to={`/perfil/${selected}`} className="profile-author-link"><Avatar name={otherName(chosen, uid)} /><strong>{otherName(chosen, uid)}</strong></Link><small>Apenas vocês dois</small></header>
        <div className="chat-messages" role="log" aria-label="Mensagens" aria-live="polite" aria-relevant="additions text">{chat.error ? <div className="social-error" role="alert"><p>{chat.error}</p><button className="button secondary" onClick={chat.retry}>Tentar novamente</button></div> : !chat.ready ? <p role="status">Carregando conversa...</p> : chat.messages.length ? chat.messages.map(message => <article className={`chat-message ${message.senderId === uid ? 'own' : ''}`} key={message.id}><p>{message.text}</p><time dateTime={message.createdAt ? new Date(message.createdAt).toISOString() : undefined}>{message.pending ? 'Enviando…' : new Date(message.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></article>) : <p className="chat-empty">Mande um oi e combine a próxima partida.</p>}<div ref={end} /></div>
        <form className="chat-composer" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Sua mensagem</label><textarea id="chat-message" value={text} rows={2} maxLength={2000} placeholder="Escreva uma mensagem…" disabled={!chat.ready || chat.busy || Boolean(chat.error)} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (text.trim() && chat.ready && !chat.busy && !chat.error) event.currentTarget.form.requestSubmit(); } }} /><button className="button primary" type="submit" disabled={!chat.ready || chat.busy || !text.trim() || Boolean(chat.error)}>{chat.busy ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}Enviar</button><small>{text.length} / 2.000 · Enter envia; Shift + Enter quebra a linha.</small></form>
      </> : <div className="empty-state"><MessageSquare size={32} /><h2>{selected ? 'Conversa indisponível.' : 'Escolha um amigo para conversar.'}</h2><p>{selected ? 'O chat exige uma amizade aceita entre vocês.' : 'As mensagens aparecem aqui e ficam salvas na sua conta.'}</p></div>}</section>
    </div>}
    {uid && <p className="reviews-footnote">São exibidas as 100 mensagens mais recentes. Remover a amizade bloqueia o acesso à conversa.</p>}
  </main>;
}
