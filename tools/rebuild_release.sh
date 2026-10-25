#!/usr/bin/env bash
# Reproducible standalone Coptic lexicon build; source files are single-use.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
curl -fLsS --retry 3 'https://raw.githubusercontent.com/KELLIA/dictionary/f365e2d239bd12b6897f3a761487e40d384b2b24/xml/Comprehensive_Coptic_Lexicon-v1.2-2020.xml' -o "$tmp/coptic.xml"
echo 'ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d  '"$tmp/coptic.xml" | sha256sum -c -
python src/compile_lexica.py --tei "$tmp/coptic.xml" --forms sources/seed-word-lists/coptic.json --popular sources/seed-word-lists/coptic-popular.json --out "$tmp/out"
python src/publish_compiled_coptic.py --out "$tmp/out"
python - "$tmp/out" <<'PY_CHECK'
import sys,json,hashlib
from pathlib import Path
out=Path(sys.argv[1]);m=json.loads((out/'manifest.json').read_text())
assert m['spelling_records']==20652
assert hashlib.sha256((out/'lexicon.json').read_bytes()).hexdigest()==m['sha256']
assert m['sha256']==json.loads(Path('release/manifest.json').read_text())['sha256'],'Unexpected lexicon drift; require versioned source review'
PY_CHECK
# Comparison is read-only in CI; a new release needs explicit review.
if [ "${REBUILD_WRITE:-0}" = "1" ]; then
 cp "$tmp/out/lexicon.json" "$tmp/out/manifest.json" "$tmp/out/coverage.json" "$tmp/out/lexicon.sqlite3" release/
else
 cmp "$tmp/out/lexicon.json" release/lexicon.json
 cmp "$tmp/out/manifest.json" release/manifest.json
 cmp "$tmp/out/coverage.json" release/coverage.json
fi
python tools/verify_release.py
