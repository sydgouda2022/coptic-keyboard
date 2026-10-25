import test from 'node:test';import assert from 'node:assert/strict';
import {wordBeforeCaret,replaceRange,backspaceRange} from '../src/editor.mjs';
test('word completion respects UTF-16 caret positions and final selection',()=>{
 const s='ⲡⲉ ⲙⲉ';const info=wordBeforeCaret(s,s.length);
 assert.deepEqual(info,{raw:'ⲙⲉ',start:3,end:5});
 assert.deepEqual(replaceRange(s,info.start,info.end,'ⲙⲉⲧⲉ'),{value:'ⲡⲉ ⲙⲉⲧⲉ',caret:7});
});
test('delete combined Coptic grapheme, not a half character',()=>{
 const s='ⲁ̄';const r=backspaceRange(s,s.length,s.length);
 assert.deepEqual(r,{start:0,end:s.length});
 assert.deepEqual(backspaceRange('',0,0),{start:0,end:0});
});
