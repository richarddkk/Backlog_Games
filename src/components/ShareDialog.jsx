import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import Modal from './Modal.jsx';
import { reviewLinks } from '../lib/sharing.js';

export default function ShareDialog({ post, onClose }) {
  const links = reviewLinks(post);
  const [message, setMessage] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(links.url); setMessage('Link copiado. Cole onde quiser compartilhar.'); }
    catch { setMessage('Selecione e copie o link abaixo.'); }
  };
  return <Modal open onOpenChange={open => { if (!open) onClose(); }} title="Compartilhar review" description="Quem abrir o link vai direto para sua avaliação.">
    {links.image && <img className="share-preview" src={links.image} alt={`Prévia de ${post.gameTitle}, por ${post.actorName}`} />}
    <div className="field"><label htmlFor="share-link">Link da review</label><input id="share-link" value={links.url} readOnly onFocus={event => event.target.select()} /></div>
    <p className="share-help">{post.visibility !== 'public' ? 'Este link mantém a privacidade da review. Amigos precisam entrar na conta; Só eu pode ser lida apenas por você.' : links.rich ? 'Cole o link para solicitar uma prévia com capa, nota e situação do jogo. Cada rede social decide como exibir essa prévia.' : 'O link direto já funciona. A prévia personalizada ficará disponível quando o compartilhamento estiver configurado.'}</p>
    <div className="profile-actions"><button className="button primary" onClick={copy}><Copy size={16} />Copiar link</button><a className="button secondary" href={links.url} target="_blank" rel="noreferrer"><ExternalLink size={16} />Abrir link</a></div>
    {message && <p role="status" className="form-success">{message}</p>}
  </Modal>;
}
