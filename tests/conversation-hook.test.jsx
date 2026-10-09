import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({listeners:[],writes:[],commit:vi.fn(async()=>{})}));
vi.mock('../src/lib/firebase.js',()=>({db:{},friendlyError:error=>error.message}));
vi.mock('firebase/firestore',()=>({
 collection:(_, ...path)=>path.join('/'),doc:(...args)=>typeof args[0]==='string'?`${args[0]}/generated`:args.slice(1).join('/'),
 query:(path,...filters)=>({path,filters}),orderBy:(...args)=>args,limit:value=>value,serverTimestamp:()=> 'server-time',
 onSnapshot:(query,receive,fail)=>{const listener={query,receive,fail,stop:vi.fn()};state.listeners.push(listener);return listener.stop;},
 writeBatch:()=>({set:(...args)=>state.writes.push(args),commit:state.commit})
}));
import useConversation from '../src/hooks/useConversation.js';
const snapshot=text=>({docs:[{id:'m1',data:()=>({senderId:'bob',text,createdAt:{toMillis:()=>200}}),metadata:{hasPendingWrites:false}}]});
beforeEach(()=>{state.listeners=[];state.writes=[];state.commit.mockReset().mockResolvedValue();});
it('salva participantes e mensagem atomicamente e usa o autor da sessão',async()=>{
 const page=renderHook(()=>useConversation('alice','bob'));
 act(()=>state.listeners[0].receive(snapshot('Oi')));expect(page.result.current.messages[0].text).toBe('Oi');
 await act(async()=>page.result.current.send('  Bora jogar!  '));
 expect(state.writes[0]).toEqual(['conversations/alice~bob',{participants:['alice','bob'],updatedAt:'server-time'}]);
 expect(state.writes[1][1]).toEqual({senderId:'alice',text:'Bora jogar!',createdAt:'server-time'});expect(state.commit).toHaveBeenCalledTimes(1);
});
it('limpa mensagens na troca de amigo e ignora snapshots atrasados da conversa anterior',()=>{
 const page=renderHook(({friend})=>useConversation('alice',friend),{initialProps:{friend:'bob'}});const old=state.listeners[0];
 act(()=>old.receive(snapshot('Mensagem de Bob')));page.rerender({friend:'charlie'});expect(page.result.current.messages).toEqual([]);expect(old.stop).toHaveBeenCalled();
 act(()=>old.receive(snapshot('Não deve aparecer')));expect(page.result.current.messages).toEqual([]);
});
it('revogação limpa mensagens e bloqueia envio, inclusive após perder amizade',async()=>{
 const page=renderHook(({friend})=>useConversation('alice',friend),{initialProps:{friend:'bob'}});
 act(()=>state.listeners[0].receive(snapshot('Privado')));act(()=>state.listeners[0].fail({message:'Sem permissão',code:'permission-denied'}));
 expect(page.result.current.messages).toEqual([]);await expect(page.result.current.send('Oi')).rejects.toThrow('Aguarde');
 page.rerender({friend:null});expect(page.result.current.messages).toEqual([]);expect(page.result.current.ready).toBe(true);await expect(page.result.current.send('Oi')).rejects.toThrow();
});
