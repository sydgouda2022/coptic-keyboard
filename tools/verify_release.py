#!/usr/bin/env python3
"""Read-only checks of canonical Coptic SQLite and its browser projection."""
import hashlib
import json
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
p=root/'release'
manifest=json.loads((p/'manifest.json').read_text())
raw=(p/'lexicon.json').read_bytes()
if manifest.get('language')!='cop' or manifest.get('format')!='coptic-lexicon-install-v1':
    raise ValueError('Wrong release or language')
if (manifest.get('sha256')!=hashlib.sha256(raw).hexdigest()
        or manifest.get('bytes')!=len(raw)):
    raise ValueError('Browser catalog SHA-256 or byte count mismatch')
database=p/'lexicon.sqlite3'
if manifest.get('sqlite_sha256')!=hashlib.sha256(database.read_bytes()).hexdigest():
    raise ValueError('Canonical SQLite fingerprint mismatch')
payload=json.loads(raw)
if (payload.get('format')!='coptic-predict-v1' or
        len(payload.get('rows',[]))!=manifest.get('spelling_records')):
    raise ValueError('Invalid browser catalog')
rows={word:mask for word,mask in payload['rows']}
if len(rows)!=len(payload['rows']):
    raise ValueError('Duplicate browser Coptic form')
with sqlite3.connect(f'file:{database.resolve()}?mode=ro',uri=True) as db:
    if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':
        raise ValueError('Canonical SQLite corrupted')
    if db.execute('PRAGMA foreign_key_check').fetchone():
        raise ValueError('Broken SQLite source relation')
    projected=dict(db.execute('SELECT native_form,dialect_mask FROM prediction_surface'))
    if rows!=projected:
        raise ValueError('Canonical surface/dialect projection does not match browser release')
    dangling=db.execute(
        'SELECT COUNT(*) FROM spelling s WHERE NOT EXISTS'
        '(SELECT 1 FROM attestation a WHERE a.spelling_id=s.id)').fetchone()[0]
    if dangling:
        raise ValueError(f'{dangling} spellings missing recorded source evidence')
    master_count=db.execute('SELECT COUNT(*) FROM spelling').fetchone()[0]
    meta=dict(db.execute('SELECT key,value FROM metadata'))
    sources={item['source']:item['sha256'] for item in payload['metadata']['source_editions']}
    for name, sha in sources.items():
        if meta.get(name)!=sha:
            raise ValueError('Unpinned source evidence: '+name)
coverage=json.loads((p/'coverage.json').read_text())
if (coverage['unique_written_forms']!=len(rows) or
        coverage['sqlite_spelling_records']!=master_count):
    raise ValueError('Released coverage differs from canonical master')
print('Verified Coptic JSON, SHA-256, source evidence, dialect masks and SQLite:',
      len(rows),'surfaces;',master_count,'master records;',manifest['release'])
