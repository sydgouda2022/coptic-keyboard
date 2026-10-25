import test from 'node:test';
import assert from 'node:assert/strict';
import {applyKey,backspaceRange,replaceRange,wordBeforeCaret} from '../src/editor.mjs';
import {keyboardKey,prepareKeyboardIndex,predictKeyboard,
 isInsertableSurface} from '../src/core.mjs';

test('Coptic base and multiple supralinear marks are one deletion unit',()=>{
 for(const sequence of ['ⲁ\u0305','ⲁ\u0305\u0308','ⲙ\u0305\u0301']){
  const original='ⲡ'+sequence+'ⲉ';
  const start=1,end=1+sequence.length;
  assert.deepEqual(backspaceRange(original,end,end),{start,end});
  assert.deepEqual(applyKey(original,end,end,{action:'backspace'}),
    {value:'ⲡⲉ',caret:1});
 }
});
test('UTF-16 astral characters do not split on deletion or insertion',()=>{
 const glyph='𓄿';
 const text='ⲁ'+glyph+'ⲡ';
 assert.deepEqual(backspaceRange(text,3,3),{start:1,end:3});
 assert.deepEqual(applyKey(text,3,3,{action:'backspace'}),
  {value:'ⲁⲡ',caret:1});
 assert.deepEqual(applyKey(text,1,3,{text:'ⲃ'}),
  {value:'ⲁⲃⲡ',caret:2});
 assert.throws(()=>replaceRange(text,2,2,'ⲡ'),RangeError);
 assert.throws(()=>backspaceRange(text,2,2),RangeError);
 assert.throws(()=>wordBeforeCaret(text,2),RangeError);
});
test('edit positions are UTF-16 offsets, not codepoint counts',()=>{
 const text='𓄿ⲡ\u0305ⲉ';
 assert.deepEqual(wordBeforeCaret(text,text.length),
  {start:2,end:5,raw:'ⲡ\u0305ⲉ'});
 assert.deepEqual(replaceRange(text,2,text.length,'ⲙ'),{value:'𓄿ⲙ',caret:3});
});
test('editor never cuts a ZWJ emoji sequence while removing one cluster',()=>{
 const value='ⲁ👩‍💻ⲃ';
 const caret=value.length-1;
 assert.deepEqual(applyKey(value,caret,caret,{action:'backspace'}),
  {value:'ⲁⲃ',caret:1});
});
test('Coptic lookup tolerates NFD/NFC without mutating emitted words',()=>{
 const source='ⲁ\u0305';
 const pack={rows:[[source,1],['ⲁⲃ',2],['ⲁⲫ',3],['ⲁⲫⲉ',0]]};
 const index=prepareKeyboardIndex('cop',pack);
 assert.equal(keyboardKey(source),keyboardKey(source.normalize('NFC')));
 assert.equal(predictKeyboard(index,'ⲁ',{limit:10})
  .find(item=>item.text===source).text,source);
 assert.equal(predictKeyboard(index,'ⲁ',{dialect:'bohairic',limit:10})
  .some(item=>item.text==='ⲁⲃ'),true);
 assert.equal(predictKeyboard(index,'ⲁ',{dialect:'sahidic',limit:10})
  .some(item=>item.text==='ⲁⲃ'),false);
});
test('Unicode insertion is restricted by default; editorial marks opt in',()=>{
 assert.equal(isInsertableSurface('ⲁ\u0305'),true);
 assert.equal(isInsertableSurface('ⲁ ⲃ'),false);
 assert.equal(isInsertableSurface('ⲁ ⲃ',{includePhrases:true}),true);
 assert.equal(isInsertableSurface('*ⲁ'),false);
 assert.equal(isInsertableSurface('*ⲁ',{includeEditorial:true}),true);
 assert.equal(isInsertableSurface('ⲁ\u0000',{includeEditorial:true}),false);
 assert.equal(isInsertableSurface('ⲁ\u200b',{includeEditorial:true}),false);
});

test('caret inside a Coptic supralinear grapheme is rejected across editing operations',()=>{
 const value='ⲡⲁ\u0305ⲧ';
 const inside=2; // between ⲁ and its combining supralinear bar
 for(const operation of [
  ()=>wordBeforeCaret(value,inside),
  ()=>replaceRange(value,inside,inside,'ⲉ'),
  ()=>backspaceRange(value,inside,inside),
  ()=>applyKey(value,inside,inside,{text:'ⲛ'}),
  ()=>applyKey(value,inside,inside,{action:'backspace'}),
  ()=>replaceRange(value,1,inside,'')
 ]) assert.throws(operation,RangeError);
 assert.deepEqual(applyKey(value,3,3,{action:'backspace'}),
  {value:'ⲡⲧ',caret:1});
});
test('complex emoji is atomic for caret selection, and valid edges still edit',()=>{
 const text='ⲁ👩‍💻ⲡ';
 for(const pos of [3,4,5]){
  assert.throws(()=>replaceRange(text,pos,pos,'ⲉ'),RangeError);
 }
 const end=text.length-1;
 assert.deepEqual(applyKey(text,end,end,{action:'backspace'}),
  {value:'ⲁⲡ',caret:1});
});
