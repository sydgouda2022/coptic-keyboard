# Coptic Keyboard — standalone offline PWA

A Coptic Unicode writing surface with an on-screen Coptic keyboard, native
Sahidic/Bohairic dictionary suggestions, uppercase letters, symbol keys,
physical-keyboard input, text editing, selection, copy/paste, undo/redo and
local text export. **This is a complete independent application**, not a
fragment of Renpet. It can be installed on iPhone/iPad and desktop as a PWA.

## Develop and run

```sh
python tools/verify_release.py
node --test tests/*.test.mjs
PYTHONPATH=src python -m unittest discover -s tests -p 'test_*.py'
python tools/build_app.py
python -m http.server 8765 --directory dist
```

Open `http://localhost:8765/` and use **Add to Home Screen** in iOS Safari
or your browser's Install command. Service-worker offline caching works on
HTTPS or localhost. A PWA requires one online installation before offline use.
The app has no remote runtime API and performs no telemetry or sync.

## Independent packages and versioned consumer contract

- `src/keyboard_search.mjs`: the sole public Coptic prefix predictor; exports
  `keyboardKey`, `keyboardReady`, `prepareKeyboardIndex`, `predictKeyboard`.
- `src/coptic_install.mjs`: verified source catalog installer with IndexedDB
  rollback; public exports/manifest format remain compatible with Renpet.
- `src/editor.mjs`: shared pure Unicode editing and selection operations.
- `src/app.mjs`, `web/`: standalone keyboard app and offline PWA.
- `src/compile_lexica.py`: Coptic-only TEI/seed compiler, making canonical
  SQLite source-evidence tables and the matching surface projection.
- `src/publish_compiled_coptic.py`: the **one** supported publisher.
- `release/`: 20,652 *distinct listed written forms* / 38,194 SQLite spelling
  records, including source metadata, counts and SHA-256 release manifest.

Renpet pins this repository by exact Git commit and manifest hash. The public
`keyboard_search` and `coptic_install` contracts are intentionally preserved;
no changes to Renpet's calendar are required for this keyboard app to run.
Consumer automatic updates remain gated by their own app tests and deployment.

## Lexical and privacy limitations

A prediction is **listed in a linguistic source**, not proof of a particular
historical manuscript, a unique lemma, or a valid spelling in every context.
Editorial notations (parentheses, stars, hyphenated fragments, whitespace)
remain in the archival lexicon, but are excluded from single-word keyboard
insertions. In an exact dialect choice, unknown attribution stays excluded.
Coptic historical completeness is **not** claimed. This is deterministic
prefix completion with optional local frequency learning, not morphological or
syntactic next-word AI. The app works for typing even if the dictionary is
unavailable. Drafts and learning stay in browser storage, which users must
back up by **Export .txt** (storage may be cleared by the browser).

Read [Sources & licensing](docs/SOURCES.md) and [Audit/architecture](docs/AUDIT.md).
The historical upstream mixed-project overview is not the runtime contract.
