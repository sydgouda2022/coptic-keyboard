#!/usr/bin/env python3
"""Build a self-contained offline Coptic PWA from reviewed source/release.

No external dependencies or network; the canonical lexicon is never rewritten.
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'dist'

def main():
    manifest=json.loads((ROOT/'release/manifest.json').read_text())
    original=(ROOT/'release/lexicon.json').read_bytes()
    if hashlib.sha256(original).hexdigest()!=manifest['sha256']:
        raise RuntimeError('Refusing to bundle unverified Coptic dictionary')
    if manifest['language']!='cop' or len(original)!=manifest['bytes']:
        raise RuntimeError('Wrong dictionary manifest')
    if DEST.exists():shutil.rmtree(DEST)
    shutil.copytree(ROOT/'web',DEST)
    for src,dest in {'src/app.mjs':'app.mjs','src/editor.mjs':'editor.mjs',
      'src/keyboard_search.mjs':'keyboard-search.mjs',
      'src/_generic_search.mjs':'_generic_search.mjs',
      'src/coptic_install.mjs':'coptic-install.mjs',
      'release/lexicon.json':'coptic-lexicon/lexicon.json',
      'release/manifest.json':'coptic-lexicon/manifest.json',
      'release/coverage.json':'coptic-lexicon/coverage.json'}.items():
        target=DEST/dest
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(ROOT/src,target)
    # Bump the service-worker version for every changed app asset or dictionary;
    # never leave an installed PWA stuck on an earlier immutable cache name.
    h=hashlib.sha256()
    for p in sorted(DEST.rglob('*')):
        if p.is_file() and p.name!='sw.js':
            h.update(str(p.relative_to(DEST)).encode())
            h.update(p.read_bytes())
    service=DEST/'sw.js'
    sw=service.read_text().replace('coptic-keyboard-v1', 'coptic-keyboard-'+h.hexdigest()[:16])
    service.write_text(sw)
    with open(DEST/'build-info.json','w',encoding='utf8') as f:
        json.dump({'catalog_sha256':manifest['sha256'],'assets_sha256':h.hexdigest(),
                  'catalog_release':manifest['release']},f,indent=2)
    print('Built standalone Coptic PWA:',DEST, 'release:',manifest['release'])
if __name__=='__main__':main()
