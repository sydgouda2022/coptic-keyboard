import test from 'node:test';
import assert from 'node:assert/strict';
import {COPTIC_KEYS,prepareKeyboardIndex,preparePersonalIndex,
 predictKeyboard,createCopticKeyboard} from '../src/index.mjs';

const pack={rows:[['ⲡⲉ',1],['ⲡⲓ',2],['ⲡⲱ',3],['ⲡⲕ',0]],popularity:{'ⲡⲓ':2}};
const prepared=prepareKeyboardIndex('cop',pack);
test('a known Bohairic word is never relabeled PERSONAL in Sahidic mode',()=>{
 const learned={'cop:ⲡⲓ':1000,'cop:ⲡⲫ':8};
 const candidate=predictKeyboard(prepared,'ⲡ',{learned,limit:20,dialect:'sahidic'});
 assert.equal(candidate.some(c=>c.text==='ⲡⲓ'),false);
 assert.equal(candidate.find(c=>c.text==='ⲡⲉ').personal,false);
 assert.equal(candidate.find(c=>c.text==='ⲡⲫ').personal,true);
 const broad=predictKeyboard(prepared,'ⲡ',{learned,limit:20});
 const source=broad.find(c=>c.text==='ⲡⲓ');
 assert.ok(source?.inLexicon&&!source.personal);
 assert.equal(source.dialects,2);
 const compiled=preparePersonalIndex(learned);
 const accelerated=predictKeyboard(prepared,'ⲡ',{personalIndex:compiled,limit:20,dialect:'sahidic'});
 assert.equal(accelerated.some(c=>c.text==='ⲡⲓ'),false);
 assert.equal(accelerated.find(c=>c.text==='ⲡⲫ').personal,true);
});
test('Unicode canonical equivalents do not reclassify source-listed words',()=>{
 const index=prepareKeyboardIndex('cop',{rows:[['ⲁ\u0305',2]]});
 for(const options of [
  {learned:{['cop:'+('ⲁ\u0305').normalize('NFC')]:10}},
  {personalIndex:preparePersonalIndex({['cop:'+('ⲁ\u0305').normalize('NFC')]:10})}
 ]){
  const suggestions=predictKeyboard(index,'ⲁ',{...options,dialect:'sahidic'});
  assert.equal(suggestions.some(c=>c.personal),false);
 }
});
test('prepared personal index is immutable and changes only after explicit rebuild',()=>{
 const learned={'cop:ⲡⲫ':5};
 const old=preparePersonalIndex(learned);
 assert.ok(Object.isFrozen(old));
 assert.equal(old.size,1);
 learned['cop:ⲡϣ']=10;
 assert.equal(predictKeyboard(prepared,'ⲡ',{personalIndex:old,limit:20})
  .some(c=>c.text==='ⲡϣ'),false);
 const next=preparePersonalIndex(learned);
 assert.equal(next.size,2);
 assert.equal(predictKeyboard(prepared,'ⲡ',{personalIndex:next,limit:20})
  .some(c=>c.text==='ⲡϣ'),true);
 assert.throws(()=>predictKeyboard(prepared,'ⲡ',{personalIndex:{language:'cop',size:0}}),TypeError);
});
test('large indexed learning history yields the same results as the legacy usage map',()=>{
 const letter=COPTIC_KEYS;
 const learned={'cop:ⲡⲓ':20,'cop:ⲡⲫ':8,'ctx:cop:ⲁ:ⲡⲫ':9};
 for(let i=0;i<16000;i++){
  let n=i,word='ⲡ';
  for(let j=0;j<4;j++){word+=letter[n%32];n=Math.floor(n/32);}
  learned['cop:'+word]=1+(i%15);
 }
 const personal=preparePersonalIndex(learned);
 assert.ok(personal.size>=16000);
 const engine=createCopticKeyboard(pack,{limit:15});
 for(const prefix of ['ⲡ','ⲡⲁ','ⲡⲉ','ⲡⲫ','ⲡⲃ','ⲡⲓ']){
  const opts={learned,limit:15,previous:'ⲁ'};
  const legacy=engine.suggest(prefix,opts);
  const indexed=engine.suggest(prefix,{personalIndex:personal,limit:15,previous:'ⲁ'});
  assert.deepEqual(indexed,legacy,'Personal prefix parity for '+prefix);
 }
});
