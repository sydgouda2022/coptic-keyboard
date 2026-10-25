# Standalone application and audit boundaries

The **keyboard** (key layout, UI, edit operations, case/symbol modes,
source-backed prediction, draft and offline installer) is owned here.
Renpet consumes only the stable public source modules and a pinned release.
The hieroglyphic package is not an internal dependency.

The browser app is built by `tools/build_app.py`; the bundled modules live
next to `web/app.mjs` and work under a subpath (GitHub Pages) or at root.
The cache version derives from all app/data asset bytes. The service worker
caches its exact matching app modules and verified lexicon so a completed
installation can reopen offline. Manifest-hash verification is byte integrity,
**not a digital publisher signature**.

The original lexicon is source-pinned and unchanged during the UI refactor.
A real historical source update requires a reviewed rebuild and an explicit
release. The prediction runtime excludes editorial annotations without
mutating any original source row.

Public API compatibility: `src/keyboard_search.mjs` retains
`keyboardKey`, `prepareKeyboardIndex` and `predictKeyboard`, while
`src/coptic_install.mjs` retains `ensureCopticLexicon`. The historical
`attested` boolean means "in the source surface catalog", not manuscript
witness evidence. New interfaces label such records as source-listed.

CI verifies source fingerprints, SQLite integrity, data parity, public API,
dialect isolation, installer recovery, Unicode selection editing, PWA build,
mobile Chromium/WebKit and offline cache/restore. No personal data is migrated
between independent application origins or transmitted to a service.
