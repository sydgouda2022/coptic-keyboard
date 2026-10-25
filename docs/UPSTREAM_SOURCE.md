# Coptic dictionary — audit and provenance

This document describes this **Coptic repository only**. The historical mixed
Coptic/Hieroglyphic architecture from `aaa` has been retired. No Egyptian
sign compiler or application Cloudflare deployment lives here.

## Source editions

- KELLIA Comprehensive Coptic Lexicon v1.2 (2020), TEI XML file at Git commit
  `f365e2d239bd12b6897f3a761487e40d384b2b24`.
  Required SHA-256:
  `ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d`.
- Coptic SCRIPTORIUM `coptic-nlp` forms at revision
  `30e02f9e2d6a64386eaf788ec5d6ccb467daca4b`, vendored as
  `sources/seed-word-lists/coptic.json` with pinned hash
  `47b0df96d5f45eaab36c48d24ad2c106dc3deabbcbabcdfa0be84923313fa9df`.
- KELLIA `supplemental_entries.tab` popularity hints, vendored as
  `sources/seed-word-lists/coptic-popular.json`, pinned SHA-256
  `94528b7badd35d5b0671302da25385f4a8b75c343c347284f817a0c1a2e6c378`.

These sources are listed with edition-level checksums. The original TEI is not
checked into this repository; the pinned public Git file is re-downloaded at
build time. No user document, local learned text or web history is ingested.

## Rebuild

```sh
python tools/rebuild_release.py --check
python tools/rebuild_release.py --write
```

The build checks source checksums, compiles in a temporary directory, verifies
SQLite foreign keys and integrity, compares all JSON dictionary surfaces and
dialect masks with the canonical `prediction_surface` table, and writes a
deterministic manifest. A `--check` run verifies the current releases without
changing tracked files.

The source preservation semantics are deliberately narrow:
- TEI `lemma` and `spelling` rows identify *source dictionary entries*, not
  independent dated manuscript occurrences.
- A form without a TEI lemma has an explicit `unlinked:` record. A form
  already linked to one or several TEI lemmas does **not** create a second
  fabricated unlinked lemma. Homographic TEI lemmas remain distinct.
- The `prediction_surface` table is the authoritative merged written-form
  inventory, including SCRIPTORIUM's source-level dialect evidence, popularity
  hints and editorial-notation flag.
- Browser JSON is compact for offline use and does not embed the complete TEI
  source graph. Runtime `attested` means source-listed only; it is not a
  stronger claim of a per-witness citation.
- The compiler retains one POS and the first English gloss, **not** complete
  TEI morphology, every sense or all inflectional paradigms.
- `complete:false` means the imported editions are not proof of exhaustive
  Coptic lexical or dialect coverage. Bohairic/Sahidic masks may be unassigned;
  absence of assignment must not be interpreted as historical non-use.

Editorial spellings (`*...`, bracket variants, multigram expressions) are
preserved as documentation, but the public predictor excludes them from
ordinary keyboard insertion. The caller must opt in to research-only
`includeEditorial` or `includePhrases`. Their presence in the source list
does not prove the literal editorial punctuation was written by a scribe.

## Known limitations

This is Unicode prefix completion, not trained morphological segmentation,
next-word syntax prediction or a contextually disambiguated lemma engine.
Personal learning is caller-owned. Ranking weights use a limited supplement
frequency list, not a validated large representative corpus.

Source redistribution is subject to each upstream license, attribution and
share-alike condition. See NOTICE.md before copying the database into any
public product or releasing an npm package. Hashing alone does not confer
copyright permission or authenticate the publisher's signature.
