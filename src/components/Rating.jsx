import { useState } from 'react';
import { Star } from 'lucide-react';
import { formatRating } from '../lib/model.js';

export function Stars({ value = 0 }) {
  return <span className="stars" aria-label={value ? `${formatRating(value)} de 5 estrelas` : 'Sem avaliação'}>{[1, 2, 3, 4, 5].map((star) => <span className="star-shell" key={star}><Star className="star-empty" size={16} /><span className="star-fill" style={{ width: `${Math.max(0, Math.min(1, value - star + 1)) * 100}%` }}><Star size={16} fill="currentColor" /></span></span>)}</span>;
}

export default function Rating({ value, onChange }) {
  const [hover, setHover] = useState(null);
  return <div className="rating-picker" role="group" aria-label="Sua nota"><div className="interactive-stars" onMouseLeave={() => setHover(null)}>
    <Stars value={hover ?? value} />
    <div className="rating-hitboxes">{Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map((score) => <button key={score} type="button" aria-label={`Avaliar com ${formatRating(score)} estrelas`} aria-pressed={value === score} onMouseEnter={() => setHover(score)} onFocus={() => setHover(score)} onBlur={() => setHover(null)} onClick={() => onChange(score)} />)}</div>
    </div><span className="rating-number">{value ? `${formatRating(value)} / 5` : 'Sem nota'}</span>
    <button type="button" className="text-button" onClick={() => { onChange(0); setHover(null); }} disabled={!value}>Limpar</button>
  </div>;
}
