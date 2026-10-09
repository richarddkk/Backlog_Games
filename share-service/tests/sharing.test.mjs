import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { allowedCover, cardSvg, fetchCover, renderCard } from '../lib/card.mjs';
import { decodeReview, loadReview, parseIds, targetUrl } from '../lib/reviews.mjs';
import { renderHtml } from '../lib/html.mjs';
import reviewHandler from '../api/review.mjs';
import cardHandler from '../api/card.mjs';
const env = { FIREBASE_PROJECT_ID:'demo-checkpoint', PUBLIC_APP_URL:'https://richarddkk.github.io/Backlog_Games/' };
const post = { actorId:'alice',actorName:'Richard',gameId:'hades',gameTitle:'Hades',text:'Combate excelente e uma trilha inesquecível.',rating:4.5,hoursPlayed:42.5,status:'platinum',statusLabel:'Platinado',coverUrl:'/covers/1145360.jpg',visibility:'public' };
const document = { fields:Object.fromEntries(Object.entries(post).map(([key,value]) => [key,typeof value === 'number' ? { doubleValue:value } : { stringValue:value }])) };
const response = () => ({ headers:{},statusCode:0,body:'',setHeader(name,value) { this.headers[name]=value; },end(body) { this.body=body || ''; } });
test('HTML inclui Open Graph sem JavaScript e abre a review no GitHub Pages', () => {
 const html=renderHtml(post,'https://share.example.com',env);
 assert.match(html,/property="og:image" content="https:\/\/share.example.com\/card\/alice\/hades.png"/);
 assert.match(html,/property="og:title" content="Hades · 4,5\/5/); assert.match(html,/42,5 h/); assert.match(html,/location.replace/);
 assert.equal(targetUrl(post,env),'https://richarddkk.github.io/Backlog_Games/#/reviews/alice/hades'); assert.doesNotMatch(html,/http-equiv="refresh"/);
});
test('escapa títulos e texto, sem permitir HTML executável na prévia', () => {
 const html=renderHtml({...post,gameTitle:'<script>alert(1)</script>',text:'"/><img onerror="evil()">',actorName:'<svg onload="x">'},'https://share.example.com',env);
 assert.doesNotMatch(html,/<script>alert|<svg onload|<img onerror/); assert.match(html,/&lt;script&gt;/);
 assert.throws(()=>targetUrl(post,{PUBLIC_APP_URL:'javascript:alert(1)'}));
});
test('valida IDs e só decodifica publicação pública correspondente ao autor e jogo', () => {
 assert.deepEqual(parseIds('/?u=alice&g=hades.png',true),{authorId:'alice',gameId:'hades'});
 assert.deepEqual(parseIds('/r/alice/hades'),{authorId:'alice',gameId:'hades'});
 assert.deepEqual(parseIds('/api/review',false,{u:'alice',g:'hades'}),{authorId:'alice',gameId:'hades'});
 assert.deepEqual(parseIds('/card/alice/hades.png',true),{authorId:'alice',gameId:'hades'});
 assert.throws(()=>parseIds('/?u=alice&g=../private')); assert.throws(()=>parseIds('/?u=local&g=hades'));
 assert.equal(decodeReview(document,'alice','hades').hoursPlayed,42.5);
 assert.throws(()=>decodeReview({fields:{...document.fields,visibility:{stringValue:'friends'}}},'alice','hades'));
 assert.throws(()=>decodeReview(document,'bob','hades'));
});
test('consulta só publicReviews sem token administrativo e trata remoção e falha', async () => {
 let requested;
 const value=await loadReview('alice','hades',{env,fetchImpl:async (...args)=>{requested=args;return new Response(JSON.stringify(document));}});
 assert.equal(value.gameTitle,'Hades'); assert.match(requested[0],/documents\/publicReviews\/alice~hades$/); assert.equal(requested[1].headers,undefined);
 await assert.rejects(loadReview('alice','hades',{env,fetchImpl:async()=>new Response('',{status:404})}),error=>error.status===404);
 await assert.rejects(loadReview('alice','hades',{env,fetchImpl:async()=>new Response('',{status:503})}),error=>error.status===503);
});
test('restringe capas ao catálogo ou domínio permitido e bloqueia rede privada e redirects',async()=>{
 assert.equal(allowedCover(post.coverUrl,env).href,'https://richarddkk.github.io/Backlog_Games/covers/1145360.jpg');
 for(const url of ['http://example.com/x.jpg','https://127.0.0.1/x.jpg','https://evil.example/x.jpg','https://richarddkk.github.io/other.jpg','https://richarddkk.github.io/Backlog_Games/covers/../other.jpg']) assert.equal(allowedCover(url,env),null);
 assert.equal(allowedCover('https://cdn.example.com/x.jpg',{...env,PREVIEW_IMAGE_HOSTS:'cdn.example.com'}).hostname,'cdn.example.com');
 let fetched=false; const denied=await fetchCover(post.coverUrl,{env,lookupImpl:async()=>[{address:'127.0.0.1'}],fetchImpl:async()=>{fetched=true;}});
 assert.equal(denied,null); assert.equal(fetched,false);
 assert.equal(await fetchCover(post.coverUrl,{env,lookupImpl:async()=>[{address:'185.199.108.153'}],fetchImpl:async(_,options)=>{assert.equal(options.redirect,'error');return new Response('bad',{headers:{'content-type':'text/html'}});}}),null);
});
test('gera PNG 1200×630 com meia estrela, acentos e capa, sem fontes externas',async()=>{
 const cover=await sharp({create:{width:300,height:450,channels:3,background:'#ab183c'}}).png().toBuffer();
 const png=await renderCard({...post,gameTitle:'Uma aventura extraordinária com um título muito longo em português',actorName:'João de Alcântara'},cover);
 const metadata=await sharp(png).metadata(); assert.equal(metadata.width,1200);assert.equal(metadata.height,630);assert.equal(metadata.format,'png');
 assert.match(cardSvg(post),/clip-path="url\(#s4\)"/); assert.ok(png.length>10000);
});
test('respostas removidas não contêm metadados antigos e não são cacheadas',async()=>{
 const originalFetch=globalThis.fetch,oldEnv={...process.env};Object.assign(process.env,env);globalThis.fetch=async()=>new Response('',{status:404});
 try { for(const handler of [reviewHandler,cardHandler]) { const res=response();await handler({url:'/?u=alice&g=hades',method:'GET',headers:{host:'share.example.com'}},res);assert.equal(res.statusCode,404);assert.equal(res.headers['Cache-Control'],'no-store');assert.doesNotMatch(res.body,/og:image|Hades|Richard/); }}
 finally {globalThis.fetch=originalFetch;process.env=oldEnv;}
});
test('endpoint entrega HTML e PNG e rejeita escrita',async()=>{
 const originalFetch=globalThis.fetch,oldEnv={...process.env};Object.assign(process.env,env);globalThis.fetch=async()=>new Response(JSON.stringify({fields:{...document.fields,coverUrl:{stringValue:''}}}));
 try {
 const html=response();await reviewHandler({url:'/?u=alice&g=hades',method:'GET',headers:{host:'share.example.com'}},html);assert.equal(html.statusCode,200);assert.match(html.body,/og:image/);
 const png=response();await cardHandler({url:'/?u=alice&g=hades.png',method:'GET',headers:{host:'share.example.com'}},png);assert.equal(png.statusCode,200);assert.equal(png.headers['Content-Type'],'image/png');
 const denied=response();await reviewHandler({url:'/?u=alice&g=hades',method:'POST',headers:{host:'share.example.com'}},denied);assert.equal(denied.statusCode,405);
 } finally {globalThis.fetch=originalFetch;process.env=oldEnv;}
});
