#!/usr/bin/env python3
"""Read-only SQLite / browser catalog parity and provenance integrity audit."""
import hashlib,json,sqlite3
from pathlib import Path
folder=Path(__file__).resolve().parents[1]/'release'
m=json.loads((folder/'manifest.json').read_text())
blob=(folder/'lexicon.json').read_bytes()
if m['format']!='coptic-lexicon-install-v1' or m['language']!='cop':
 raise ValueError('Wrong lexicon schema')
if m['sha256']!=hashlib.sha256(blob).hexdigest() or m['bytes']!=len(blob):
 raise ValueError('Lexicon checksum mismatch')
data=json.loads(blob)
if data['format']!='coptic-predict-v1' or len(data['rows'])!=m['spelling_records']:
 raise ValueError('Wrong catalog row count or schema')
browser=dict(data['rows'])
if len(browser)!=len(data['rows']):raise ValueError('Duplicate public surface')
with sqlite3.connect(f'file:{folder/"lexicon.sqlite3"}?mode=ro',uri=True) as db:
 if db.execute('pragma integrity_check').fetchone()[0]!='ok':raise ValueError('Damaged SQLite master')
 master={}
 for word,mask in db.execute('SELECT native_form,dialect_mask FROM spelling'):
  master[word]=master.get(word,0)|mask
 if master!=browser:raise ValueError('SQLite and JSON spelling or dialect drift')
 dangling=db.execute('SELECT count(*) FROM spelling s WHERE NOT EXISTS (SELECT 1 FROM attestation a WHERE a.spelling_id=s.id)').fetchone()[0]
 if dangling:raise ValueError('Spelling rows without evidence: '+str(dangling))
 sources=dict(db.execute('SELECT key,value FROM metadata'))
 for x in data['metadata']['source_editions']:
  if sources.get(x['source'])!=x['sha256']:raise ValueError('Source SHA mismatch: '+x['source'])
 spellings=db.execute('SELECT count(*) FROM spelling').fetchone()[0]
print('Verified',len(browser),'Coptic surfaces;',spellings,'source-backed SQLite spellings')
