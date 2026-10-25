/** Public Coptic Keyboard contract v1 — Unicode source forms only. */
export const LANGUAGE:'cop';
export const PREDICTION_API_VERSION:1;
export const COPTIC_KEYS:ReadonlyArray<string>;
export type CopticDialect='all'|'sahidic'|'bohairic';
export interface CopticLexicon {
  format:'coptic-predict-v1'; language:'cop';
  dialects:['Sahidic','Bohairic'];
  rows:Array<[surface:string,dialectMask:0|1|2|3]>;
  popularity:Record<string,number>;
  metadata:{spelling_records:number;complete:boolean;[name:string]:unknown};
}
export interface CopticManifest {
  format:'coptic-lexicon-install-v1';language:'cop';
  dialects:['Sahidic','Bohairic']; release:string;bytes:number;
  sha256:string;sqlite_sha256?:string;spelling_records:number;complete:boolean;
}
export interface IndexedForm {
  text:string;key:string;id:string;dialects:0|1|2|3;frequency:number;
  lexicalIdentityVerified:false;source:'COMPILED-COPTIC';
}
export interface CopticIndex {language:'cop'; rows:Array<IndexedForm>;}
export interface Suggestion {
  text:string;raw:boolean;personal:boolean;attested:boolean;
  inLexicon:boolean;dialects?:0|1|2|3;frequency?:number;
  lexicalIdentityVerified:false;source?:string;
  lexicon_ref:null;record_key?:string|null;lemma?:null;
}
export interface PredictionOptions {
  dialect?:CopticDialect;learned?:Record<string,number>;previous?:string;
  limit?:number;includeEditorial?:boolean;includePhrases?:boolean;
  includePersonal?:boolean;balanced?:boolean;
}
export function keyboardKey(value:string, language?:'cop'):string;
export function prepareKeyboardIndex(language:'cop',pack:Pick<CopticLexicon,'rows'> & Partial<CopticLexicon>):CopticIndex;
export function predictKeyboard(index:CopticIndex,input:string,opts?:PredictionOptions):Suggestion[];
export function isInsertableSurface(text:string,opts?:{includeEditorial?:boolean;includePhrases?:boolean}):boolean;
export interface KeyboardController {
  element:HTMLElement;setLexicon(value:CopticLexicon):void;
  setDialect(value:CopticDialect):void;setLearned(value:Record<string,number>):void;
  refresh():void;destroy():void;
}
export function mountCopticKeyboard(options:{
 target:HTMLInputElement|HTMLTextAreaElement;mount?:HTMLElement;
 lexicon?:CopticLexicon|{rows:[]};dialect?:CopticDialect;
 learned?:Record<string,number>;
 onChange?:(info:{value:string;target:HTMLInputElement|HTMLTextAreaElement})=>void;
}):KeyboardController;
export const DB_NAME:string;
export function validateCatalog(catalog:unknown):CopticLexicon;
export function validateManifest(manifest:unknown):CopticManifest;
export function validateSlot(slot:unknown):Promise<{slot:unknown;payload:CopticLexicon}|null>;
export function idbStore(name?:string):unknown;
export interface InstalledLexicon {
  payload:CopticLexicon;bytes:ArrayBuffer;manifest:CopticManifest;
  status:'volatile'|'recovered'|'offline'|'verified';
  complete:boolean;storageError:string|null;updateError:string|null;
}
export function ensureCopticLexiconImpl(options?:{
  store?:unknown;fetcher?:typeof fetch;online?:boolean;timeoutMs?:number
}):Promise<InstalledLexicon>;
export function ensureCopticLexicon(options?:{
  store?:unknown;fetcher?:typeof fetch;online?:boolean;timeoutMs?:number
}):Promise<InstalledLexicon>;
