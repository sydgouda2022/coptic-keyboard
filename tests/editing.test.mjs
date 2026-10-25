import test from 'node:test';
import assert from 'node:assert/strict';
import {wordBeforeCaret,replaceRange,backspaceRange,applyKey} from '../src/editor.mjs';
test('editor keys work with UTF-16 caret and selection without a DOM',()=>{
 const text='ⲡⲉ ⲙⲉ';
 assert.deepEqual(wordBeforeCaret(text,text.length),{start:3,end:5,raw:'ⲙⲉ'});
 assert.deepEqual(replaceRange(text,3,5,'ⲙⲉⲧⲉ'),{value:'ⲡⲉ ⲙⲉⲧⲉ',caret:7});
 assert.deepEqual(applyKey('ⲡⲉ',1,1,{text:'ⲁ'}),{value:'ⲡⲁⲉ',caret:2});
 assert.deepEqual(applyKey('ⲁ̅',2,2,{action:'backspace'}),{value:'',caret:0});
 assert.deepEqual(backspaceRange('ⲁ̅',2,2),{start:0,end:2});
 assert.deepEqual(backspaceRange('ⲡⲉ',0,2),{start:0,end:2});
});
test('invalid ranges cannot silently corrupt text',()=>{
 assert.throws(()=>replaceRange('ⲡ',2,2,'ⲁ'),RangeError);
 assert.throws(()=>replaceRange('ⲡ',1,0,'ⲁ'),RangeError);
 assert.throws(()=>wordBeforeCaret('ⲡ',-1),RangeError);
 assert.throws(()=>applyKey('ⲡ',0,0,{action:'unknown'}),RangeError);
});
