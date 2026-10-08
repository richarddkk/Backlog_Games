import { useEffect, useState } from 'react';
export default function Avatar({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <span className={`avatar ${className}`}>{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span aria-hidden="true">{(name || 'J').slice(0, 1).toLocaleUpperCase('pt-BR')}</span>}</span>;
}
