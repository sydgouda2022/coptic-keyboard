import {ensureCopticLexicon} from './coptic-install.mjs';
import {prepareKeyboardIndex,predictKeyboard} from './keyboard-search.mjs';
import {wordBeforeCaret,replaceRange,backspaceRange} from './editor.mjs';

const $=id=>document.getElementById(id);
const TEXT=$('writing'),KEYS=$('keys'),SUGGEST=$('suggestions'),STATUS=$('status');
const LETTERS=[...'ⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱϣϥϧϩϫϭϯ'];
const SYMBOLS=[...'. , ; : ! ?'.split(' ').filter(Boolean),'«','»','(',')','—','-','⳿','⳾','⸗','·','[',']','/'];
const STORE={draft:'coptic-keyboard.draft.v1',dialect:'coptic-keyboard.dialect.v1',learned:'coptic-keyboard.learned.v1'};
let index=null,dialect='all',upper=false,symbols=false,learning={},past=[],future=[],last='';
function load(key,other){try{return localStorage.getItem(key)??other;}catch{return other;}}
function save(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
function toast(message){const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,2600);}
function selection(){return {value:TEXT.value,start:TEXT.selectionStart,end:TEXT.selectionEnd};}
function rememberUndo(){past.push(selection());if(past.length>75)past.shift();future=[];}
function change(){const ok=save(STORE.draft,TEXT.value);
 $('storage').textContent=ok?'Saved on this device only':'Storage unavailable — export a backup';
 $('chars').textContent=[...TEXT.value].length+' characters';
 $('word-count').textContent=(TEXT.value.match(/[\p{Script=Coptic}\p{Script=Greek}]+/gu)||[]).length+' words';
 $('undo').disabled=past.length===0;$('redo').disabled=future.length===0;
 last=TEXT.value;renderSuggestions();
}
function edit(replacement,start=TEXT.selectionStart,end=TEXT.selectionEnd){
 rememberUndo();const next=replaceRange(TEXT.value,start,end,replacement);
 TEXT.value=next.value;TEXT.focus({preventScroll:true});TEXT.setSelectionRange(next.caret,next.caret);change();
}
function history(isUndo){const from=isUndo?past:future,to=isUndo?future:past;
 if(!from.length)return;to.push(selection());const s=from.pop();TEXT.value=s.value;
 TEXT.focus({preventScroll:true});TEXT.setSelectionRange(s.start,s.end);change();
}
function previousWord(start){return TEXT.value.slice(0,start).trimEnd().match(/[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u)?.[0]||'';}
function remember(word,previous){
 if(!word)return;
 const key='cop:'+word;learning[key]=Math.min(10000,(Number(learning[key])||0)+1);
 if(previous){const key='ctx:cop:'+previous+':'+word;learning[key]=Math.min(10000,(Number(learning[key])||0)+1);}
 const entries=Object.entries(learning).filter(([,n])=>Number.isFinite(Number(n))&&Number(n)>0).sort((a,b)=>b[1]-a[1]).slice(0,1500);
 save(STORE.learned,JSON.stringify(Object.fromEntries(entries)));
}
function hint(text){const p=document.createElement('span');p.className='placeholder';p.textContent=text;SUGGEST.append(p);}
function renderSuggestions(){
 SUGGEST.replaceChildren();if(!index){hint('Dictionary loading or unavailable');return;}
 const sel=wordBeforeCaret(TEXT.value,TEXT.selectionStart);
 if(!sel.raw){hint('Type a Coptic word for suggestions');return;}
 const prev=previousWord(sel.start);
 const options=predictKeyboard(index,sel.raw,{dialect,learned:learning,previous:prev,limit:4});
 for(const item of options){
  const button=document.createElement('button'),word=document.createElement('strong'),label=document.createElement('small');
  button.type='button';word.textContent=item.text;
  label.textContent=item.raw?'Typed':item.personal?'Personal':item.dialects===3?'S / B':item.dialects===1?'Sahidic':item.dialects===2?'Bohairic':'Dialect unknown';
  button.setAttribute('aria-label','Insert '+item.text+' ('+label.textContent+')');
  button.append(word,label);button.addEventListener('pointerdown',e=>e.preventDefault());
  button.addEventListener('click',()=>{remember(item.text,prev);edit(item.text,sel.start,sel.end);});
  SUGGEST.append(button);
 }
}
function renderKeys(){KEYS.replaceChildren();
 for(const ch of symbols?SYMBOLS:LETTERS){const value=upper?ch.toUpperCase():ch;
  const button=document.createElement('button');button.type='button';button.textContent=value;
  button.setAttribute('aria-label','Insert '+value);button.addEventListener('pointerdown',e=>e.preventDefault());
  button.addEventListener('click',()=>edit(value));KEYS.append(button);
 }
}
async function copy(){try{await navigator.clipboard.writeText(TEXT.value);toast('Copied');}
 catch{TEXT.focus();TEXT.select();toast('Text selected — use system Copy');}}
async function paste(){try{edit(await navigator.clipboard.readText());}
 catch{toast('Clipboard access unavailable — use system Paste');}}
function exportText(){
 const url=URL.createObjectURL(new Blob([TEXT.value],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='coptic-writing.txt';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Text export prepared');
}
function onlineState(){if(!index)return;
 STATUS.textContent=navigator.onLine?'Dictionary ready · works offline':'Offline · dictionary ready';STATUS.className='ready';
}
function init(){
 TEXT.value=load(STORE.draft,'');dialect=load(STORE.dialect,'all');
 if(!['all','sahidic','bohairic'].includes(dialect))dialect='all';
 const chosen=document.querySelector('input[name="dialect"][value="'+dialect+'"]');if(chosen)chosen.checked=true;
 try{const saved=JSON.parse(load(STORE.learned,'{}'));if(saved&&typeof saved==='object'&&!Array.isArray(saved))learning=saved;}catch{}
 TEXT.addEventListener('input',()=>{if(TEXT.value!==last){past.push({value:last,start:TEXT.selectionStart,end:TEXT.selectionStart});future=[];}change();});
 for(const event of ['select','click','keyup'])TEXT.addEventListener(event,renderSuggestions);
 document.querySelectorAll('input[name="dialect"]').forEach(x=>x.addEventListener('change',()=>{dialect=x.value;save(STORE.dialect,dialect);renderSuggestions();}));
 $('case').addEventListener('click',()=>{upper=!upper;$('case').setAttribute('aria-pressed',String(upper));renderKeys();});
 $('symbols').addEventListener('click',()=>{symbols=!symbols;$('symbols').setAttribute('aria-pressed',String(symbols));renderKeys();});
 $('space').addEventListener('click',()=>edit(' '));$('enter').addEventListener('click',()=>edit('\n'));
 $('backspace').addEventListener('click',()=>{const r=backspaceRange(TEXT.value,TEXT.selectionStart,TEXT.selectionEnd);edit('',r.start,r.end);});
 $('undo').addEventListener('click',()=>history(true));$('redo').addEventListener('click',()=>history(false));
 $('copy').addEventListener('click',copy);$('paste').addEventListener('click',paste);
 $('select-all').addEventListener('click',()=>{TEXT.focus();TEXT.select();});
 $('download').addEventListener('click',exportText);
 $('clear').addEventListener('click',()=>{if(TEXT.value&&confirm('Clear the current writing? Export a copy first if needed.'))edit('',0,TEXT.value.length);});
 window.addEventListener('online',onlineState);window.addEventListener('offline',onlineState);
 renderKeys();change();
}
async function main(){
 init();try{
  const installed=await ensureCopticLexicon();index=prepareKeyboardIndex('cop',installed.payload);
  const excluded=installed.payload.rows.length-index.rows.length;
  $('dictionary-detail').textContent=index.rows.length.toLocaleString()+' insertable forms · '+excluded.toLocaleString()+' editorial forms excluded. Source-listed, not witness-verified.';
  onlineState();renderSuggestions();
 }catch(err){console.error('Coptic dictionary unavailable',err);STATUS.className='warning';STATUS.textContent='Dictionary unavailable · typing works';toast('Writing works without the dictionary');}
 if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Offline setup unavailable',e));
}
main();
