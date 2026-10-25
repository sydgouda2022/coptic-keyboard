import type {CopticCatalog} from './prediction.mjs';
export interface CopticManifest {
  format:'coptic-lexicon-install-v1';language:'cop';
  dialects:['Sahidic','Bohairic'];release:string;bytes:number;
  sha256:string;sqlite_sha256?:string;spelling_records:number;complete:false;
}
export function validateCatalog(catalog:unknown):CopticCatalog;
export function validateManifest(manifest:unknown):CopticManifest;
/** Verifies SHA-256 against the given caller-trusted manifest; performs no I/O. */
export function verifyReleaseBytes(
  manifest:CopticManifest,bytes:ArrayBuffer|ArrayBufferView
):Promise<CopticCatalog>;
