import { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { Cloud, LoaderCircle, Mail, LockKeyhole } from 'lucide-react';
import { auth, firebaseConfigured, friendlyError } from '../lib/firebase.js';
import Modal from './Modal.jsx';

export default function AuthDialog({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const switchMode = (next) => { setMode(next); setError(''); setMessage(''); };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!firebaseConfigured) return;
    if (mode === 'register' && password !== confirmation) { setError('As senhas precisam ser iguais.'); return; }
    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('Se houver uma conta para este e-mail, você receberá as instruções de recuperação.');
      } else {
        if (mode === 'register') await createUserWithEmailAndPassword(auth, email.trim(), password);
        else await signInWithEmailAndPassword(auth, email.trim(), password);
        onSuccess(); onClose();
      }
    } catch (failure) { setError(friendlyError(failure)); }
    finally { setBusy(false); }
  };
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={mode === 'register' ? 'Sua coleção, sempre com você.' : mode === 'reset' ? 'Recuperar sua conta' : 'Bem-vindo de volta.'} description="Entre para salvar sua biblioteca e acessar em outros dispositivos." className="auth-modal" busy={busy}>
    <div className="auth-cloud"><Cloud size={24} /><span>Notas, listas e ordem salvas na sua conta.</span></div>
    {!firebaseConfigured && <p className="setup-notice">O Firebase ainda não foi configurado. Siga o <strong>README.md</strong> do projeto para ativar as contas. Você já pode experimentar a biblioteca no modo local.</p>}
    {mode !== 'reset' && <div className="auth-tabs" role="group" aria-label="Acesso à conta"><button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>Entrar</button><button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>Criar conta</button></div>}
    <form onSubmit={submit}><fieldset disabled={busy || !firebaseConfigured}>
      <div className="field"><label htmlFor="auth-email">E-mail</label><div className="input-with-icon"><Mail size={18} /><input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="voce@email.com" /></div></div>
      {mode !== 'reset' && <div className="field"><label htmlFor="auth-password">Senha</label><div className="input-with-icon"><LockKeyhole size={18} /><input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === 'register' ? 6 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'Pelo menos 6 caracteres' : 'Sua senha'} /></div></div>}
      {mode === 'register' && <div className="field"><label htmlFor="auth-confirm">Confirmar senha</label><input id="auth-confirm" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={6} maxLength={128} autoComplete="new-password" placeholder="Repita a senha" /></div>}
      {mode === 'login' && <button type="button" className="text-button forgot-password" onClick={() => switchMode('reset')}>Esqueci minha senha</button>}
      <button className="button primary auth-submit" type="submit" disabled={busy || !firebaseConfigured}>{busy && <LoaderCircle className="spin" size={18} />}{busy ? 'Aguarde...' : mode === 'register' ? 'Criar minha conta' : mode === 'reset' ? 'Enviar instruções' : 'Entrar na minha conta'}</button>
    </fieldset>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}</form>
    {mode === 'reset' && <button type="button" className="text-button auth-back" disabled={busy} onClick={() => switchMode('login')}>Voltar para entrar</button>}
    <p className="auth-note">Ao entrar, você verá a biblioteca da sua conta. Os jogos do modo local continuam neste navegador e não são importados automaticamente.</p>
  </Modal>;
}
