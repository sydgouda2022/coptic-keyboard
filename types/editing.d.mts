/** Stateless UTF-16 text editing: host owns events, focus and history. */
export interface WordRange {start:number;end:number;raw:string;}
export interface EditResult {value:string;caret:number;}
export interface SelectionRange {start:number;end:number;}
export function wordBeforeCaret(value:string,position:number):WordRange;
export function replaceRange(value:string,start:number,end:number,
  replacement:string):EditResult;
export function backspaceRange(value:string,start:number,end:number):SelectionRange;
export function applyKey(value:string,start:number,end:number,options?:{
  action?:'insert'|'backspace';text?:string;
}):EditResult;
