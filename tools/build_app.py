#!/usr/bin/env python3
"""Build an installable, self-contained Coptic PWA without network or mutation
of the canonical source-backed dictionary. Relative URLs support subpath hosts.
"""
import hashlib
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'dist'
def main():
    m=json.loads((ROOT/'release/manifest.json').read_text())
    source=(ROOT/'release/lexicon.json').read_bytes()
    if m['language']!='cop' or m['sha256']!=hashlib.sha256(source).hexdigest() or len(source)!=m['bytes']:
        raise ValueError('Refuse to bundle an unverified Coptic catalog')
    if DEST.exists():shutil.rmtree(DEST)
    shutil.copytree(ROOT/'web',DEST)
    files={
        'src/editor.mjs':'editor.mjs',
        'src/keyboard_search.mjs':'keyboard-search.mjs',
        'src/_generic_search.mjs':'_generic_search.mjs',
        'src/coptic_install.mjs':'coptic-install.mjs',
        'release/lexicon.json':'coptic-lexicon/lexicon.json',
        'release/manifest.json':'coptic-lexicon/manifest.json',
        'release/coverage.json':'coptic-lexicon/coverage.json',
    }
    for source,destination in files.items():
        target=DEST/destination
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(ROOT/source,target)
    h=hashlib.sha256()
    for item in sorted(DEST.rglob('*')):
        if item.is_file() and item.name!='sw.js':
            h.update(str(item.relative_to(DEST)).encode())
            h.update(item.read_bytes())
    sw=DEST/'sw.js'
    sw.write_text(sw.read_text().replace('coptic-keyboard-v1','coptic-keyboard-'+h.hexdigest()[:16]))
    (DEST/'build-info.json').write_text(json.dumps({
        'catalog_release':m['release'],'catalog_sha256':m['sha256'],'assets_sha256':h.hexdigest()
    },indent=2)+'\n')
    print('Standalone Coptic PWA built:',m['release'],h.hexdigest()[:16])
if __name__=='__main__':main()
