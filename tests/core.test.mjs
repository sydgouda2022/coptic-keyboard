import test from 'node:test';
import assert from 'node:assert/strict';
import {COPTIC_KEYS,PREDICTION_API_VERSION,keyboardKey,keyboardReady,
 isInsertableSurface,prepareKeyboardIndex,predictKeyboard,createCopticKeyboard
} from '../src/core.mjs';
const pack={rows:[['ⲡⲉ',1],['ⲡⲓ',2],['ⲡⲱ',3],['ⲡⲕ',0],
 ['*ⲡⲉ',1],['ⲡⲉ ⲛⲉ',1],['ⲡⲉ̄',1]],popularity:{'ⲡⲉ':20,'ⲡⲓ':10}};
const idx=prepareKeyboardIndex('cop',pack);
test('headless Coptic-only alphabet and public runtime',()=>{
 assert.equal(COPTIC_KEYS.length,32);
 assert.equal(new Set(COPTIC_KEYS).size,32);
 assert.equal(PREDICTION_API_VERSION,2);
 assert.throws(()=>keyboardKey('𓄿','egy'),RangeError);
 assert.throws(()=>prepareKeyboardIndex('egy',pack),RangeError);
 assert.equal(keyboardKey('ⲡⲉ̄'),keyboardKey('ⲡⲉ'));
 assert.equal(keyboardReady('ⲡⲉ'),true);
});
test('explicit editorial and phrase rules never mutate inserted text',()=>{
 assert.equal(isInsertableSurface('*ⲡⲉ'),false);
 assert.equal(isInsertableSurface('ⲡⲉ ⲛⲉ'),false);
 assert.equal(isInsertableSurface('ⲡⲉ ⲛⲉ',{includePhrases:true}),true);
 assert.equal(isInsertableSurface('ⲁ\u0000',{includeEditorial:true}),false);
 const ordinary=predictKeyboard(idx,'ⲡ',{limit:15});
 assert(!ordinary.some(x=>x.text==='*ⲡⲉ'||x.text==='ⲡⲉ ⲛⲉ'));
 const source=predictKeyboard(idx,'*',{limit:10,includeEditorial:true});
 assert(source.some(x=>x.text==='*ⲡⲉ'));
 assert(predictKeyboard(idx,'ⲡ',{limit:15,includePhrases:true}).some(x=>x.text==='ⲡⲉ ⲛⲉ'));
});
test('dialect is source membership, not fabricated from personal learning',()=>{
 assert(!predictKeyboard(idx,'ⲡ',{limit:10,dialect:'sahidic'}).some(x=>x.text==='ⲡⲓ'));
 assert(!predictKeyboard(idx,'ⲡ',{limit:10,dialect:'bohairic'}).some(x=>x.text==='ⲡⲉ'));
 assert(predictKeyboard(idx,'ⲡ',{limit:10,dialect:'all'}).some(x=>x.text==='ⲡⲕ'));
 const personally=predictKeyboard(idx,'ⲡ',{limit:10,dialect:'sahidic',learned:{'cop:ⲡⲫ':20}});
 const p=personally.find(x=>x.text==='ⲡⲫ');
 assert(p&&p.personal&&p.attested===false&&p.lexicon_ref===null);
 assert.throws(()=>predictKeyboard(idx,'ⲡ',{dialect:'egy'}),RangeError);
});
test('verbatim raw choice and ranked prefix search are deterministic',()=>{
 assert.deepEqual(predictKeyboard(idx,'ⲡ',{limit:1}).map(x=>x.text),['ⲡ']);
 assert.equal(predictKeyboard(idx,'ⲡ',{limit:7})[1].text,'ⲡⲉ');
 assert.equal(predictKeyboard(idx,'ⲡⲉ')[0].inLexicon,true);
 assert.equal(predictKeyboard(idx,'ⲡⲫ')[0].attested,false);
 assert.equal(predictKeyboard(idx,'ⲡ',{learned:{'cop:ⲡⲓ':50}})[1].text,'ⲡⲓ');
 const engine=createCopticKeyboard(pack,{dialect:'bohairic'});
 assert.equal(engine.suggest('ⲡ')[0].text,'ⲡ');
 assert(!engine.suggest('ⲡ').some(x=>x.text==='ⲡⲉ'));
});
test('malformed inventories and bounds fail closed',()=>{
 assert.throws(()=>prepareKeyboardIndex('cop',{rows:[['ⲡ',4]]}),TypeError);
 assert.throws(()=>prepareKeyboardIndex('cop',{rows:[['ⲡ',1],['ⲡ',2]]}),TypeError);
 assert.throws(()=>prepareKeyboardIndex('cop',{rows:[['latin',1]]}),TypeError);
 assert.throws(()=>predictKeyboard(idx,'ⲡ',{limit:0}),RangeError);
 assert.throws(()=>createCopticKeyboard(pack,{limit:99}),RangeError);
 assert.deepEqual(predictKeyboard(prepareKeyboardIndex('cop',{rows:[]}),'ⲡ').map(x=>x.text),['ⲡ']);
});
test('large lexicon preparation does not require UI or browser facilities',()=>{
 const words=Array.from({length:25000},(_,i)=>['ⲡ'+String(i).padStart(5,'0'),1]);
 words.push(['ⲁⲛ',1],['ⲁⲩⲱ',2]);
 const index=prepareKeyboardIndex('cop',{rows:words});
 assert.deepEqual(predictKeyboard(index,'ⲁ',{limit:4}).map(x=>x.text),['ⲁ','ⲁⲛ','ⲁⲩⲱ']);
});
