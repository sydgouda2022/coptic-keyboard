/** Coptic-only, source-backed prefix search. Compatible with the historic Renpet
 * API: keyboardKey(value,'cop'), prepareKeyboardIndex('cop',pack), and
 * predictKeyboard(index,raw,opts). No Egyptian branch or transliteration.
 * The lexicon catalogs *surfaces*, not verified word senses/manuscript witnesses.
 */
const collate=(a,b)=>a<b?-1:a>b?1:0;
const DIALECTS=new Set(['all','sahidic','bohairic']);
const SCRIPT=/[\p{Script=Coptic}\p{Script=Greek}]/u;
const KEYBOARD_WORD=/^[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u;
export function keyboardKey(value,language='cop'){
 if(language!=='cop')throw new RangeError('Coptic-only keyboard');
 if(typeof value!=='string')throw new TypeError('Unicode string required');
 return value.normalize('NFD').toLocaleLowerCase('und').replace(/\p{Mark}/gu,'').normalize('NFC');
}
/** Editorial brackets, reconstructions and spaces remain in the audited master,
 * but they must not be offered as literal single-word insertions. */
export function keyboardReady(surface){return typeof surface==='string'&&SCRIPT.test(surface)&&KEYBOARD_WORD.test(surface);}
export function prepareKeyboardIndex(language,pack){
 if(language!=='cop')throw new RangeError('Coptic-only keyboard');
 if(!pack||!Array.isArray(pack.rows))throw Error('Invalid Coptic pack');
 const rows=[];
 for(const entry of pack.rows){
  if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!SCRIPT.test(entry[0])||
    !Number.isInteger(entry[1])||entry[1]<0||entry[1]>3)throw Error('Invalid Coptic word/dialect record');
  const surface=entry[0],mask=entry[1];
  if(!keyboardReady(surface))continue;
  const n=Number(pack.popularity?.[surface]);
  rows.push({text:surface,key:keyboardKey(surface),id:'cop:'+surface,dialects:mask,
    frequency:Number.isFinite(n)?Math.min(10000,Math.max(0,n)):0,source:'CATALOG'});
 }
 rows.sort((a,b)=>collate(a.key,b.key)||collate(a.id,b.id));
 return {language:'cop',rows};
}
function bisect(rows,value){
 let lo=0,hi=rows.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(rows[mid].key<value)lo=mid+1;else hi=mid;}return lo;
}
function permitted(row,dialect){
 if(dialect==='all')return true;
 return dialect==='sahidic'?(row.dialects&1)!==0:(row.dialects&2)!==0;
}
function count(obj,key){const n=Number(obj?.[key]||0);return Number.isFinite(n)?Math.max(0,Math.min(10000,n)):0;}
export function predictKeyboard(index,raw,{dialect='all',learned={},previous='',limit=4}={}){
 if(index?.language!=='cop')throw new RangeError('Wrong keyboard language index');
 if(!Array.isArray(index.rows))throw Error('Invalid Coptic index');
 if(typeof raw!=='string')throw TypeError('Unicode string required');
 if(!DIALECTS.has(dialect))throw RangeError('Invalid Coptic dialect');
 if(!Number.isInteger(limit)||limit<1||limit>80)throw RangeError('Invalid suggestion limit');
 if(!raw)return [];
 const lookup=keyboardKey(raw),found=new Map();let exact=false;
 const insert=(row,personal=false)=>{
  if(!row.key.startsWith(lookup)||!permitted(row,dialect))return;
  if(row.text===raw){if(!personal)exact=true;return;}
  const lc=count(learned,'cop:'+row.text),cc=previous?count(learned,'ctx:cop:'+previous+':'+row.text):0;
  const score=Math.log1p(row.frequency)*8+Math.log1p(lc)*45+
   Math.log1p(cc)*30-[...row.text].length*0.05+(row.dialects===3?3:0);
  const candidate={text:row.text,raw:false,personal,
   // "attested" is legacy API compatibility: it means listed in the source
   // catalog, NOT a documented individual witness or verified lemma identity.
   attested:!personal,listedInCatalog:!personal,dialects:row.dialects,
   frequency:row.frequency,lexicalIdentityVerified:false,
   source:personal?'PERSONAL':'COP',lexicon_ref:personal?null:row.id,score};
  const prior=found.get(row.text);
  if(!prior||(!prior.attested&&candidate.attested)||
    prior.attested===candidate.attested&&prior.score<candidate.score)found.set(row.text,candidate);
 };
 for(let i=bisect(index.rows,lookup);i<index.rows.length;i++){
  const row=index.rows[i];if(!row.key.startsWith(lookup))break;
  if(permitted(row,dialect))insert(row);
 }
 // Only learned strings absent from the dictionary are personal suggestions.
 // No invented dialect attribution: user-entered forms are available in All.
 if(dialect==='all'&&learned&&typeof learned==='object'){
  for(const [key,n] of Object.entries(learned)){
   if(!key.startsWith('cop:')||!(Number(n)>0))continue;
   const text=key.slice(4);
   if(!text||text===raw||found.has(text)||!keyboardReady(text))continue;
   insert({text,key:keyboardKey(text),dialects:0,frequency:0,id:null},true);
  }
 }
 const list=[...found.values()].sort((a,b)=>b.score-a.score||collate(a.text,b.text));
 return [{text:raw,raw:true,personal:false,attested:exact,listedInCatalog:exact,lexicon_ref:null},
   ...list.slice(0,limit-1).map(({score,...candidate})=>candidate)];
}
