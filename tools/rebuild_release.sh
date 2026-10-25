#!/usr/bin/env bash
# Rebuild pinned KELLIA source and compare read-only against published release.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fLsS --retry 3 --max-time 150 'https://raw.githubusercontent.com/KELLIA/dictionary/f365e2d239bd12b6897f3a761487e40d384b2b24/xml/Comprehensive_Coptic_Lexicon-v1.2-2020.xml' -o "$tmp/coptic.xml"
echo 'ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d  '"$tmp/coptic.xml" | sha256sum -c -
python src/compile_lexica.py --tei "$tmp/coptic.xml" --forms sources/seed-word-lists/coptic.json --popular sources/seed-word-lists/coptic-popular.json --out "$tmp/out"
python src/publish_compiled_coptic.py --out "$tmp/out"
cmp "$tmp/out/lexicon.json" release/lexicon.json
cmp "$tmp/out/manifest.json" release/manifest.json
cmp "$tmp/out/coverage.json" release/coverage.json
python tools/verify_release.py
echo 'Original KELLIA/Scriptorium source release reproduced without changes.'
