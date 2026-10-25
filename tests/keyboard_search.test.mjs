import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  keyboardKey,prepareKeyboardIndex,predictKeyboard,isInsertableSurface
} from '../src/keyboard_search.mjs';

const base={rows:[
 ['ⲡⲉ',1],['ⲡⲓ',2],['ⲡⲱ',3],['ⲡⲕ',0],['ⲡⲉ̄',1],
 ['*ⲡⲉ',1],['ⲡⲉ ⲛⲉ',1]],popularity:{'ⲡⲉ':30,'ⲡⲓ':20}};
const index=prepareKeyboardIndex('cop',base);

test('stable Unicode lookup folds marks without ever changing insertion bytes',()=>{
 assert.equal(keyboardKey('ⲡⲉ̄'),keyboardKey('ⲡⲉ'));
 assert.equal(keyboardKey('ⲡⲉ̄','cop'),'ⲡⲉ');
 const result=predictKeyboard(index,'ⲡ',{limit:10});
 assert.ok(result.some(x=>x.text==='ⲡⲉ̄'));
 assert.equal(result[0].text,'ⲡ');
 assert.throws(()=>keyboardKey('ⲡ','egy'),RangeError);
});
test('source-listed editorial reconstruction and phrases require explicit opt-in',()=>{
 assert.equal(isInsertableSurface('ⲡⲉ'),true);
 assert.equal(isInsertableSurface('*ⲡⲉ'),false);
 assert.equal(isInsertableSurface('ⲡⲉ ⲛⲉ'),false);
 const plain=predictKeyboard(index,'ⲡ',{limit:12});
 assert.ok(!plain.some(x=>x.text==='ⲡⲉ ⲛⲉ'||x.text==='*ⲡⲉ'));
 const phrases=predictKeyboard(index,'ⲡ',{limit:12,includePhrases:true});
 assert.ok(phrases.some(x=>x.text==='ⲡⲉ ⲛⲉ'));
 const editorial=predictKeyboard(index,'*',{limit:12,includeEditorial:true});
 assert.ok(editorial.some(x=>x.text==='*ⲡⲉ'));
});
test('filter Sahidic, Bohairic and unknown dialects without inventing attribution',()=>{
 const s=predictKeyboard(index,'ⲡ',{limit:10,dialect:'sahidic'});
 assert.ok(s.some(x=>x.text==='ⲡⲉ')&&s.some(x=>x.text==='ⲡⲱ'));
 assert.ok(!s.some(x=>x.text==='ⲡⲓ'||x.text==='ⲡⲕ'));
 const b=predictKeyboard(index,'ⲡ',{limit:10,dialect:'bohairic'});
 assert.ok(b.some(x=>x.text==='ⲡⲓ')&&b.some(x=>x.text==='ⲡⲱ'));
 assert.ok(!b.some(x=>x.text==='ⲡⲉ'||x.text==='ⲡⲕ'));
 assert.ok(predictKeyboard(index,'ⲡ',{limit:10}).some(x=>x.text==='ⲡⲕ'));
 assert.throws(()=>predictKeyboard(index,'ⲡ',{dialect:'unknown'}),RangeError);
});
test('raw candidate is always first; catalog presence is not witness evidence',()=>{
 const r=predictKeyboard(index,'ⲡⲉ',{limit:3});
 assert.equal(r[0].text,'ⲡⲉ');
 assert.equal(r[0].attested,true);
 assert.equal(r[0].lexicalIdentityVerified,false);
 assert.ok(r.slice(1).every(x=>x.lexicon_ref===null&&x.lexicalIdentityVerified===false));
 assert.equal(predictKeyboard(index,'ⲡⲫ')[0].attested,false);
});
test('ranking favors actual popularity/learning without unrequested dialect balancing',()=>{
 const r=predictKeyboard(index,'ⲡ',{limit:4});
 assert.equal(r[1].text,'ⲡⲉ');
 const boosted=predictKeyboard(index,'ⲡ',{limit:6,learned:{'cop:ⲡⲓ':50}});
 assert.equal(boosted[1].text,'ⲡⲓ');
 assert.equal(boosted[1].source,'COMPILED-COPTIC');
});
test('personal suggestions work in selected dialect without fabricated attestation',()=>{
 const r=predictKeyboard(index,'ⲡ',{limit:8,dialect:'sahidic',
  learned:{'cop:ⲡⲫ':10}});
 const personal=r.find(x=>x.text==='ⲡⲫ');
 assert.ok(personal&&personal.personal&&!personal.attested);
 assert.equal(personal.dialects,0);
 assert.equal(personal.lexicon_ref,null);
 assert.ok(!predictKeyboard(index,'ⲡ',{dialect:'sahidic',includePersonal:false,learned:{'cop:ⲡⲫ':10}})
  .some(x=>x.text==='ⲡⲫ'));
});
test('validated pack rejects fabricated dialect masks or duplicate surfaces',()=>{
 assert.throws(()=>prepareKeyboardIndex('egy',base),RangeError);
 assert.throws(()=>prepareKeyboardIndex('cop',{rows:[['ⲡⲉ',4]]}),TypeError);
 assert.throws(()=>prepareKeyboardIndex('cop',{rows:[['ⲡⲉ',1],['ⲡⲉ',2]]}),TypeError);
 assert.throws(()=>prepareKeyboardIndex('cop',{rows:[['english',1]]}),TypeError);
 assert.deepEqual(predictKeyboard(prepareKeyboardIndex('cop',{rows:[]}),'ⲡ'),[
  {text:'ⲡ',raw:true,personal:false,attested:false,inLexicon:false,lexicalIdentityVerified:false,lexicon_ref:null}]);
});
test('prefix search only reads relevant sorted span with 25,000 records',()=>{
 const records=Array.from({length:25000},(_,i)=>['ⲡ'+String(i).padStart(5,'0'),1]);
 records.push(['ⲁⲛ',1],['ⲁⲩⲱ',2]);
 const idx=prepareKeyboardIndex('cop',{rows:records});
 assert.deepEqual(predictKeyboard(idx,'ⲁ',{limit:4}).map(x=>x.text),['ⲁ','ⲁⲛ','ⲁⲩⲱ']);
});
