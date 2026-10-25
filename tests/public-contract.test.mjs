import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as full from '../src/index.mjs';
import * as predict from '../src/core.mjs';
import * as editing from '../src/editor.mjs';
import * as lexicon from '../src/lexicon.mjs';
import * as legacy from '../src/keyboard_search.mjs';

const packageJSON=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('../release/manifest.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../release/lexicon.json',import.meta.url),'utf8'));

test('freeze API v2 entry points: additions/removals require deliberate contract review',()=>{
 assert.equal(packageJSON.version,'2.0.0');
 assert.equal(full.PREDICTION_API_VERSION,2);
 assert.deepEqual(Object.keys(full).sort(),[
  'COPTIC_KEYS','LANGUAGE','PREDICTION_API_VERSION','applyKey',
  'backspaceRange','createCopticKeyboard','isInsertableSurface',
  'keyboardKey','keyboardReady','predictKeyboard','prepareKeyboardIndex',
  'replaceRange','validateCatalog','validateManifest','verifyReleaseBytes',
  'wordBeforeCaret'
 ].sort());
 assert.deepEqual(Object.keys(predict).sort(),[
  'COPTIC_KEYS','LANGUAGE','PREDICTION_API_VERSION',
  'createCopticKeyboard','isInsertableSurface','keyboardKey',
  'keyboardReady','predictKeyboard','prepareKeyboardIndex'
 ].sort());
 assert.deepEqual(Object.keys(editing).sort(),[
  'applyKey','backspaceRange','replaceRange','wordBeforeCaret'
 ]);
 assert.deepEqual(Object.keys(lexicon).sort(),[
  'validateCatalog','validateManifest','verifyReleaseBytes'
 ]);
 assert.strictEqual(legacy.predictKeyboard,full.predictKeyboard);
 assert.strictEqual(legacy.prepareKeyboardIndex,full.prepareKeyboardIndex);
 assert.equal(packageJSON.sideEffects,false);
 assert.equal(packageJSON.private,true);
 assert.equal(Object.keys(packageJSON.exports).length,6);
 for(const entry of ['.','./prediction','./editing','./lexicon'])
  assert.equal(typeof packageJSON.exports[entry].types,'string');
});
test('frozen v2 raw/candidate shape and source evidence labels',()=>{
 const index=full.prepareKeyboardIndex('cop',{rows:[
  ['ⲡⲉ',1],['ⲡⲓ',2],['ⲡⲱ',3]],popularity:{'ⲡⲉ':20}});
 const raw=full.predictKeyboard(index,'ⲡ',{limit:4})[0];
 assert.deepEqual(raw,{text:'ⲡ',raw:true,personal:false,attested:false,
  inLexicon:false,lexicalIdentityVerified:false,lexicon_ref:null});
 const entries=full.predictKeyboard(index,'ⲡ',{limit:4}).slice(1);
 assert.equal(entries.length,3);
 assert.deepEqual(Object.keys(entries[0]).sort(),[
  'attested','dialects','frequency','inLexicon',
  'lemma','lexicalIdentityVerified','lexicon_ref','personal',
  'raw','record_key','source','text'
 ].sort());
 assert.ok(entries.every(e=>e.source==='COMPILED-COPTIC' &&
  e.lexicalIdentityVerified===false && e.lexicon_ref===null));
 assert.equal(full.predictKeyboard(index,'ⲡⲉ')[0].attested,true);
 const learned=full.predictKeyboard(index,'ⲡ',{limit:8,
  learned:{'cop:ⲡⲫ':11}}).find(e=>e.text==='ⲡⲫ');
 assert.ok(learned?.personal);
 assert.equal(learned.attested,false);
 assert.equal(learned.lexicon_ref,null);
});
test('freeze SHA-256 identity of v2 canonical runtime release, not moving main',()=>{
 assert.equal(manifest.sha256,
  'a2d96bba65d01081750f9539b8c7a26c94ba93665f3f9a14f7b2fb517f476799');
 assert.equal(manifest.sqlite_sha256,
  'b1fca9f2b4258d45e332ee057cd3356246185743976703c11e9b3acdcf0e93de');
 assert.equal(manifest.spelling_records,20652);
 assert.equal(catalog.rows.length,20652);
 assert.equal(full.validateCatalog(catalog),catalog);
 assert.equal(full.validateManifest(manifest),manifest);
});
