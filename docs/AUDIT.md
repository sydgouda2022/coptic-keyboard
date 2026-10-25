# Standalone architecture and audit

**Independent ownership:** All writing UI, key layouts, Unicode editor
operations, prediction algorithm, catalog installer, build and tests live here.
Renpet consumes a stable public contract; it is no longer the source of this
app's keyboard UI. The hieroglyphic keyboard is not imported in this repo.

### Runtime flow

1. `web/index.html` loads `src/app.mjs` (bundled into `dist/app.mjs`).
2. `src/coptic_install.mjs` validates a pinned catalog with SHA-256 on every
   load and restores a prior verified copy if its active copy is corrupt.
3. `keyboard_search.mjs` builds a sorted in-memory Coptic-only prefix index.
4. Editorial dictionary notations are filtered for keyboard insertion but
   retained in the published lexicographic source master.
5. The editor operates on UTF-16 selection offsets, with grapheme-aware
   backspace, and saves draft and learning locally (no backend).
6. The service worker precaches all app modules and the verified catalog so
   offline installation works after the first visit.

### Audit gates

- Full JS tests (public API, script isolation, dialect masks, editorial forms,
  Unicode editor and installer corruption / rollback).
- Full Python compiler tests, `PRAGMA integrity_check`, source hashes and
  SQLite-to-JSON written-form/dialect parity.
- Pinned TEI rebuild and committed manifest digest comparison. Any changed
  source requires an intentionally reviewed new release.
- Deterministic self-contained PWA bundle, generated versioned SW cache.
- Chromium + WebKit browser test on iPhone and iPad viewport sizes: typing,
  Coptic characters, dictionary integration, edit/paste/export and offline
  reload after service worker activation.

### Compatibility

The original Renpet integration needs the stable exports of
`src/coptic_install.mjs`, `src/keyboard_search.mjs`, and
`src/_generic_search.mjs` plus `release/` assets. These paths are retained.
The `legacy "attested"` boolean indicates source-list membership, NOT
source-specific manuscript evidence. New UI labels use “Source-listed”.
The monorepo publisher and second `predict.mjs` contract were retired; the
single supported canonical publisher is `publish_compiled_coptic.py`.

### Explicit exclusions

No claims of comprehensive Coptic morphology, phonology, contextual grammar,
or verified dialect for the unassigned 1,007 forms. No automatic transfer of
private user data between independent browser origins; copying raw browser
storage would be unsafe. A user can manually export plain text instead.
