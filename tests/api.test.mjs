import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/index.mjs';
import {readFileSync} from 'node:fs';
test('public package exposes one Coptic-only prediction and widget contract',()=>{
 for(const property of [
   'keyboardKey','prepareKeyboardIndex','predictKeyboard','mountCopticKeyboard',
   'ensureCopticLexicon','validateCatalog','validateManifest','isInsertableSurface'
 ]) assert.equal(typeof api[property],'function',property);
 assert.equal(api.LANGUAGE,'cop');
 assert.equal(api.PREDICTION_API_VERSION,1);
 assert.equal(api.COPTIC_KEYS.length,32);
 assert.equal(new Set(api.COPTIC_KEYS).size,32);
 assert.throws(()=>api.keyboardKey('𓄿','egy'),RangeError);
});
test('bundled release is correctly indexed, filtered and visually insertable',()=>{
 const pack=JSON.parse(readFileSync(new URL('../release/lexicon.json',import.meta.url),'utf8'));
 const manifest=JSON.parse(readFileSync(new URL('../release/manifest.json',import.meta.url),'utf8'));
 assert.equal(api.validateCatalog(pack).rows.length,manifest.spelling_records);
 assert.equal(api.validateManifest(manifest).language,'cop');
 const index=api.prepareKeyboardIndex('cop',pack);
 assert.equal(index.rows.length,20652);
 for(const [prefix,dialect] of [['ⲡ','sahidic'],['ⲫ','bohairic']]){
  const candidates=api.predictKeyboard(index,prefix,{dialect,limit:8});
  assert.ok(candidates.length>1);
  assert.ok(candidates.slice(1).every(x=>api.isInsertableSurface(x.text)));
 }
});
