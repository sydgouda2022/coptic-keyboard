import test from 'node:test';
import assert from 'node:assert/strict';
import {wordBeforeCaret,replaceRange,backspaceRange} from '../src/editor.mjs';
test('caret prefix replacement preserves context',()=>{
 const word='ⲡⲉ ⲙⲉ',selection=wordBeforeCaret(word,word.length);
 assert.deepEqual(selection,{raw:'ⲙⲉ',start:3,end:5});
 assert.deepEqual(replaceRange(word,3,5,'ⲙⲉⲧⲉ'),{value:'ⲡⲉ ⲙⲉⲧⲉ',caret:7});
});
test('backspace deletes complete Unicode grapheme and respects a selection',()=>{
 assert.deepEqual(backspaceRange('ⲁ̄',2,2),{start:0,end:2});
 assert.deepEqual(backspaceRange('ⲁⲃ',0,2),{start:0,end:2});
 assert.deepEqual(backspaceRange('',0,0),{start:0,end:0});
});
