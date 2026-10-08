import { useEffect, useMemo, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Library, Play, CircleCheck, Bookmark, Trophy, Pause, Plus, Sun, Moon, LogIn, LogOut, Cloud, HardDrive, Grip, Gamepad2, LoaderCircle, X, Check, RotateCcw, Settings, ShieldCheck } from 'lucide-react';
import useLibrary from './hooks/useLibrary.js';
import { formatRating } from './lib/model.js';
import GameCard from './components/GameCard.jsx';
import GameEditor from './components/GameEditor.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import Modal from './components/Modal.jsx';
import SettingsDialog from './components/SettingsDialog.jsx';
import ProfileDialog from './components/ProfileDialog.jsx';
import Avatar from './components/Avatar.jsx';

const statusIcons = { play: Play, check: CircleCheck, bookmark: Bookmark, trophy: Trophy, pause: Pause, library: Library };
const initialTheme = () => { try { return localStorage.getItem('checkpoint.theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };

export default function App() {
  const library = useLibrary();
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
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141112' : '#faf5f6');
    try { localStorage.setItem('checkpoint.theme', theme); } catch { /* A troca de tema ainda funciona nesta sessão. */ }
  }, [theme]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { setEditor(null); setSettingsOpen(false); setProfileOpen(false); setActiveList('all'); setGenre('all'); }, [library.user?.uid]);

  const visible = useMemo(() => library.games.filter((game) => (activeList === 'all' || game.status === activeList) && (genre === 'all' || game.genre === genre)), [library.games, activeList, genre]);
  const ratings = library.games.filter((game) => game.rating > 0);
  const average = ratings.length ? ratings.reduce((sum, game) => sum + game.rating, 0) / ratings.length : 0;
  const completed = library.games.filter((game) => lists.find((list) => list.id === game.status)?.completed).length;
  const title = activeList === 'all' ? 'Minha biblioteca' : lists.find((status) => status.id === activeList)?.label || 'Lista indisponível';
  const disabled = !library.ready || !library.taxonomy.ready || library.saving || library.taxonomy.saving;
  const notify = (text, error = false) => setNotice({ text, error });
  const move = async (id, direction) => {
    const index = visible.findIndex((game) => game.id === id);
    const target = visible[index + direction];
    if (!target) return;
    try { await library.reorder(id, target.id); notify('Ordem atualizada.'); } catch (failure) { notify(failure.message, true); }
  };
  const dragEnd = async ({ active, over }) => {
    setDragging(false);
    if (!over || active.id === over.id) return;
    try { await library.reorder(active.id, over.id); notify('Ordem atualizada.'); } catch (failure) { notify(failure.message, true); }
  };

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="./" aria-label="Checkpoint — início"><span className="brand-mark"><Gamepad2 size={25} strokeWidth={2.3} /></span><span>checkpoint<span className="brand-period">.</span></span></a>
      <div className="nav-label">SUA COLEÇÃO</div><nav className="collection-nav" aria-label="Listas da biblioteca"><button className={`nav-item ${activeList === 'all' ? 'active' : ''}`} onClick={() => setActiveList('all')} aria-current={activeList === 'all' ? 'page' : undefined}><Library size={19} /><span>Todos os jogos</span><span className="nav-count">{library.games.length}</span></button>
        {lists.filter((status) => status.active || library.games.some((game) => game.status === status.id)).map((status) => { const Icon = statusIcons[status.icon] || Library; return <button key={status.id} className={`nav-item ${activeList === status.id ? 'active' : ''}`} onClick={() => setActiveList(status.id)} aria-current={activeList === status.id ? 'page' : undefined} title={!status.active ? `${status.label} (arquivada)` : status.label}><Icon size={19} /><span>{status.label}</span><span className="nav-count">{library.games.filter((game) => game.status === status.id).length}</span></button>; })}</nav>
      <div className="sidebar-bottom"><div className="save-panel">{library.user ? <Cloud size={21} /> : <HardDrive size={21} />}<strong>{library.user ? 'Sua coleção na nuvem' : 'Biblioteca local'}</strong><p>{library.user ? 'Acesse seus jogos em qualquer dispositivo.' : 'Entre na sua conta para salvar também na nuvem.'}</p>{!library.user && <button className="button secondary" disabled={!library.authReady} onClick={() => setAuthOpen(true)}><LogIn size={16} />Entrar ou criar conta</button>}</div><div className="sidebar-credit"><span>Feito para quem joga.</span><span>v1.2</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><Library size={17} /><span>Coleção</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Configurações" title="Configurações" disabled={!library.authReady} onClick={() => setSettingsOpen(true)}><Settings size={19} /></button><button className="icon-button theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button><span className="topbar-separator" />{library.user ? <>{library.taxonomy.isAdmin && <span className="admin-badge" title="Administrador"><ShieldCheck size={15} /><span>Admin</span></span>}<button className="account-button profile-account" aria-label="Editar meu perfil" title="Editar meu perfil" onClick={() => setProfileOpen(true)}><Avatar src={library.profile.photoData} name={library.profile.displayName} /><span className="user-name">{library.profile.displayName}</span></button><button className="icon-button" aria-label="Sair da conta" disabled={library.saving || library.taxonomy.saving} onClick={async () => { try { await library.logout(); notify('Você saiu da conta.'); } catch (failure) { notify(failure.message, true); } }}><LogOut size={18} /></button></> : <button className="account-button" disabled={!library.authReady} onClick={() => setAuthOpen(true)}><span className="avatar"><Gamepad2 size={17} /></span><span>Minha conta</span></button>}</div></header>
      <main className="workspace"><div className="page-heading"><div><div className="eyebrow">SEU PRÓXIMO CHECKPOINT</div><h1>{title}<span className="heading-period">.</span></h1><p>{activeList === 'all' ? 'Cada jogo, uma história. Guarde as suas aqui.' : 'Os jogos que você escolheu para esta lista.'}</p></div><button className="button primary add-button" disabled={disabled} onClick={() => setEditor({ game: null })}><Plus size={19} />Adicionar jogo</button></div>
        <div className="library-summary"><div><span className="summary-value">{String(library.games.length).padStart(2, '0')}</span><span>jogos na coleção</span></div><div><span className="summary-value">{String(completed).padStart(2, '0')}</span><span>aventuras concluídas</span></div><div><span className="summary-value summary-rating">{average ? formatRating(average) : '—'}<span className="summary-star">★</span></span><span>sua nota média</span></div></div>
        {!library.user && <div className="local-banner"><div><HardDrive size={16} /><span><strong>Modo local.</strong> {library.games.some((game) => game.id.startsWith('example-')) ? 'Jogos de exemplo para você experimentar.' : 'Sua biblioteca está salva neste navegador.'}</span></div>{library.games.some((game) => game.id.startsWith('example-')) && <button className="text-button" disabled={disabled} onClick={() => setClearOpen(true)}>Começar biblioteca vazia</button>}</div>}
        <div className="library-toolbar"><div className="collection-title"><h2>{activeList === 'all' ? 'Todos os jogos' : title}</h2><span>{visible.length}</span></div><div className="library-controls"><span className="drag-tip"><Grip size={15} />Arraste para organizar</span><label className="genre-filter"><span className="sr-only">Filtrar por gênero</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos os gêneros</option>{genres.filter((option) => option.active || option.id === genre || library.games.some((game) => game.genre === option.id)).map((option) => <option key={option.id} value={option.id}>{option.label}{!option.active ? ' (arquivado)' : ''}</option>)}</select></label></div></div>
        {library.error || library.taxonomy.error ? <div className="error-state" role="alert"><Gamepad2 size={32} /><h2>Não foi possível carregar a biblioteca.</h2><p>{library.error || library.taxonomy.error}</p><button className="button secondary" onClick={() => { library.retry(); library.taxonomy.retry(); }}><RotateCcw size={16} />Tentar novamente</button></div> : !library.ready || !library.taxonomy.ready ? <div className="loading-state" role="status"><LoaderCircle size={26} className="spin" /><p>Carregando sua biblioteca...</p></div> : visible.length ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={dragEnd} accessibility={{ screenReaderInstructions: { draggable: 'Para mover um jogo, pressione Espaço. Use as setas para escolher a posição e pressione Espaço novamente para confirmar. Escape cancela.' }, announcements: { onDragStart: () => 'Jogo selecionado. Use as setas para mudar de posição.', onDragOver: ({ over }) => over ? 'Nova posição selecionada.' : 'Fora da lista.', onDragEnd: () => 'Movimento concluído.', onDragCancel: () => 'Movimento cancelado.' } }}><SortableContext items={visible.map((game) => game.id)} strategy={rectSortingStrategy}><div className={`game-grid ${dragging ? 'dragging-active' : ''}`}>{visible.map((game, index) => <GameCard key={game.id} game={game} lists={lists} genres={genres} index={index} total={visible.length} onEdit={(entry) => setEditor({ game: entry })} onMove={move} disabled={disabled} />)}</div></SortableContext></DndContext> : <div className="empty-state"><div className="empty-icon"><Gamepad2 size={32} /></div><h2>{genre !== 'all' ? 'Nenhum jogo deste gênero por aqui.' : 'Sua próxima história ainda não está aqui.'}</h2><p>{genre !== 'all' ? 'Escolha outro gênero ou adicione um jogo à coleção.' : 'Adicione um jogo, escolha sua lista e dê a sua nota.'}</p><button className="button secondary" onClick={() => genre !== 'all' ? setGenre('all') : setEditor({ game: null })}>{genre !== 'all' ? 'Mostrar todos os gêneros' : 'Adicionar meu primeiro jogo'}</button></div>}
        <footer className="workspace-footer"><span>Uma coleção com a sua cara.</span><span className="sync-state">{library.saving ? <><LoaderCircle size={13} className="spin" />Salvando...</> : library.user ? <><Cloud size={14} />{library.ready && !library.fromCache ? 'Sincronizado com sua conta' : 'Aguardando conexão'}</> : <><HardDrive size={14} />Salvo neste navegador</>}</span></footer>
      </main>
    </div>
    {editor && <GameEditor key={editor.game?.id || 'new'} game={editor.game} lists={lists} genres={genres} initialStatus={activeList} onClose={() => setEditor(null)} onSave={async (fields, id) => { await library.saveGame(fields, id); notify(id ? 'Jogo atualizado.' : 'Jogo adicionado à coleção.'); }} onDelete={async (id) => { await library.removeGame(id); notify('Jogo excluído.'); }} />}
    {settingsOpen && <SettingsDialog taxonomy={library.taxonomy} user={library.user} onClose={() => setSettingsOpen(false)} />}
    {profileOpen && library.user && <ProfileDialog key={library.user.uid} user={library.user} profile={library.profile} onClose={() => setProfileOpen(false)} onNotice={notify} />}
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} onSuccess={() => notify('Conta conectada. Carregando sua biblioteca...')} />}
    <Modal open={clearOpen} onOpenChange={setClearOpen} title="Começar sua própria coleção?" description="Isso remove todos os jogos do modo local, incluindo alterações que você fez nos exemplos. A biblioteca da sua conta não é alterada." busy={clearBusy} className="confirm-modal"><div className="modal-footer"><span /><div><button className="button secondary" disabled={clearBusy} onClick={() => setClearOpen(false)}>Cancelar</button><button className="button primary" disabled={clearBusy} onClick={async () => { setClearBusy(true); try { await library.clearLocal(); setClearOpen(false); notify('Tudo pronto para sua coleção.'); } catch (failure) { notify(failure.message, true); } finally { setClearBusy(false); } }}>{clearBusy ? 'Aguarde...' : 'Começar biblioteca vazia'}</button></div></div></Modal>
    {notice && <div className={`toast ${notice.error ? 'toast-error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.error ? <X size={17} /> : <Check size={17} />}<span>{notice.text}</span><button className="icon-button" aria-label="Dispensar aviso" onClick={() => setNotice(null)}><X size={16} /></button></div>}
  </div>;
}
