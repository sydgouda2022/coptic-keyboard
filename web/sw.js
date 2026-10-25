/* Standalone PWA: app shell plus exact, verified Coptic catalog. The installer
 * verifies SHA-256 again before treating the cache as authoritative. */
const VERSION='coptic-keyboard-v1';
const ASSETS=['./','./index.html','./styles.css','./app.mjs','./icon.svg','./manifest.webmanifest',
 './ABOUT.md','./editor.mjs','./keyboard-search.mjs','./_generic_search.mjs','./coptic-install.mjs',
 './coptic-lexicon/manifest.json','./coptic-lexicon/lexicon.json','./coptic-lexicon/coverage.json'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(VERSION);
 await cache.addAll(ASSETS);
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name.startsWith('coptic-keyboard-')&&name!==VERSION).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  const cached=await cache.match(event.request,{ignoreSearch:true});
  // Immutable by app version; updates are orchestrated by the next SW version.
  if(cached)return cached;
  try{return await fetch(event.request);}catch(e){
   if(event.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();
   throw e;
  }
 })());
});
