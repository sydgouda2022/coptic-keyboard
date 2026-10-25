# Dictionary provenance, redistribution and limitations

The corpus datasets are not application source code. **No blanket code licence
is asserted over the imported third-party corpus**. Preserve the attribution
and licensing terms of the actual pinned source editions before redistribution.

- KELLIA Comprehensive Coptic Lexicon v1.2 (2020), TEI XML, source commit
  `f365e2d239bd12b6897f3a761487e40d384b2b24`, SHA-256
  `ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d`;
  published by KELLIA/DDGLC; check source edition's CC BY-SA notice.
- Coptic SCRIPTORIUM `coptic-nlp` collected orthographic forms, seed inventory
  revision `30e02f9e2d6a64386eaf788ec5d6ccb467daca4b`, pinned hash and
  dialect masks recorded in the SQLite `metadata` table.
- KELLIA Coptic Dictionary Online `supplemental_entries.tab`, source listed in
  `sources/seed-word-lists/coptic-popular.json` with original revision and
  licensing statement. These numbers are *ranking hints*, not a statistically
  representative corpus frequency study.

The source-built `release/lexicon.sqlite3` preserves TEI lemma IDs, individual
form references when available, POS/first English gloss fields, unlinked
corpus indices and source hashes. The smaller `release/lexicon.json` is a
*surface projection* of the same compiler pass, not an export of finalized
SQLite queries; both inventories are cross-checked in `tools/verify_release.py`.

The SQLite master may have more rows than the surface catalog because a single
written surface can relate to multiple entries. Unlinked records deliberately
avoid assigning corpus-only evidence to a potentially incorrect homographic
TEI lemma. They are not proof of distinct meanings or independent witnesses.

Actual insertion excludes editorial annotations and any entries containing
characters other than Coptic/Greek Unicode letters and marks. This affects
usable suggestion counts but does not delete source evidence or change public
manifest hashes. Source-listed does not necessarily mean linguistically sound
in a given sentence. No corpus source is scraped during app execution.

For a reproducible offline build, place the exact pinned TEI edition in a
private directory and use the documented `compile_lexica.py` arguments; the
CI `rebuild_release.sh` fetches this pinned edition, checks its SHA-256 and
verifies that the generated catalog matches the committed release.
