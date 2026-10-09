import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, HardDrive, Grip, Gamepad2, LoaderCircle, RotateCcw, Cloud } from 'lucide-react';
import { formatRating } from '../lib/model.js';
import GameCard from '../components/GameCard.jsx';

export default function LibraryPage() {
  const { library, activeList, genre, setGenre, setEditor, setClearOpen, notify, disabled, libraryTitle: title } = useOutletContext();
  const { lists, genres } = library.taxonomy;
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const visible = useMemo(() => library.games.filter((game) => (activeList === 'all' || game.status === activeList) && (genre === 'all' || game.genre === genre)), [library.games, activeList, genre]);
  const ratings = library.games.filter((game) => game.rating > 0);
  const average = ratings.length ? ratings.reduce((sum, game) => sum + game.rating, 0) / ratings.length : 0;
  const completed = library.games.filter((game) => lists.find((list) => list.id === game.status)?.completed).length;
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

  return <main className="workspace"><div className="page-heading"><div><div className="eyebrow">SEU PRÓXIMO CHECKPOINT</div><h1>{title}<span className="heading-period">.</span></h1><p>{activeList === 'all' ? 'Cada jogo, uma história. Guarde as suas aqui.' : 'Os jogos que você escolheu para esta lista.'}</p></div><button className="button primary add-button" disabled={disabled} onClick={() => setEditor({ game: null })}><Plus size={19} />Adicionar jogo</button></div>
        <div className="library-summary"><div><span className="summary-value">{String(library.games.length).padStart(2, '0')}</span><span>jogos na coleção</span></div><div><span className="summary-value">{String(completed).padStart(2, '0')}</span><span>aventuras concluídas</span></div><div><span className="summary-value summary-rating">{average ? formatRating(average) : '—'}<span className="summary-star">★</span></span><span>sua nota média</span></div></div>
        {!library.user && <div className="local-banner"><div><HardDrive size={16} /><span><strong>Modo local.</strong> {library.games.some((game) => game.id.startsWith('example-')) ? 'Jogos de exemplo para você experimentar.' : 'Sua biblioteca está salva neste navegador.'}</span></div>{library.games.some((game) => game.id.startsWith('example-')) && <button className="text-button" disabled={disabled} onClick={() => setClearOpen(true)}>Começar biblioteca vazia</button>}</div>}
        <div className="library-toolbar"><div className="collection-title"><h2>{activeList === 'all' ? 'Todos os jogos' : title}</h2><span>{visible.length}</span></div><div className="library-controls"><span className="drag-tip"><Grip size={15} />Arraste para organizar</span><label className="genre-filter"><span className="sr-only">Filtrar por gênero</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos os gêneros</option>{genres.filter((option) => option.active || option.id === genre || library.games.some((game) => game.genre === option.id)).map((option) => <option key={option.id} value={option.id}>{option.label}{!option.active ? ' (arquivado)' : ''}</option>)}</select></label></div></div>
        {library.error || library.taxonomy.error ? <div className="error-state" role="alert"><Gamepad2 size={32} /><h2>Não foi possível carregar a biblioteca.</h2><p>{library.error || library.taxonomy.error}</p><button className="button secondary" onClick={() => { library.retry(); library.taxonomy.retry(); }}><RotateCcw size={16} />Tentar novamente</button></div> : !library.ready || !library.taxonomy.ready ? <div className="loading-state" role="status"><LoaderCircle size={26} className="spin" /><p>Carregando sua biblioteca...</p></div> : visible.length ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={dragEnd} accessibility={{ screenReaderInstructions: { draggable: 'Para mover um jogo, pressione Espaço. Use as setas para escolher a posição e pressione Espaço novamente para confirmar. Escape cancela.' }, announcements: { onDragStart: () => 'Jogo selecionado. Use as setas para mudar de posição.', onDragOver: ({ over }) => over ? 'Nova posição selecionada.' : 'Fora da lista.', onDragEnd: () => 'Movimento concluído.', onDragCancel: () => 'Movimento cancelado.' } }}><SortableContext items={visible.map((game) => game.id)} strategy={rectSortingStrategy}><div className={`game-grid ${dragging ? 'dragging-active' : ''}`}>{visible.map((game, index) => <GameCard key={game.id} game={game} lists={lists} genres={genres} index={index} total={visible.length} onEdit={(entry) => setEditor({ game: entry })} onMove={move} disabled={disabled} />)}</div></SortableContext></DndContext> : <div className="empty-state"><div className="empty-icon"><Gamepad2 size={32} /></div><h2>{genre !== 'all' ? 'Nenhum jogo deste gênero por aqui.' : 'Sua próxima história ainda não está aqui.'}</h2><p>{genre !== 'all' ? 'Escolha outro gênero ou adicione um jogo à coleção.' : 'Adicione um jogo, escolha sua lista e dê a sua nota.'}</p><button className="button secondary" onClick={() => genre !== 'all' ? setGenre('all') : setEditor({ game: null })}>{genre !== 'all' ? 'Mostrar todos os gêneros' : 'Adicionar meu primeiro jogo'}</button></div>}
        <footer className="workspace-footer"><span>Uma coleção com a sua cara.</span><span className="sync-state">{library.saving ? <><LoaderCircle size={13} className="spin" />Salvando...</> : library.user ? <><Cloud size={14} />{library.ready && !library.fromCache ? 'Sincronizado com sua conta' : 'Aguardando conexão'}</> : <><HardDrive size={14} />Salvo neste navegador</>}</span></footer>
      </main>;
}
