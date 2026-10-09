import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { DEFAULT_OPTIONS } from '../src/lib/taxonomy.js';
import ReviewPage from '../src/pages/ReviewPage.jsx';
import ProfilePage from '../src/pages/ProfilePage.jsx';
import ConversationsPage from '../src/pages/ConversationsPage.jsx';
const state = vi.hoisted(() => ({ publicProfile:null,post:null,friendGame:null,content:{},chat:{},documentError:'' }));
vi.mock('../src/hooks/usePublicDocument.js', () => ({ default:(collection)=>({ ready:true,error:state.documentError,data:collection==='publicProfiles'?state.publicProfile:collection==='publicReviews'?state.post:null }) }));
vi.mock('../src/hooks/useGameReview.js', () => ({ default:()=>({ready:true,error:'',game:state.friendGame}) }));
vi.mock('../src/hooks/useProfileContent.js', () => ({ default:()=>state.content }));
vi.mock('../src/hooks/useConversation.js', () => ({ default:()=>state.chat }));
const post = { actorId:'bob',actorName:'Bob',gameId:'hades',gameTitle:'Hades',coverUrl:'',rating:4.5,hoursPlayed:42.5,status:'platinum',statusLabel:'Platinado',genreLabel:'Roguelike',text:'Review pública de Bob.',visibility:'public',updatedAt:200 };
const friendship={id:'alice~bob',fromId:'alice',toId:'bob',fromName:'Alice',toName:'Bob',status:'accepted'};
const friends={ ready:true,error:'',busy:false,accepted:[],incoming:[],outgoing:[],sendRequest:vi.fn(async()=>{}),accept:vi.fn(async()=>{}),remove:vi.fn(async()=>{}) };
const library={ authReady:true,user:{uid:'alice'},ready:true,games:[],profile:{displayName:'Alice',photoData:'',bio:'',libraryVisibility:'friends'},taxonomy:{options:DEFAULT_OPTIONS,lists:DEFAULT_OPTIONS.filter(item=>item.kind==='list'),genres:DEFAULT_OPTIONS.filter(item=>item.kind==='genre')} };
const context={library,friends,notify:vi.fn(),setEditor:vi.fn(),disabled:false,openAuth:vi.fn(),openProfile:vi.fn()};
const page=(path)=>render(<MemoryRouter initialEntries={[path]}><Routes><Route element={<Outlet context={context}/>}><Route path="reviews/:authorId/:gameId" element={<ReviewPage/>}/><Route path="perfil/:userId" element={<ProfilePage/>}/><Route path="conversas" element={<ConversationsPage/>}/></Route></Routes></MemoryRouter>);
beforeEach(()=>{
 vi.clearAllMocks();library.user={uid:'alice'};friends.accepted=[];friends.incoming=[];friends.outgoing=[];state.documentError='';state.friendGame=null;state.post=post;
 state.publicProfile={displayName:'Bob',photoData:'',bio:'RPGs e aventuras.',libraryVisibility:'friends'};
 state.content={ready:true,error:'',games:[],posts:[post],options:DEFAULT_OPTIONS};
 state.chat={ready:true,error:'',busy:false,messages:[],send:vi.fn(async()=>{})};
});
it('abre review pública sem login, mostra nota, horas, status e navega para o perfil do autor',async()=>{
 library.user=null;const user=userEvent.setup();page('/reviews/bob/hades');
 expect(screen.getByRole('heading',{name:'Hades.'})).toBeTruthy();expect(screen.getByText('42,5 h')).toBeTruthy();expect(screen.getByText('Platinado')).toBeTruthy();expect(screen.getByText(post.text)).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'Compartilhar'}));expect(screen.getByLabelText('Link da review').value).toContain('#/reviews/bob/hades');
 await user.click(screen.getByRole('button',{name:'Fechar',exact:true}));await user.click(screen.getByRole('link',{name:'Review de Bob'}));
 expect(screen.getByRole('heading',{name:'Bob.'})).toBeTruthy();expect(screen.getByText('RPGs e aventuras.')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Entrar para adicionar amigo'})).toBeTruthy();
});
it('perfil restrito mostra reviews públicas e envia pedido ao autor, sem abrir biblioteca',async()=>{
 const user=userEvent.setup();page('/perfil/bob');expect(screen.getByText('Biblioteca compartilhada com amigos.')).toBeTruthy();expect(screen.queryByText('private@example.com')).toBeNull();
 await user.click(screen.getByRole('button',{name:'Adicionar amigo'}));expect(friends.sendRequest).toHaveBeenCalledWith('bob');
 await user.click(screen.getByRole('tab',{name:'Reviews'}));expect(screen.getByText(post.text)).toBeTruthy();expect(screen.getByRole('link',{name:'Hades'}).getAttribute('href')).toBe('/reviews/bob/hades');
});
it('perfil público exibe biblioteca e horas sem expor texto privado',()=>{
 state.publicProfile.libraryVisibility='public';state.content.games=[{id:'hades',title:'Hades',coverUrl:'',genre:'Roguelike',status:'platinum',rating:4.5,hoursPlayed:42.5,review:''}];page('/perfil/bob');
 expect(screen.getByRole('heading',{name:'Hades'})).toBeTruthy();expect(screen.getByText('42,5 h de jogo')).toBeTruthy();expect(screen.queryByText(post.text)).toBeNull();
});
it('amigo não consegue abrir review privada e pode entrar no perfil para conversar',()=>{
 friends.accepted=[friendship];state.post=null;state.friendGame={id:'hades',title:'Hades',review:'',rating:4.5,status:'platinum',genre:'Roguelike',updatedAt:200};page('/reviews/bob/hades');
 expect(screen.getByRole('heading',{name:'Review indisponível.'})).toBeTruthy();expect(screen.queryByText(post.text)).toBeNull();
});
it('chat envia texto, mostra mensagens e oferece perfil, mas bloqueia rota sem amizade',async()=>{
 friends.accepted=[friendship];state.chat.messages=[{id:'m1',senderId:'bob',text:'Vamos jogar?',createdAt:200}];const user=userEvent.setup();page('/conversas?com=bob');
 expect(screen.getByText('Vamos jogar?')).toBeTruthy();expect(screen.getByRole('link',{name:'Bob'}).getAttribute('href')).toBe('/perfil/bob');
 await user.type(screen.getByLabelText('Sua mensagem'),'Bora!');await user.click(screen.getByRole('button',{name:'Enviar'}));expect(state.chat.send).toHaveBeenCalledWith('Bora!');expect(screen.getByLabelText('Sua mensagem').value).toBe('');
});
it('não abre chat só por conhecer o UID de outro jogador',()=>{
 page('/conversas?com=bob');expect(screen.getByText('O chat exige uma amizade aceita entre vocês.')).toBeTruthy();expect(screen.queryByLabelText('Sua mensagem')).toBeNull();
});
