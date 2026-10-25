/** Pure Unicode editor operations; UTF-16 offsets match HTMLTextareaElement. */
export function wordBeforeCaret(value,position){
 const match=value.slice(0,position).match(/[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u);
 return {raw:match?.[0]||'',start:position-(match?.[0].length||0),end:position};
}
export function replaceRange(value,start,end,replacement){
 const inserted=String(replacement);
 return {value:value.slice(0,start)+inserted+value.slice(end),caret:start+inserted.length};
}
export function backspaceRange(value,start,end){
 if(end>start||start===0)return {start,end};
 if(typeof Intl!=='undefined'&&Intl.Segmenter){
  let previous=0;
  for(const x of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value.slice(0,start)))previous=x.index;
  return {start:previous,end:start};
 }
 return {start:start-([...(value.slice(0,start))].at(-1)?.length||1),end:start};
}
