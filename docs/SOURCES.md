# Coptic lexicon evidence and reproducibility

The source-backed releases are created from exactly these pinned inputs:

- **KELLIA Comprehensive Coptic Lexicon v1.2 (2020)**, TEI XML at commit
  `f365e2d239bd12b6897f3a761487e40d384b2b24`;
  SHA-256 `ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d`.
- **Coptic SCRIPTORIUM** orthographic seed list, revision
  `30e02f9e2d6a64386eaf788ec5d6ccb467daca4b`;
  `sources/seed-word-lists/coptic.json` SHA-256
  `47b0df96d5f45eaab36c48d24ad2c106dc3deabbcbabcdfa0be84923313fa9df`.
- **KELLIA** supplementary popularity-hint source,
  `sources/seed-word-lists/coptic-popular.json` SHA-256
  `94528b7badd35d5b0671302da25385f4a8b75c343c347284f817a0c1a2e6c378`.

All source fingerprints are recorded in the SQLite master and released
catalog metadata. `release/lexicon.sqlite3` contains source lemma IDs, source
spellings, referenced source records, and an independent
`prediction_surface` table matching the browser catalog exactly.
`release/lexicon.json` contains 20,652 distinct written surfaces;
the canonical SQLite master contains 22,934 spelling identity records.
Homographs can share a surface without sharing a lemma.

Not every source spelling has a proven individual manuscript witness. The
public runtime does **not** export TEI lemma references for each suggestion.
The compiler retains only selected POS/gloss evidence and does not preserve
every semantic sense or complete inflectional paradigm. The source dialect
labels are Sahidic/Bohairic only, and 1,007 surfaces have neither assignment;
an unassigned mask is not evidence of historical absence. Popularity values
are limited ranking hints, not a statistically representative frequency corpus.
Dictionary notations with punctuation or multiple words are preserved in
source data but excluded from ordinary Unicode word insertion.

Run `python tools/rebuild_release.py --check` to compile the fixed inputs
into a temporary directory and compare the published release. The compiler
produces all canonical artifacts without loading or altering user data.
Run `python tools/verify_release.py` for a purely local release audit.

Respect any KELLIA / Coptic SCRIPTORIUM source attribution, share-alike,
or redistribution obligations applicable to the exact source edition.
Code and dataset rights are distinct; see `NOTICE.md`.
