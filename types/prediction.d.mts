/** Pure Coptic Unicode prediction API. */
export declare const LANGUAGE:'cop';
export declare const PREDICTION_API_VERSION:2;
export declare const COPTIC_KEYS:ReadonlyArray<string>;
export type CopticDialect='all'|'sahidic'|'bohairic';
export interface CopticCatalog {
  format:'coptic-predict-v1';
  language:'cop';
  dialects:['Sahidic','Bohairic'];
  rows:Array<[surface:string,dialectMask:0|1|2|3]>;
  popularity:Record<string,number>;
  metadata:{spelling_records:number;complete:false;[key:string]:unknown};
}
export interface IndexedForm {
  text:string; key:string; id:string; dialects:0|1|2|3;
  frequency:number; source:'COMPILED-COPTIC'; lexicalIdentityVerified:false;
}
export interface CopticIndex {language:'cop';rows:IndexedForm[];}
export interface CopticSuggestion {
  text:string;raw:boolean;personal:boolean;attested:boolean;
  inLexicon:boolean;lexicalIdentityVerified:false;lexicon_ref:null;
  dialects?:number;frequency?:number;lemma?:null;source?:string;
  record_key?:string|null;
}
export interface PredictionOptions {
  dialect?:CopticDialect;learned?:Record<string,number>;previous?:string;
  limit?:number;includeEditorial?:boolean;includePhrases?:boolean;
  includePersonal?:boolean;balanced?:boolean;
}
export function keyboardKey(input:string,language?:'cop'):string;
export function isInsertableSurface(text:string,options?:{
  includeEditorial?:boolean;includePhrases?:boolean;
}):boolean;
export function keyboardReady(text:string):boolean;
export function prepareKeyboardIndex(language:'cop',pack:{
  rows:CopticCatalog['rows'];popularity?:Record<string,number>;
}):CopticIndex;
export function predictKeyboard(index:CopticIndex,raw:string,
  options?:PredictionOptions):CopticSuggestion[];
export function createCopticKeyboard(pack:{
  rows:CopticCatalog['rows'];popularity?:Record<string,number>;
},options?:{dialect?:CopticDialect;limit?:number}):Readonly<{
  language:'cop';version:2;keys:ReadonlyArray<string>;
  suggest(prefix:string,options?:PredictionOptions):CopticSuggestion[];
}>;
