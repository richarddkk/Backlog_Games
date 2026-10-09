import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Library, Play, CircleCheck, Bookmark, Trophy, Pause, Plus, Sun, Moon, LogIn, LogOut, Cloud, HardDrive, Grip, Gamepad2, LoaderCircle, X, Check, RotateCcw, Settings, ShieldCheck, Bell, Users } from 'lucide-react';
import useLibrary from '../hooks/useLibrary.js';
import GameEditor from '../components/GameEditor.jsx';
import AuthDialog from '../components/AuthDialog.jsx';
import Modal from '../components/Modal.jsx';
import SettingsDialog from '../components/SettingsDialog.jsx';
import ProfileDialog from '../components/ProfileDialog.jsx';
import Avatar from '../components/Avatar.jsx';
import useFriends from '../hooks/useFriends.js';

const titleForPath = (path) => path === '/' ? 'Biblioteca' : path === '/atividades' ? 'Atividades' : path === '/amigos' ? 'Amigos' : 'Página não encontrada';
const statusIcons = { play: Play, check: CircleCheck, bookmark: Bookmark, trophy: Trophy, pause: Pause, library: Library };
const initialTheme = () => { try { return localStorage.getItem('checkpoint.theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };

export default function AppLayout() {
  const library = useLibrary();
  const friends = useFriends(library.user, library.authReady, library.profile.displayName);
  const location = useLocation();
  const navigate = useNavigate();
  const onLibrary = location.pathname === '/';
  const chooseList = (id) => { setActiveList(id); navigate('/'); };
  const { lists, genres } = library.taxonomy;
  const [theme, setTheme] = useState(initialTheme);
  const [activeList, setActiveList] = useState('all');
  const [genre, setGenre] = useState('all');
  const [editor, setEditor] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141112' : '#faf5f6');
    try { localStorage.setItem('checkpoint.theme', theme); } catch { /* A troca de tema ainda funciona nesta sessão. */ }
  }, [theme]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { setEditor(null); setSettingsOpen(false); setProfileOpen(false); setActiveList('all'); setGenre('all'); setAuthOpen(false); }, [library.user?.uid]);
  useEffect(() => { document.title = `${titleForPath(location.pathname)} — Checkpoint`; }, [location.pathname]);

  const libraryTitle = activeList === 'all' ? 'Minha biblioteca' : lists.find((status) => status.id === activeList)?.label || 'Lista indisponível';
  const title = onLibrary ? libraryTitle : location.pathname === '/atividades' ? 'Atividades' : location.pathname === '/amigos' ? 'Amigos' : 'Página não encontrada';
  const disabled = !library.ready || !library.taxonomy.ready || library.saving || library.taxonomy.saving;
  const notify = (text, error = false) => setNotice({ text, error });
  return <div className="app-shell">
    <aside className="sidebar"><Link className="brand" to="/" aria-label="Checkpoint — início"><span className="brand-mark"><Gamepad2 size={25} strokeWidth={2.3} /></span><span>checkpoint<span className="brand-period">.</span></span></Link>
      <div className="nav-label">SUA COLEÇÃO</div><nav className="collection-nav" aria-label="Listas da biblioteca"><button className={`nav-item ${onLibrary && activeList === 'all' ? 'active' : ''}`} onClick={() => chooseList('all')} aria-current={onLibrary && activeList === 'all' ? 'page' : undefined}><Library size={19} /><span>Todos os jogos</span><span className="nav-count">{library.games.length}</span></button>
        {lists.filter((status) => status.active || library.games.some((game) => game.status === status.id)).map((status) => { const Icon = statusIcons[status.icon] || Library; return <button key={status.id} className={`nav-item ${onLibrary && activeList === status.id ? 'active' : ''}`} onClick={() => chooseList(status.id)} aria-current={onLibrary && activeList === status.id ? 'page' : undefined} title={!status.active ? `${status.label} (arquivada)` : status.label}><Icon size={19} /><span>{status.label}</span><span className="nav-count">{library.games.filter((game) => game.status === status.id).length}</span></button>; })}</nav>
      <div className="nav-label social-nav-label">SUA JORNADA</div>
      <nav className="collection-nav" aria-label="Páginas">
        <NavLink to="/atividades" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Bell size={19} /><span>Atividades</span></NavLink>
        <NavLink to="/amigos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Users size={19} /><span>Amigos</span>{friends.incoming.length > 0 && <span className="nav-count">{friends.incoming.length}</span>}</NavLink>
      </nav>
      <div className="sidebar-bottom"><div className="save-panel">{library.user ? <Cloud size={21} /> : <HardDrive size={21} />}<strong>{library.user ? 'Sua coleção na nuvem' : 'Biblioteca local'}</strong><p>{library.user ? 'Acesse seus jogos em qualquer dispositivo.' : 'Entre na sua conta para salvar também na nuvem.'}</p>{!library.user && <button className="button secondary" disabled={!library.authReady} onClick={() => setAuthOpen(true)}><LogIn size={16} />Entrar ou criar conta</button>}</div><div className="sidebar-credit"><span>Feito para quem joga.</span><span>v1.3</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Library size={17} /><span>Coleção</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Configurações" title="Configurações" disabled={!library.authReady} onClick={() => setSettingsOpen(true)}><Settings size={19} /></button><button className="icon-button theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button><span className="topbar-separator" />{library.user ? <>{library.taxonomy.isAdmin && <span className="admin-badge" title="Administrador"><ShieldCheck size={15} /><span>Admin</span></span>}<button className="account-button profile-account" aria-label="Editar meu perfil" title="Editar meu perfil" onClick={() => setProfileOpen(true)}><Avatar src={library.profile.photoData} name={library.profile.displayName} /><span className="user-name">{library.profile.displayName}</span></button><button className="icon-button" aria-label="Sair da conta" disabled={library.saving || library.taxonomy.saving} onClick={async () => { try { await library.logout(); notify('Você saiu da conta.'); } catch (failure) { notify(failure.message, true); } }}><LogOut size={18} /></button></> : <button className="account-button" disabled={!library.authReady} onClick={() => setAuthOpen(true)}><span className="avatar"><Gamepad2 size={17} /></span><span>Minha conta</span></button>}</div></header>
      <Outlet context={{ library, friends, activeList, genre, setGenre, setEditor, setClearOpen, notify, disabled, libraryTitle }} />
    </div>
    {editor && <GameEditor key={editor.game?.id || 'new'} game={editor.game} lists={lists} genres={genres} initialStatus={activeList} onClose={() => setEditor(null)} onSave={async (fields, id) => { await library.saveGame(fields, id); notify(id ? 'Jogo atualizado.' : 'Jogo adicionado à coleção.'); }} onDelete={async (id) => { await library.removeGame(id); notify('Jogo excluído.'); }} />}
    {settingsOpen && <SettingsDialog taxonomy={library.taxonomy} user={library.user} onClose={() => setSettingsOpen(false)} />}
    {profileOpen && library.user && <ProfileDialog key={library.user.uid} user={library.user} profile={library.profile} onClose={() => setProfileOpen(false)} onNotice={notify} />}
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} onSuccess={() => notify('Conta conectada. Carregando sua biblioteca...')} />}
    <Modal open={clearOpen} onOpenChange={setClearOpen} title="Começar sua própria coleção?" description="Isso remove todos os jogos do modo local, incluindo alterações que você fez nos exemplos. A biblioteca da sua conta não é alterada." busy={clearBusy} className="confirm-modal"><div className="modal-footer"><span /><div><button className="button secondary" disabled={clearBusy} onClick={() => setClearOpen(false)}>Cancelar</button><button className="button primary" disabled={clearBusy} onClick={async () => { setClearBusy(true); try { await library.clearLocal(); setClearOpen(false); notify('Tudo pronto para sua coleção.'); } catch (failure) { notify(failure.message, true); } finally { setClearBusy(false); } }}>{clearBusy ? 'Aguarde...' : 'Começar biblioteca vazia'}</button></div></div></Modal>
    {notice && <div className={`toast ${notice.error ? 'toast-error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.error ? <X size={17} /> : <Check size={17} />}<span>{notice.text}</span><button className="icon-button" aria-label="Dispensar aviso" onClick={() => setNotice(null)}><X size={16} /></button></div>}
  </div>;
}
