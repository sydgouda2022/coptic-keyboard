#!/usr/bin/env python3
"""Reproducibly compile source-pinned Coptic TEI + local pinned word lists.

--check builds in a disposable location and semantically compares canonical
releases. --write validates then publishes all four assets with a durable
rollback journal; --recover restores an interrupted previous generation
without needing network access. The working-tree four-file switch is not
an OS-wide atomic read; consumers must verify manifest and JSON digests.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))
from compile_lexica import build_coptic
from publish_compiled_coptic import publish
from release_transaction import JOURNAL, publish_release, recover_release

TEI_URL=('https://raw.githubusercontent.com/KELLIA/dictionary/'
 'f365e2d239bd12b6897f3a761487e40d384b2b24/xml/'
 'Comprehensive_Coptic_Lexicon-v1.2-2020.xml')
TEI_SHA='ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d'
FORM_SHA='47b0df96d5f45eaab36c48d24ad2c106dc3deabbcbabcdfa0be84923313fa9df'
POPULAR_SHA='94528b7badd35d5b0671302da25385f4a8b75c343c347284f817a0c1a2e6c378'
ASSETS={
 'lexicon.json','lexicon.sqlite3','coverage.json','manifest.json'
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def snapshot(db):
    with sqlite3.connect(f'file:{db.resolve()}?mode=ro',uri=True) as sql:
        if sql.execute('PRAGMA integrity_check').fetchone()[0]!='ok':
            raise ValueError('SQLite corruption')
        rows={}
        for table in ('metadata','lemma','spelling','attestation','prediction_surface'):
            rows[table]=sql.execute('SELECT * FROM '+table+' ORDER BY 1').fetchall()
        return rows

def main():
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument('--check',action='store_true')
    group.add_argument('--write',action='store_true')
    group.add_argument('--recover',action='store_true',help='Recover interrupted publication without network')
    p.add_argument('--tei',type=Path,help='Local pinned TEI, else fetch from pinned public Git commit')
    args=p.parse_args()
    existing=ROOT/'release'
    if args.recover:
        print('Recovered previous complete release' if recover_release(existing)
              else 'No release recovery needed')
        return
    if (existing/JOURNAL).exists():
        if args.check:
            raise RuntimeError('Interrupted release detected: run --recover before --check')
        recover_release(existing)
    forms=ROOT/'sources/seed-word-lists/coptic.json'
    popular=ROOT/'sources/seed-word-lists/coptic-popular.json'
    if sha(forms.read_bytes())!=FORM_SHA or sha(popular.read_bytes())!=POPULAR_SHA:
        raise ValueError('Word source input differs from pinned source edition')
    with tempfile.TemporaryDirectory(prefix='coptic-audit-') as d:
        tmp=Path(d)
        tei=tmp/'source.xml'
        if args.tei:
            tei.write_bytes(args.tei.read_bytes())
        else:
            request=urllib.request.Request(TEI_URL,headers={'User-Agent':'coptic-reproducibility-audit'})
            with urllib.request.urlopen(request,timeout=150) as response:
                tei.write_bytes(response.read())
        if sha(tei.read_bytes())!=TEI_SHA:
            raise ValueError('Unpinned or damaged KELLIA TEI input')
        generated=tmp/'release'
        report=build_coptic(tei,forms,popular,generated)
        manifest=publish(generated)
        if report['unique_written_forms']!=manifest['spelling_records']:
            raise ValueError('Release count inconsistent')
        print('Verified release:',manifest['release'],report['unique_written_forms'],
              'SQLite spellings:',report['sqlite_spelling_records'])
        if args.check:
            for item in ('lexicon.json','coverage.json'):
                if (generated/item).read_bytes()!=(existing/item).read_bytes():
                    raise ValueError(item+' is not reproducible from pinned source')
            if snapshot(generated/'lexicon.sqlite3')!=snapshot(existing/'lexicon.sqlite3'):
                raise ValueError('Published SQLite differs semantically from compiled master')
            expected_manifest=json.loads((existing/'manifest.json').read_text())
            if expected_manifest!=manifest:
                raise ValueError('Published manifest differs from compiled release')
            print('Release matches all pinned sources and semantic master records')
        else:
            publish_release(generated,existing)
            print('Published four validated release assets with rollback journal')

if __name__=='__main__':main()
