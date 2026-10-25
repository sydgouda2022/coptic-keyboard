#!/usr/bin/env python3
"""Read-only integrity and semantic parity checks for the Coptic source master."""
import hashlib,json,sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'release'
m=json.loads((p/'manifest.json').read_text())
raw=(p/'lexicon.json').read_bytes()
if m['language']!='cop' or m['format']!='coptic-lexicon-install-v1':raise ValueError('Wrong release')
if m['sha256']!=hashlib.sha256(raw).hexdigest() or m['bytes']!=len(raw):raise ValueError('Catalog hash/byte count mismatch')
data=json.loads(raw)
if data['format']!='coptic-predict-v1' or len(data['rows'])!=m['spelling_records']:raise ValueError('Wrong catalog metadata')
rows={word:mask for word,mask in data['rows']}
if len(rows)!=len(data['rows']):raise ValueError('Duplicate surface in public catalog')
with sqlite3.connect(f'file:{p/"lexicon.sqlite3"}?mode=ro',uri=True) as db:
    if db.execute('pragma integrity_check').fetchone()[0]!='ok':raise ValueError('Invalid source DB')
    db_rows={}
    for word,mask in db.execute('select native_form,dialect_mask from spelling'):
        db_rows[word]=db_rows.get(word,0)|mask
    if db_rows!=rows:raise ValueError('SQLite and browser spelling inventories differ')
    masters=db.execute('select count(*) from spelling').fetchone()[0]
    dangling=db.execute('select count(*) from spelling s where not exists(select 1 from attestation a where a.spelling_id=s.id)').fetchone()[0]
    if dangling:raise ValueError(f'Missing source evidence for {dangling} records')
    source_hashes=dict(db.execute('select key,value from metadata'))
    expected={x['source']:x['sha256'] for x in data['metadata']['source_editions']}
    for label,digest in expected.items():
        if source_hashes.get(label)!=digest:raise ValueError('Source hash drift: '+label)
print('Verified',len(rows),'unique Coptic surfaces;',masters,'master spellings; release',m['release'])
