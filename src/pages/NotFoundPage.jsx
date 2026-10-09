import { Link } from 'react-router-dom';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

export default function NotFoundPage() {
  return <main className="workspace not-found-page">
    <div className="not-found-art" aria-hidden="true"><span>4</span><Gamepad2 size={96} strokeWidth={1.3} /><span>4</span></div>
    <div className="eyebrow">CHECKPOINT NÃO ENCONTRADO</div>
    <h1>404 — Página não encontrada</h1>
    <p>Esse caminho não leva a nenhum jogo. Sua biblioteca está logo ali.</p>
    <Link to="/" className="button primary"><ArrowLeft size={18} />Voltar para a biblioteca</Link>
  </main>;
}
