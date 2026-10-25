import test from 'node:test';
import assert from 'node:assert/strict';
import {keyboardKey,keyboardReady,prepareKeyboardIndex,predictKeyboard} from '../src/keyboard_search.mjs';
const catalog={rows:[['ⲡⲉ',1],['ⲡⲓ',2],['ⲡⲱ',3],['ⲡⲕ',0],['ⲡⲉ̄',1],['*(ⲡⲉ)',1],['ⲡⲉ ⲛⲁ',3]],popularity:{'ⲡⲉ':10,'ⲡⲓ':15}};
const index=prepareKeyboardIndex('cop',catalog);
test('Coptic public API rejects Egyptian language and index',()=>{
 assert.throws(()=>keyboardKey('nfr','egy'),RangeError);
 assert.throws(()=>prepareKeyboardIndex('egy',catalog),RangeError);
 assert.throws(()=>predictKeyboard({language:'egy',rows:[]},'ⲡ'),RangeError);
});
test('Search key folds marks but preserves the original suggestion',()=>{
 assert.equal(keyboardKey('ⲡⲉ̄'),keyboardKey('ⲡⲉ'));
 assert(predictKeyboard(index,'ⲡ',{limit:15}).some(x=>x.text==='ⲡⲉ̄'));
});
test('Sahidic, Bohairic and unassigned are never guessed',()=>{
 const s=predictKeyboard(index,'ⲡ',{dialect:'sahidic',limit:15});
 const b=predictKeyboard(index,'ⲡ',{dialect:'bohairic',limit:15});
 assert(s.some(x=>x.text==='ⲡⲉ')&&!s.some(x=>x.text==='ⲡⲓ'||x.text==='ⲡⲕ'));
 assert(b.some(x=>x.text==='ⲡⲓ')&&!b.some(x=>x.text==='ⲡⲉ'||x.text==='ⲡⲕ'));
 assert(predictKeyboard(index,'ⲡ',{dialect:'all',limit:15}).some(x=>x.text==='ⲡⲕ'));
});
test('Editorial display notation and multiword dictionary phrases cannot be inserted as one word',()=>{
 assert(keyboardReady('ⲡⲉ')&&!keyboardReady('(ⲁ)ⲁⲥ')&&!keyboardReady('*ⲡⲉ')&&!keyboardReady('ⲡⲉ ⲛⲁ'));
 const results=predictKeyboard(index,'ⲡ',{limit:20});
 assert(!results.some(x=>x.text.includes('(')||x.text.includes(' ')));
});
test('Raw input is first and personal forms have no fabricated attestation',()=>{
 const r=predictKeyboard(index,'ⲡ',{limit:15,learned:{'cop:ⲡⲁϫ':10},dialect:'all'});
 assert.equal(r[0].text,'ⲡ');assert.equal(r[0].raw,true);
 const own=r.find(x=>x.text==='ⲡⲁϫ');
 assert(own?.personal&&!own.attested&&!own.lexicalIdentityVerified&&!own.lexicon_ref);
 assert(!predictKeyboard(index,'ⲡ',{limit:15,dialect:'sahidic',learned:{'cop:ⲡⲁϫ':10}}).some(x=>x.text==='ⲡⲁϫ'));
});
test('25000 indexed forms use prefix span and hard suggestion limit',()=>{
 const rows=Array.from({length:25000},(_,i)=>['ⲡ'+String(i).padStart(5,'0'),1]);
 const large=prepareKeyboardIndex('cop',{rows:rows.concat([['ⲁⲛ',1]])});
 assert.deepEqual(predictKeyboard(large,'ⲁ',{limit:3}).map(x=>x.text),['ⲁ','ⲁⲛ']);
 assert.throws(()=>predictKeyboard(large,'ⲡ',{limit:81}),RangeError);
 assert.throws(()=>predictKeyboard(large,'ⲡ',{dialect:'invalid'}),RangeError);
});
