import test from 'node:test';
import assert from 'node:assert/strict';
import {keyboardKey,keyboardReady,prepareKeyboardIndex,predictKeyboard} from '../src/keyboard_search.mjs';
const data={rows:[['ⲡⲉ',1],['ⲡⲓ',2],['ⲡⲱ',3],['ⲡⲕ',0],['ⲡⲉ̄',1],['*(ⲡⲉ)',1],['ⲡⲉ ⲛⲁ',3]],popularity:{'ⲡⲉ':10,'ⲡⲓ':15}};
const idx=prepareKeyboardIndex('cop',data);
test('Coptic-only public library, including proper raw input',()=>{
 assert.throws(()=>keyboardKey('a','egy'),RangeError);
 assert.throws(()=>prepareKeyboardIndex('egy',data),RangeError);
 assert.deepEqual(predictKeyboard(idx,'ⲡ',{limit:1}).map(x=>x.text),['ⲡ']);
 assert.equal(predictKeyboard(idx,'ⲡⲉ',{dialect:'bohairic'})[0].attested,false);
});
test('Unicode marks fold only for lookup, original insertion stays intact',()=>{
 assert.equal(keyboardKey('ⲡⲉ̄'),keyboardKey('ⲡⲉ'));
 assert(predictKeyboard(idx,'ⲡ',{limit:10}).some(x=>x.text==='ⲡⲉ̄'));
});
test('Dialect membership and unknown remain distinct',()=>{
 const s=predictKeyboard(idx,'ⲡ',{dialect:'sahidic',limit:10});
 const b=predictKeyboard(idx,'ⲡ',{dialect:'bohairic',limit:10});
 assert(s.some(x=>x.text==='ⲡⲉ')&&!s.some(x=>x.text==='ⲡⲓ'||x.text==='ⲡⲕ'));
 assert(b.some(x=>x.text==='ⲡⲓ')&&!b.some(x=>x.text==='ⲡⲉ'||x.text==='ⲡⲕ'));
 assert(predictKeyboard(idx,'ⲡ',{dialect:'all',limit:10}).some(x=>x.text==='ⲡⲕ'));
});
test('Glossary editorial notation cannot become keyboard input',()=>{
 assert.equal(keyboardReady('(ⲁ)ⲁⲥ'),false);
 assert.equal(keyboardReady('*ⲡⲉ'),false);
 assert.equal(keyboardReady('ⲡⲉ ⲛⲁ'),false);
 assert.equal(keyboardReady('ⲡⲉ'),true);
 const r=predictKeyboard(idx,'ⲡ',{limit:20});
 assert(!r.some(x=>x.text.includes('(')||x.text.includes(' ')));
});
test('Personal unknown spelling never gains source attestation or false dialect',()=>{
 const learning={'cop:ⲡⲁϫ':9};
 const all=predictKeyboard(idx,'ⲡ',{limit:10,learned:learning,dialect:'all'});
 const own=all.find(x=>x.text==='ⲡⲁϫ');
 assert(own&&own.personal&&!own.attested&&own.lexicalIdentityVerified===false);
 assert(!predictKeyboard(idx,'ⲡ',{limit:10,learned:learning,dialect:'sahidic'}).some(x=>x.text==='ⲡⲁϫ'));
});
test('Prefix search sorts 25,000 forms and respects limit',()=>{
 const big=prepareKeyboardIndex('cop',{rows:Array.from({length:25000},(_,i)=>['ⲡ'+String(i).padStart(5,'0'),1]).concat([['ⲁⲛ',1]])});
 assert.deepEqual(predictKeyboard(big,'ⲁ',{limit:3}).map(x=>x.text),['ⲁ','ⲁⲛ']);
 assert.throws(()=>predictKeyboard(big,'ⲡ',{limit:81}),RangeError);
 assert.throws(()=>predictKeyboard(big,'ⲡ',{dialect:'wrong'}),RangeError);
});
