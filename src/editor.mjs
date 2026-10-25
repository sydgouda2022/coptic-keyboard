/** Pure Unicode editor operations. UTF-16 offsets match textarea selection API. */
const wordRe=/[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u;
export function wordBeforeCaret(value,position){
 const left=value.slice(0,position),match=left.match(wordRe);
 return {start:position-(match?.[0].length||0),end:position,raw:match?.[0]||''};
}
export function replaceRange(value,start,end,replacement){
 const text=String(replacement),next=value.slice(0,start)+text+value.slice(end);
 return {value:next,caret:start+text.length};
}
export function backspaceRange(value,start,end){
 if(end>start)return {start,end};
 if(start<=0)return {start:0,end:0};
 if(typeof Intl!=='undefined'&&Intl.Segmenter){
  let previous=0;
  for(const segment of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value.slice(0,start))) previous=segment.index;
  return {start:previous,end:start};
 }
 const units=[...value.slice(0,start)].at(-1)?.length||1;
 return {start:start-units,end:start};
}
export function encodeText(text){return new TextEncoder().encode(String(text));}
