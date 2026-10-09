import { useEffect, useState } from 'react';
import { Camera, LoaderCircle, Save } from 'lucide-react';
import { preparePhoto } from '../lib/profile.js';
import Avatar from './Avatar.jsx';
import Modal from './Modal.jsx';

export default function ProfileDialog({ user, profile, onClose, onNotice }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [photoData, setPhotoData] = useState(profile.photoData);
  const [bio, setBio] = useState(profile.bio || '');
  const [libraryVisibility, setLibraryVisibility] = useState(profile.libraryVisibility || 'friends');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { if (profile.ready) { setDisplayName(profile.displayName); setPhotoData(profile.photoData); setBio(profile.bio || ''); setLibraryVisibility(profile.libraryVisibility || 'friends'); } }, [profile.ready]);
  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try { setPhotoData(await preparePhoto(file)); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await profile.save({ displayName, photoData, bio, libraryVisibility }); setMessage('Seu perfil foi atualizado.'); onNotice('Perfil atualizado.'); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title="Seu perfil" description="Personalize seu nome e sua foto para deixar a coleção com a sua cara." busy={busy} className="profile-modal">
    {profile.error ? <p className="form-error" role="alert">{profile.error} Publique a versão atual de firestore.rules e atualize a página.</p> : !profile.ready ? <p className="settings-loading" role="status"><LoaderCircle className="spin" size={18} />Carregando seu perfil...</p> : <form onSubmit={submit}><fieldset disabled={busy}><div className="profile-photo-editor"><Avatar src={photoData} name={displayName} className="profile-avatar" /><div><label className="button secondary photo-upload"><Camera size={17} />Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} aria-label="Escolher foto de perfil" /></label>{photoData && <button type="button" className="text-button" onClick={() => setPhotoData('')}>Remover foto</button>}<p>JPG, PNG ou WebP, até 5 MB. Recorte quadrado automático.</p></div></div><div className="field"><label htmlFor="profile-name">Nome de exibição</label><input id="profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} placeholder="Como você quer aparecer" autoComplete="nickname" /></div><div className="field"><label htmlFor="profile-bio">Sobre você</label><textarea id="profile-bio" rows={4} maxLength={600} value={bio} onChange={event => setBio(event.target.value)} placeholder="Seus jogos favoritos, seu jeito de jogar…" /><small>{bio.length} / 600</small></div><div className="field"><label htmlFor="profile-visibility">Quem pode ver sua biblioteca?</label><select id="profile-visibility" value={libraryVisibility} onChange={event => setLibraryVisibility(event.target.value)}><option value="friends">Amigos</option><option value="public">Todos</option></select><small>Nome, foto e bio ficam públicos ao salvar. As reviews mantêm a visibilidade escolhida em cada jogo. Seu e-mail não aparece no perfil público.</small></div><div className="field"><label htmlFor="profile-email">E-mail da conta</label><input id="profile-email" value={user.email || ''} readOnly /></div><div className="profile-save"><button className="button primary" type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{busy ? 'Aguarde...' : 'Salvar perfil'}</button></div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}</form>}
  </Modal>;
}
