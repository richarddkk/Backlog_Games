import { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { safeImageUrl } from '../lib/model.js';

export default function Cover({ src, title, className = '' }) {
  const [failed, setFailed] = useState(false);
  const safe = safeImageUrl(src);
  useEffect(() => setFailed(false), [safe]);
  if (!safe || failed) return <div className={`cover-placeholder ${className}`}><Gamepad2 size={38} /><span>{title || 'Sem capa'}</span></div>;
  const resolved = safe.startsWith('/covers/') ? `${import.meta.env.BASE_URL}${safe.slice(1)}` : safe;
  return <img className={className} src={resolved} alt={`Capa de ${title}`} onError={() => setFailed(true)} loading="lazy" referrerPolicy="no-referrer" />;
}
