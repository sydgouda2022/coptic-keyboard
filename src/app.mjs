import {ensureCopticLexicon} from './coptic_install.mjs';
import {prepareKeyboardIndex,predictKeyboard} from './keyboard_search.mjs';
import {wordBeforeCaret,replaceRange,backspaceRange} from './editor.mjs';

const LETTERS=[...'ⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱϣϥϧϩϫϭϯ'];
const SYMBOLS=[...'.,;:!?', '«','»','(',')','—','-','⳿','⳾','⸗','·','[',']','/','\'','"'];
const K={draft:'coptic-keyboard.draft.v1',dialect:'coptic-keyboard.dialect.v1',learned:'coptic-keyboard.learned.v1'};
const $=id=>document.getElementById(id);
const area=$('writing'),keys=$('keys'),status=$('connection');
let index=null,upper=false,symbols=false,dialect='all',learned={},undo=[],redo=[],lastSnapshot='';
function load(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
function notice(text){const el=$('toast');el.textContent=text;el.hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.hidden=true,2600);}
function snapshot(){return {value:area.value,start:area.selectionStart,end:area.selectionEnd};}
function pushUndo(){const s=snapshot();if(undo.at(-1)?.value!==s.value){undo.push(s);if(undo.length>75)undo.shift();}redo=[];}
function restore(item){if(!item)return;area.value=item.value;area.focus({preventScroll:true});area.setSelectionRange(item.start,item.end);changed();}
function edit(replacement,start=area.selectionStart,end=area.selectionEnd){
 pushUndo();const next=replaceRange(area.value,start,end,replacement);
 area.value=next.value;area.focus({preventScroll:true});area.setSelectionRange(next.caret,next.caret);changed();
}
function history(which){const src=which==='undo'?undo:redo,dst=which==='undo'?redo:undo;if(!src.length)return;dst.push(snapshot());restore(src.pop());}
function contextPrevious(start){const prefix=area.value.slice(0,start).trimEnd();return prefix.match(/[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u)?.[0]||'';}
function learn(text,previous){if(!text)return;const key='cop:'+text;learned[key]=Math.min(10000,(Number(learned[key])||0)+1);
 if(previous){const context='ctx:cop:'+previous+':'+text;learned[context]=Math.min(10000,(Number(learned[context])||0)+1);}
 const recent=Object.entries(learned).filter(([,n])=>Number.isFinite(n)&&n>0).sort((a,b)=>b[1]-a[1]).slice(0,1500);
 save(K.learned,JSON.stringify(Object.fromEntries(recent)));
}
function changed(){
 const preserved=save(K.draft,area.value);$('storage-note').textContent=preserved?'Saved on this device only':'Storage unavailable — export a backup';
 $('chars').textContent=`${[...area.value].length} characters`;
 $('word-count').textContent=`${(area.value.match(/[\p{Script=Coptic}\p{Script=Greek}]+/gu)||[]).length} words`;
 $('undo').disabled=undo.length===0;$('redo').disabled=redo.length===0;
 renderSuggestions();lastSnapshot=area.value;
}
function renderSuggestions(){const root=$('suggestions');root.replaceChildren();if(!index){showHint('Lexicon loading or unavailable');return;}
 const selection=wordBeforeCaret(area.value,area.selectionStart);if(!selection.raw){showHint('Type Coptic letters for suggestions');return;}
 const current=area.value.slice(selection.start,selection.end);
 const words=predictKeyboard(index,current,{dialect,limit:4,learned,previous:contextPrevious(selection.start)});
 for(const candidate of words){const b=document.createElement('button');b.type='button';
  const surface=document.createElement('strong');surface.textContent=candidate.text;b.append(surface);
  const sub=document.createElement('small');sub.textContent=candidate.raw?'Typed':candidate.personal?'Personal':candidate.dialects===0?'Dialect unknown':candidate.dialects===3?'S / B':candidate.dialects===1?'Sahidic':'Bohairic';b.append(sub);
  b.setAttribute('aria-label',`Insert ${candidate.text} (${sub.textContent})`);
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.addEventListener('click',()=>{learn(candidate.text,contextPrevious(selection.start));edit(candidate.text,selection.start,selection.end);});root.append(b);
 }
 function showHint(text){const p=document.createElement('span');p.className='placeholder';p.textContent=text;root.append(p);}
}
function renderKeys(){keys.replaceChildren();keys.classList.toggle('symbols',symbols);
 for(const entry of symbols?SYMBOLS:LETTERS){const value=upper?entry.toUpperCase():entry;
  const b=document.createElement('button');b.type='button';b.textContent=value;b.setAttribute('aria-label','Insert '+value);
  b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>edit(value));keys.append(b);
 }
}
function trackPhysicalEdit(){if(area.value!==lastSnapshot){undo.push({value:lastSnapshot,start:Math.min(area.selectionStart,lastSnapshot.length),end:Math.min(area.selectionStart,lastSnapshot.length)});if(undo.length>75)undo.shift();redo=[];}changed();}
async function copy(){try{await navigator.clipboard.writeText(area.value);notice('Copied to clipboard');}catch{area.focus();area.select();notice('Text selected — use Copy');}}
async function paste(){try{const text=await navigator.clipboard.readText();edit(text);}catch{notice('Clipboard access denied — use system Paste');}}
function exportText(){const bytes=new Blob([area.value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(bytes);const a=document.createElement('a');a.href=url;a.download='coptic-writing.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Text export prepared');}
function init(){
 area.value=load(K.draft,'');
 dialect=load(K.dialect,'all');if(!['all','sahidic','bohairic'].includes(dialect))dialect='all';
 const selected=document.querySelector(`input[name="dialect"][value="${dialect}"]`);if(selected)selected.checked=true;
 try{const saved=JSON.parse(load(K.learned,'{}'));if(saved&&typeof saved==='object'&&!Array.isArray(saved))learned=saved;}catch{}
 area.addEventListener('input',trackPhysicalEdit);
 for(const kind of ['keyup','click','select'])area.addEventListener(kind,renderSuggestions);
 document.querySelectorAll('input[name="dialect"]').forEach(r=>r.addEventListener('change',()=>{dialect=r.value;save(K.dialect,dialect);renderSuggestions();}));
 $('case').addEventListener('click',()=>{upper=!upper;$('case').setAttribute('aria-pressed',String(upper));renderKeys();});
 $('symbols').addEventListener('click',()=>{symbols=!symbols;$('symbols').setAttribute('aria-pressed',String(symbols));renderKeys();});
 $('space').addEventListener('click',()=>edit(' '));$('enter').addEventListener('click',()=>edit('\n'));
 $('backspace').addEventListener('click',()=>{const {start,end}=backspaceRange(area.value,area.selectionStart,area.selectionEnd);edit('',start,end);});
 $('undo').addEventListener('click',()=>history('undo'));$('redo').addEventListener('click',()=>history('redo'));
 $('copy').addEventListener('click',copy);$('paste').addEventListener('click',paste);
 $('select-all').addEventListener('click',()=>{area.focus();area.select();renderSuggestions();});
 $('download').addEventListener('click',exportText);
 $('clear').addEventListener('click',()=>{if(!area.value||!confirm('Clear the current document? Export a copy first if needed.'))return;edit('',0,area.value.length);});
 window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);
 renderKeys();changed();
}
function updateOnline(){if(!index)return;status.textContent=navigator.onLine?'Dictionary ready · works offline':'Offline · dictionary available';status.className='status ready';}
async function main(){init();
 try{const result=await ensureCopticLexicon();index=prepareKeyboardIndex('cop',result.payload);
  const discarded=result.payload.rows.length-index.rows.length;
  $('dictionary-detail').textContent=`${index.rows.length.toLocaleString()} insertable words · ${discarded.toLocaleString()} lexicographic forms excluded from keyboard insertion. Lexicon is source-listed, not manuscript-verified.`;
  updateOnline();renderSuggestions();
 }catch(error){console.error('Coptic dictionary setup:',error);status.textContent='Dictionary unavailable · writing still works';status.className='status warning';renderSuggestions();notice('Dictionary unavailable; you can still type and export.');}
 if('serviceWorker'in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Offline cache unavailable',e));
 }
}
main();
