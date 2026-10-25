/** Sole Coptic prediction kernel. This is a ranked source-listed *surface*
 * lookup, not morphology, manuscript attestation or independent lemma proof.
 * Retains the Renpet-compatible public prediction contract.
 */
const compare=(a,b)=>a<b?-1:a>b?1:0;
const alphabet=/[\p{Script=Coptic}\p{Script=Greek}]/u;
const insertable=/^[\p{Script=Coptic}\p{Script=Greek}\p{Mark}]+$/u;
export function keyboardReady(value){return typeof value==='string'&&alphabet.test(value)&&insertable.test(value);}
export function keyboardKey(value,language='cop'){
 if(language!=='cop')throw new RangeError('Coptic-only keyboard');
 if(typeof value!=='string')throw new TypeError('Unicode string required');
 return value.normalize('NFD').toLocaleLowerCase('und').replace(/\p{Mark}/gu,'').normalize('NFC');
}
export function prepareKeyboardIndex(language,pack){
 if(language!=='cop')throw new RangeError('Coptic-only keyboard');
 if(!pack||!Array.isArray(pack.rows))throw Error('Invalid Coptic pack');
 const rows=[];
 for(const entry of pack.rows){
  if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!alphabet.test(entry[0])||
   !Number.isInteger(entry[1])||entry[1]<0||entry[1]>3)throw Error('Invalid Coptic word or dialect');
  const surface=entry[0],dialects=entry[1];
  // Editorial heads (* reconstructed, parenthesized, hyphenated, multiword)
  // remain in the archival database, not offered as literal word insertions.
  if(!keyboardReady(surface))continue;
  const hint=Number(pack.popularity?.[surface]);
  rows.push({text:surface,key:keyboardKey(surface),id:'cop:'+surface,dialects,
   frequency:Number.isFinite(hint)?Math.max(0,Math.min(10000,hint)):0,source:'COP'});
 }
 rows.sort((a,b)=>compare(a.key,b.key)||compare(a.id,b.id));
 return {language:'cop',rows};
}
function lowerBound(rows,value){
 let low=0,high=rows.length;
 while(low<high){const mid=(low+high)>>>1;if(rows[mid].key<value)low=mid+1;else high=mid;}return low;
}
function permitted(row,dialect){
 return dialect==='all'||(dialect==='sahidic'?(row.dialects&1)!==0:(row.dialects&2)!==0);
}
function count(obj,key){
 const n=Number(obj?.[key]??0);return Number.isFinite(n)?Math.min(10000,Math.max(0,n)):0;
}
export function predictKeyboard(index,raw,{dialect='all',learned={},previous='',limit=4}={}){
 if(index?.language!=='cop')throw new RangeError('Wrong Coptic keyboard index');
 if(!Array.isArray(index.rows))throw Error('Invalid keyboard index');
 if(typeof raw!=='string')throw TypeError('Expected Unicode string');
 if(!['all','sahidic','bohairic'].includes(dialect))throw RangeError('Invalid Coptic dialect');
 if(!Number.isInteger(limit)||limit<1||limit>80)throw RangeError('Invalid suggestion limit');
 if(!raw)return [];
 const key=keyboardKey(raw),found=new Map();let exact=false;
 const add=(row,personal=false)=>{
  if(!row.key.startsWith(key)||!permitted(row,dialect))return;
  if(row.text===raw){if(!personal)exact=true;return;}
  const frequency=count(learned,'cop:'+row.text);
  const context=previous?count(learned,'ctx:cop:'+previous+':'+row.text):0;
  const score=Math.log1p(row.frequency)*8+Math.log1p(frequency)*45+Math.log1p(context)*30-
   [...row.text].length*.05+(row.dialects===3?3:0);
  const candidate={text:row.text,raw:false,personal,
   // Historical field name retained for Renpet compatibility. It means
   // listed in a source catalog, NOT individually witnessed/lemma-verified.
   attested:!personal,listedInCatalog:!personal,dialects:row.dialects,
   frequency:row.frequency,lexicalIdentityVerified:false,
   source:personal?'PERSONAL':'COP',lexicon_ref:personal?null:row.id,score};
  const prior=found.get(row.text);
  if(!prior||(!prior.attested&&candidate.attested)||
   prior.attested===candidate.attested&&prior.score<candidate.score)found.set(row.text,candidate);
 };
 for(let i=lowerBound(index.rows,key);i<index.rows.length;i++){
  const row=index.rows[i];if(!row.key.startsWith(key))break;
  if(permitted(row,dialect))add(row);
 }
 // Never pretend an input learned by a user has a known Sahidic/Bohairic dialect.
 if(dialect==='all'&&learned&&typeof learned==='object'){
  for(const [id,value] of Object.entries(learned)){
   if(!id.startsWith('cop:')||!(Number(value)>0))continue;
   const text=id.slice(4);if(!text||text===raw||found.has(text)||!keyboardReady(text))continue;
   add({text,key:keyboardKey(text),id:null,dialects:0,frequency:0},true);
  }
 }
 const matches=[...found.values()].sort((a,b)=>b.score-a.score||compare(a.text,b.text));
 return [{text:raw,raw:true,personal:false,attested:exact,listedInCatalog:exact,lexicon_ref:null},
  ...matches.slice(0,limit-1).map(({score,...candidate})=>candidate)];
}
