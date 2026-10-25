/** Pure text-editing operations using the UTF-16 offsets of input controls.
 * The application owns UI events, undo history, focus, and persistence.
 */
const WORD=/[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u;
function checkOffset(text,number,name){
  if(!Number.isInteger(number)||number<0||number>text.length)
    throw new RangeError('Invalid '+name);
  if(number===0||number===text.length)return;
  // Selection offsets are UTF-16 units, but editing operations must never
  // split an extended grapheme cluster (including Coptic supralinear marks).
  // Intl.Segmenter implements UAX #29 in all supported runtimes.
  if(typeof Intl.Segmenter==='function'){
    const segments=new Intl.Segmenter('und',{granularity:'grapheme'}).segment(text);
    if(segments.containing(number)?.index!==number)
      throw new RangeError('Selection bisects a Unicode grapheme cluster');
    return;
  }
  // Conservative fallback: protect surrogate pairs, combining marks, ZWJ
  // sequences and variation selectors. Unknown segmentation cannot justify
  // splitting characters, but complex scripts should use Intl.Segmenter.
  const before=text.charCodeAt(number-1),next=text.charCodeAt(number);
  if((before>=0xD800&&before<=0xDBFF&&next>=0xDC00&&next<=0xDFFF)||
     /[\p{Mark}\u200D\uFE0E\uFE0F]/u.test(text[number])||
     text[number-1]==='\u200D')
    throw new RangeError('Selection bisects a Unicode grapheme cluster');
}
export function wordBeforeCaret(value,position){
  if(typeof value!=='string')throw new TypeError('value must be string');
  checkOffset(value,position,'caret');
  const match=value.slice(0,position).match(WORD);
  return {start:position-(match?.[0].length||0),end:position,raw:match?.[0]||''};
}
export function replaceRange(value,start,end,replacement){
  if(typeof value!=='string'||typeof replacement!=='string')
    throw new TypeError('Text and replacement must be strings');
  checkOffset(value,start,'start');checkOffset(value,end,'end');
  if(start>end)throw new RangeError('Selection reversed');
  const result=value.slice(0,start)+replacement+value.slice(end);
  return {value:result,caret:start+replacement.length};
}
export function backspaceRange(value,start,end){
  if(typeof value!=='string')throw new TypeError('value must be string');
  checkOffset(value,start,'start');checkOffset(value,end,'end');
  if(start>end)throw new RangeError('Selection reversed');
  if(end>start)return {start,end};
  if(start===0)return {start:0,end:0};
  const before=value.slice(0,start);
  if(typeof Intl.Segmenter==='function'){
    let last=0;
    for(const segment of new Intl.Segmenter('und',{granularity:'grapheme'}).segment(before))
      last=segment.index;
    return {start:last,end:start};
  }
  // Conservative fallback if Intl.Segmenter is unavailable. Delete a base
  // codepoint with trailing combining marks, not an orphaned overline alone.
  const chars=[...before];
  let first=chars.length-1;
  const mark=/^\p{Mark}$/u;
  while(first>0&&mark.test(chars[first]))first--;
  // Joiner-based sequences consist of a previous base + U+200D + next base.
  while(first>=2&&chars[first-1]==='\u200D'){
    first-=2;
    while(first>0&&mark.test(chars[first]))first--;
  }
  const removed=chars.slice(first).join('').length;
  return {start:start-removed,end:start};
}
/** Apply virtual-key input without binding to a DOM, key events or an OS IME.
 * action: 'insert' | 'backspace'. Host may provide grapheme text for insert.
 */
export function applyKey(value,start,end,{action='insert',text=''}={}){
  if(action==='backspace'){
    const range=backspaceRange(value,start,end);
    return replaceRange(value,range.start,range.end,'');
  }
  if(action!=='insert')throw new RangeError('Unknown keyboard action');
  return replaceRange(value,start,end,text);
}
