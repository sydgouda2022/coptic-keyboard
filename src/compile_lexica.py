"""Independent Coptic lexicon compiler. No other language is compiled.
"""
from __future__ import annotations

import argparse

import collections

import hashlib

import json

from pathlib import Path

import re

import sqlite3

import unicodedata

import xml.etree.ElementTree as ET

TEI='{http://www.tei-c.org/ns/1.0}'

XML='{http://www.w3.org/XML/1998/namespace}'

def digest(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda:f.read(1<<20), b''):
            h.update(chunk)
    return h.hexdigest()

def coptic(s):
    return isinstance(s,str) and bool(s) and any(0x2C80<=ord(c)<=0x2CFF or 0x03E2<=ord(c)<=0x03EF or 0x0370<=ord(c)<=0x03FF or 0x1F00<=ord(c)<=0x1FFF for c in s)

def xml_entries(path):
    for _event,el in ET.iterparse(path,events=('end',)):
        if el.tag==TEI+'entry':
            yield el
            el.clear()

def db_connect(path):
    dest=Path(path)
    if dest.exists():raise FileExistsError('Refuse accidental overwrite: '+str(dest))
    dest.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(str(dest))
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA journal_mode=DELETE')
    db.executescript('''
      CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE lemma(id TEXT PRIMARY KEY,headword TEXT,pos TEXT,gloss TEXT);
      CREATE TABLE spelling(id TEXT PRIMARY KEY,lemma_id TEXT NOT NULL REFERENCES lemma(id),
        native_form TEXT NOT NULL,dialect_mask INTEGER NOT NULL DEFAULT 0,
        frequency INTEGER NOT NULL DEFAULT 0,
        UNIQUE(lemma_id,native_form,dialect_mask));
      CREATE TABLE attestation(id TEXT PRIMARY KEY,spelling_id TEXT NOT NULL REFERENCES spelling(id),
        source TEXT NOT NULL,original_ref TEXT NOT NULL,source_sha256 TEXT NOT NULL);
      CREATE INDEX idx_spelling_native ON spelling(native_form);
      CREATE INDEX idx_attestation_word ON attestation(spelling_id);
    ''')
    return db

def persist_json(path, payload):
    Path(path).parent.mkdir(parents=True,exist_ok=True)
    Path(path).write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')

def geo_mask(labels):
    mask=0
    for label in labels:
        x=' '.join(label.split()).upper()
        if x in ('S','SAHIDIC'): mask|=1
        if x in ('B','BOHAIRIC'):mask|=2
    return mask

def coptic_tei_forms(path):
    """Preserve entries' morphology/senses separately from surface prediction."""
    evidence=[]
    stats=collections.Counter()
    for e in xml_entries(path):
        lemma=e.get(XML+'id') or 'unidentified'
        stats['entries']+=1
        pos=e.find('./'+TEI+'gramGrp/'+TEI+'pos')
        gloss=None
        for q in e.findall('.//'+TEI+'sense/'+TEI+'cit'):
            if q.get('type')!='translation':continue
            for de in q:
                if de.get(XML+'lang')=='en' and de.tag in (TEI+'def',TEI+'quote'):
                    gloss=' '.join(''.join(de.itertext()).split())
                    break
            if gloss:break
        for form in e.findall('./'+TEI+'form'):
            fm=form.get(XML+'id','')
            labels=[''.join(x.itertext()) for x in form.findall('./'+TEI+'usg') if x.get('type')=='geo']
            mask=geo_mask(labels)
            for orth in form.findall('./'+TEI+'orth'):
                s=unicodedata.normalize('NFC',''.join(orth.itertext()).strip())
                if not coptic(s):
                    stats['skipped_non_coptic']+=1;continue
                evidence.append((lemma,fm,s,mask,
                                 ''.join(pos.itertext()).strip() if pos is not None else '',gloss or ''))
                stats['written_forms']+=1
    return evidence,stats

def build_coptic(tei_path,forms_path,popular_path,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    core=json.loads(Path(forms_path).read_text(encoding='utf-8'))
    extra=json.loads(Path(popular_path).read_text(encoding='utf-8'))
    if core.get('dialects')!=['Sahidic','Bohairic']:
        raise ValueError('Unknown existing Coptic dialect inventory')
    merger={}
    source_words=set()
    for word,mask in core['rows']:
        if coptic(word) and isinstance(mask,int):
            merger[word]=merger.get(word,0)|mask
            source_words.add(word)
    supplement={}
    for word,n in extra['rows']:
        if coptic(word) and isinstance(n,int) and n>=0:
            merger.setdefault(word,0)
            supplement[word]=max(supplement.get(word,0),n)
    tei_evidence,stats=coptic_tei_forms(tei_path)
    tei_words=set()
    for lemma,form_ref,word,mask,pos,gloss in tei_evidence:
        tei_words.add(word)
        merger[word]=merger.get(word,0)|mask
    db=db_connect(out/'lexicon.sqlite3')
    source_hashes={
        'KELLIA-TEI':digest(tei_path),
        'SCRIPTORIUM-FORMS':digest(forms_path),
        'KELLIA-SUPPLEMENT':digest(popular_path)}
    db.execute('INSERT INTO metadata VALUES (?,?)',('language','cop'))
    for key,value in source_hashes.items():db.execute('INSERT INTO metadata VALUES (?,?)',(key,value))
    lemmas=set(); forms_inserted=set()
    for lemma,form_ref,word,mask,pos,gloss in tei_evidence:
        lid='kellia:'+lemma
        if lid not in lemmas:
            db.execute('INSERT INTO lemma VALUES (?,?,?,?)',(lid,word,pos,gloss))
            lemmas.add(lid)
        # row IDs resolve word+source lemma so homographs can coexist.
        sid='coptic:'+hashlib.sha256((lid+'|'+word).encode()).hexdigest()[:20]
        if sid not in forms_inserted:
            db.execute('INSERT INTO spelling(id,lemma_id,native_form,dialect_mask,frequency) VALUES (?,?,?,?,?)',
                (sid,lid,word,mask,supplement.get(word,0)))
            forms_inserted.add(sid)
        else:
            db.execute('UPDATE spelling SET dialect_mask=(dialect_mask | ?) WHERE id=?',(mask,sid))
        eid=hashlib.sha256((sid+form_ref).encode()).hexdigest()[:24]
        db.execute('INSERT OR IGNORE INTO attestation VALUES (?,?,?,?,?)',
                   (eid,sid,'KELLIA-TEI',lemma+'/'+form_ref,source_hashes['KELLIA-TEI']))
    for word,mask in sorted(merger.items()):
        # Words without matching TEI lemmas remain marked as unlinked, not fabricated.
        lid='unlinked:'+hashlib.sha256(word.encode()).hexdigest()[:20]
        db.execute('INSERT OR IGNORE INTO lemma VALUES (?,?,?,?)',(lid,word,'',''))
        sid='coptic:'+hashlib.sha256((lid+'|'+word).encode()).hexdigest()[:20]
        db.execute('INSERT OR IGNORE INTO spelling(id,lemma_id,native_form,dialect_mask,frequency) VALUES (?,?,?,?,?)',
                   (sid,lid,word,mask,supplement.get(word,0)))
        # The unlinked record preserves corpus-level evidence without pretending
        # to know which distinct homographic TEI lemma the word belongs to.
        sources=[]
        if word in source_words:sources.append('SCRIPTORIUM-FORMS')
        if word in supplement:sources.append('KELLIA-SUPPLEMENT')
        if word in tei_words:sources.append('KELLIA-TEI')
        if not sources:
            raise ValueError('Missing source evidence for Coptic form '+word)
        for source in sources:
            eid=hashlib.sha256((sid+'|'+source).encode()).hexdigest()[:24]
            ref='written-form:'+hashlib.sha256(word.encode('utf-8')).hexdigest()[:20]
            db.execute('INSERT OR IGNORE INTO attestation VALUES (?,?,?,?,?)',
                       (eid,sid,source,ref,source_hashes[source]))
    unreferenced=db.execute('SELECT COUNT(*) FROM spelling s WHERE NOT EXISTS (SELECT 1 FROM attestation a WHERE a.spelling_id=s.id)').fetchone()[0]
    if unreferenced:
        raise ValueError(str(unreferenced)+' Coptic spellings lack per-form source evidence')
    db.commit()
    assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    master_forms=db.execute('SELECT COUNT(*) FROM spelling').fetchone()[0]
    db.close()
    rows=[[word,mask] for word,mask in sorted(merger.items())]
    payload={'format':'coptic-predict-v1','language':'cop','dialects':['Sahidic','Bohairic'],
        'rows':rows,'popularity':dict(sorted(supplement.items())),
        'metadata':{'spelling_records':len(rows),'complete':False,
                    'source_editions':[{'source':k,'sha256':v} for k,v in sorted(source_hashes.items())],
                    'source_tei_lemmas':stats['entries'],
                    'source_tei_forms':stats['written_forms'],
                    'coverage':'all-eligible-downloaded-TEI-forms-not-all-possible-Coptic'}}
    persist_json(out/'lexicon.json',payload)
    report={'language':'cop','unique_written_forms':len(rows),'sqlite_spelling_records':master_forms,
            'tei_lemmas':stats['entries'],'tei_forms':stats['written_forms'],
            'S_only':sum(m==1 for m in merger.values()),
            'B_only':sum(m==2 for m in merger.values()),
            'S_and_B':sum(m==3 for m in merger.values()),
            'dialect_unassigned':sum(m==0 for m in merger.values()),
            'sources':source_hashes,'claim':'Imported full licensed TEI edition; completeness beyond these sources not established'}
    persist_json(out/'coverage.json',report)
    return report

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument('--tei',type=Path,required=True)
    p.add_argument('--forms',type=Path,required=True)
    p.add_argument('--popular',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    print(json.dumps(build_coptic(a.tei,a.forms,a.popular,a.out),sort_keys=True))
