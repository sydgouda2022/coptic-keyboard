import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {ensureCopticLexiconImpl,validateCatalog,validateManifest,validateSlot} from '../src/coptic_install.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const payload={format:'coptic-predict-v1',language:'cop',dialects:['Sahidic','Bohairic'],
 rows:[['ⲁⲛ',1],['ⲁⲩⲱ',2],['ⲡⲉ',3],['ⲣⲱ',0]],popularity:{'ⲡⲉ':14},
 metadata:{spelling_records:4,complete:false}};
const encoded=new TextEncoder().encode(JSON.stringify(payload));
const raw=encoded.buffer.slice(encoded.byteOffset,encoded.byteOffset+encoded.byteLength);
const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),n=>n.toString(16).padStart(2,'0')).join('');
const manifest={format:'coptic-lexicon-install-v1',language:'cop',dialects:['Sahidic','Bohairic'],release:'coptic-test',bytes:raw.byteLength,sha256:sha,spelling_records:4,complete:false};
const valid={manifest,bytes:raw};
function store(active=null,previous=null){return {state:{active,previous},
 async read(){return this.state},
 async activate(next,prior){this.state={active:structuredClone(next),previous:prior&&structuredClone(prior)}},
 async restore(previous){this.state={active:structuredClone(previous),previous:null}}};}
const fetcher=(m=manifest,body=raw,fail=false)=>async url=>{
 if(fail)throw Error('offline');
 return url.includes('manifest')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>body};
};
test('validates dialects and native script without guessing',()=>{
 assert.equal(validateCatalog(payload).rows.length,4);
 assert.equal(validateManifest(manifest).language,'cop');
 assert.throws(()=>validateCatalog({...payload,rows:[...payload.rows,['ⲡⲉ',1]]}),/duplicate/);
 assert.throws(()=>validateCatalog({...payload,rows:[['english',1],...payload.rows.slice(1)]}),/Coptic/);
 assert.throws(()=>validateManifest({...manifest,language:'egy'}),/manifest/);
});
test('installs missing Coptic pack and stores it separately',async()=>{
 const s=store(),installed=await ensureCopticLexiconImpl({store:s,fetcher:fetcher()});
 assert.equal(installed.payload.rows.length,4);assert.ok(await validateSlot(s.state.active));
});
test('starts offline using valid Coptic release',async()=>{
 const installed=await ensureCopticLexiconImpl({store:store(valid),online:false,fetcher:fetcher(null,null,true)});
 assert.equal(installed.manifest.sha256,sha);
});
test('repairs corrupted active release from downloaded copy',async()=>{
 const damage=raw.slice(0);new Uint8Array(damage)[1]^=8;
 const s=store({...valid,bytes:damage});await ensureCopticLexiconImpl({store:s,fetcher:fetcher()});
 assert.ok(await validateSlot(s.state.active));
});
test('restores previous Coptic release offline and retains appointments',async()=>{
 const damage=raw.slice(0);new Uint8Array(damage)[1]^=9;
 const s=store({...valid,bytes:damage},valid);
 const result=await ensureCopticLexiconImpl({store:s,online:false,fetcher:fetcher(null,null,true)});
 assert.equal(result.status,'recovered');
 assert.ok(await validateSlot(s.state.active));
});
test('failed Coptic update keeps last valid version',async()=>{
 const next={...manifest,sha256:'f'.repeat(64),release:'new'};
 const s=store(valid);
 const installed=await ensureCopticLexiconImpl({store:s,fetcher:fetcher(next,null,true)});
 assert.equal(installed.manifest.sha256,sha);
 assert.ok(await validateSlot(s.state.active));
});
test('missing copy restores from PWA precache even offline',async()=>{
 const s=store();await ensureCopticLexiconImpl({store:s,online:false,fetcher:fetcher()});
 assert.ok(await validateSlot(s.state.active));
});
test('missing copy and unavailable cache is a recoverable setup error',async()=>{
 await assert.rejects(ensureCopticLexiconImpl({store:store(),online:false,fetcher:fetcher(null,null,true)}),/no verified local copy/);
});
test('tampered or truncated Coptic download fails closed',async()=>{
 const broken=raw.slice(0,raw.byteLength-5);
 await assert.rejects(ensureCopticLexiconImpl({store:store(),fetcher:fetcher(manifest,broken)}),/checksum mismatch/);
});
test('wrong Coptic catalog cannot be accepted with a fake matching hash',async()=>{
 assert.equal(await validateSlot({...valid,manifest:{...manifest,language:'egy'}}),null);
});

test('blocked IndexedDB falls back to verified but explicitly volatile release',async()=>{
 const broken={async read(){throw Error('storage blocked')},
   async activate(){throw Error('storage blocked')}};
 const result=await ensureCopticLexiconImpl({store:broken,fetcher:fetcher()});
 assert.equal(result.status,'volatile');
 assert.match(result.storageError,/storage blocked/);
 assert.equal(result.payload.rows.length,4);
});
test('browser body timeout covers payload consumption, not merely response headers',async()=>{
 const blockedFetch=async(url,{signal})=>{
  if(url.includes('manifest'))return {ok:true,json:async()=>manifest};
  return {ok:true,arrayBuffer:()=>new Promise((resolve,reject)=>{
   if(signal.aborted)reject(Error('aborted'));
   else signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
  })};
 };
 await assert.rejects(ensureCopticLexiconImpl({store:store(),fetcher:blockedFetch,
   timeoutMs:25}),/download\/repair failed/);
});
test('stale verified release records failed update details without losing the active copy',async()=>{
 const s=store(valid);
 const bad={...manifest,sha256:'e'.repeat(64),release:'newer'};
 const result=await ensureCopticLexiconImpl({store:s,fetcher:fetcher(bad,raw)});
 assert.equal(result.status,'offline');
 assert.match(result.updateError,/checksum mismatch/);
 assert.equal(result.manifest.sha256,sha);
});
test('installer rejects malformed optional master fingerprint',()=>{
 assert.throws(()=>validateManifest({...manifest,sqlite_sha256:'000'}),/manifest/);
});
