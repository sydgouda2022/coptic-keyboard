import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {validateCatalog,validateManifest,verifyReleaseBytes} from '../src/lexicon.mjs';
import * as api from '../src/index.mjs';
import * as compatibility from '../src/keyboard_search.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const bytes=readFileSync(new URL('../release/lexicon.json',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('../release/manifest.json',import.meta.url)));
test('canonical release hashes and rows verify without browser storage',async()=>{
 const data=await verifyReleaseBytes(manifest,bytes);
 assert.equal(data.rows.length,20652);
 assert.equal(validateCatalog(data).metadata.complete,false);
 assert.equal(validateManifest(manifest).language,'cop');
 assert.equal(api.createCopticKeyboard(data).suggest('ⲡ')[0].text,'ⲡ');
});
test('damaged bytes and misleading release metadata fail closed',async()=>{
 const damaged=Buffer.from(bytes);damaged[5]^=1;
 await assert.rejects(verifyReleaseBytes(manifest,damaged),/SHA-256 mismatch/);
 assert.throws(()=>validateManifest({...manifest,sha256:'x'}),TypeError);
 assert.throws(()=>validateCatalog({...JSON.parse(bytes),rows:[['latin',1]]}),TypeError);
});
test('public entry and historic adapter delegate to the same core',()=>{
 const data=JSON.parse(bytes);
 const idx=api.prepareKeyboardIndex('cop',data);
 const old=compatibility.prepareKeyboardIndex('cop',data);
 assert.deepEqual(api.predictKeyboard(idx,'ⲛ',{limit:6}),compatibility.predictKeyboard(old,'ⲛ',{limit:6}));
 assert.equal(typeof api.mountCopticKeyboard,'undefined');
 assert.equal(typeof api.ensureCopticLexicon,'undefined');
 assert.equal(typeof api.applyKey,'function');
});
