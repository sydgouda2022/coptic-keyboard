import test from 'node:test';
import assert from 'node:assert/strict';
import {replaceRange,backspaceRange,applyKey} from '../src/editor.mjs';
import {createCopticKeyboard} from '../src/core.mjs';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync(new URL('../release/lexicon.json',import.meta.url),'utf8'));
const keyboard=createCopticKeyboard(catalog,{limit:9});
const chars=['ⲡ','ⲉ','ⲛ','ⲟ','ⲙ','ⲱ','ⲁ\u0305','ⲃ','ⲧ',' ','𓄿','👩‍💻'];
// Seeded deterministic cases reproduce on CI; no property-fuzzer dependency.
let state=0x9e3779b9;
const rand=n=>{state^=state<<13;state^=state>>>17;state^=state<<5;
 return (state>>>0)%n;};

test('5,000 deterministic Unicode editing invariants',()=>{
 for(let i=0;i<5000;i++){
  const value=Array.from({length:rand(20)},()=>chars[rand(chars.length)]).join('');
  // Real caret positions are extended grapheme boundaries, not every
  // UTF-16 code-unit boundary. Editing inside a Coptic overline is forbidden.
  const positions=[...new Set([0,...[...new Intl.Segmenter('und',
    {granularity:'grapheme'}).segment(value)].map(s=>s.index),value.length])];
  const left=positions[rand(positions.length)];
  const right=positions[rand(positions.length)];
  const start=Math.min(left,right),end=Math.max(left,right);
  const replacement=chars[rand(chars.length)];
  const {value:out,caret}=replaceRange(value,start,end,replacement);
  assert.equal(out,value.slice(0,start)+replacement+value.slice(end));
  assert.equal(caret,start+replacement.length);
  const {value:undone,caret:back}=replaceRange(out,start,caret,value.slice(start,end));
  assert.equal(undone,value);
  assert.equal(back,end);
  const del=backspaceRange(value,start,start);
  assert.ok(del.start>=0&&del.start<=start);
  assert.equal(del.end,start);
  const after=applyKey(value,start,start,{action:'backspace'});
  assert.equal(after.value,value.slice(0,del.start)+value.slice(del.end));
 }
});
test('real Coptic catalog yields deterministic valid suggestions across 900 prefixes',()=>{
 const samples=catalog.rows.filter(row=>row[0].length>=2).slice(0,900);
 for(const [word] of samples){
  const prefix=[...word][0];
  const options={limit:9};
  const a=keyboard.suggest(prefix,options);
  const b=keyboard.suggest(prefix,options);
  assert.deepEqual(a,b);
  assert.equal(a[0]?.text,prefix);
  assert.ok(a.length<=9);
  assert.equal(new Set(a.map(x=>x.text)).size,a.length);
  assert.ok(a.slice(1).every(x=>x.inLexicon===true));
 }
});
