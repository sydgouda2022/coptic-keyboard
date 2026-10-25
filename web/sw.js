/* Pinned offline Coptic PWA shell. Browser installer checks SHA-256 of
 * the catalog before using the cache as lexicon authority. */
const VERSION='coptic-keyboard-v1';
const ASSETS=['./','./index.html','./styles.css','./app.mjs','./icon.svg',
 './ABOUT.md','./manifest.webmanifest','./editor.mjs','./keyboard-search.mjs',
 './_generic_search.mjs','./coptic-install.mjs','./coptic-lexicon/manifest.json',
 './coptic-lexicon/lexicon.json','./coptic-lexicon/coverage.json'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const c=await caches.open(VERSION);await c.addAll(ASSETS);await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(n=>n.startsWith('coptic-keyboard-')&&n!==VERSION).map(n=>caches.delete(n)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{
  const cache=await caches.open(VERSION),copy=await cache.match(e.request,{ignoreSearch:true});
  if(copy)return copy;
  try{return await fetch(e.request);}catch(error){
   if(e.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();
   throw error;
  }
 })());
});
