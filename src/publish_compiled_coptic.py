"""Publish a source-backed Coptic browser projection from the canonical SQLite.

A lexicon surface is not a verified individual manuscript witness, and a
source edition is not a claim of historically exhaustive Coptic coverage.
"""
import argparse
import hashlib
import json
import sqlite3
from pathlib import Path


def publish(directory):
    d = Path(directory)
    payload_bytes = (d / 'lexicon.json').read_bytes()
    payload = json.loads(payload_bytes)
    rows = payload.get('rows', [])
    if (payload.get('format') != 'coptic-predict-v1' or
            payload.get('language') != 'cop' or
            payload.get('dialects') != ['Sahidic', 'Bohairic'] or not rows or
            payload.get('metadata', {}).get('complete') is not False or
            payload['metadata'].get('spelling_records') != len(rows)):
        raise ValueError('Invalid Coptic compiled release')
    path = d / 'lexicon.sqlite3'
    if not path.is_file():
        raise FileNotFoundError('Canonical SQLite master is missing')
    with sqlite3.connect(f'file:{path.resolve()}?mode=ro', uri=True) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Canonical SQLite integrity failure')
        db.execute('PRAGMA foreign_keys=ON')
        if db.execute('PRAGMA foreign_key_check').fetchone():
            raise ValueError('Orphan source-evidence records in canonical master')
        surface_rows = db.execute(
            'SELECT native_form,dialect_mask FROM prediction_surface ORDER BY native_form').fetchall()
        if surface_rows != [tuple(r) for r in rows]:
            raise ValueError('Browser lexicon differs from canonical SQLite surface projection')
        for spelling_id, in db.execute(
            'SELECT s.id FROM spelling s LEFT JOIN attestation a '
            'ON a.spelling_id=s.id WHERE a.id IS NULL'):
            raise ValueError('Orphan lexical form: ' + spelling_id)
    catalog_sha = hashlib.sha256(payload_bytes).hexdigest()
    master_sha = hashlib.sha256(path.read_bytes()).hexdigest()
    result = {
        'format':'coptic-lexicon-install-v1', 'language':'cop',
        'dialects':['Sahidic','Bohairic'],
        'release':'coptic-expanded-'+catalog_sha[:16],
        'bytes':len(payload_bytes),'sha256':catalog_sha,
        'sqlite_sha256':master_sha,
        'spelling_records':len(rows),'complete':False
    }
    (d / 'manifest.json').write_text(
        json.dumps(result,sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
    return result


if __name__ == '__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    print(json.dumps(publish(args.out),sort_keys=True))
