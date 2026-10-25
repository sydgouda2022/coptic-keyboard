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
- `release/`: 20,652 *distinct listed written forms* / 22,934 SQLite spelling
  records, including source metadata, counts, browser SHA-256 and canonical SQLite fingerprint.

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

## Reusable programming API and embeddable keyboard

The PWA is an example application. The keyboard is also a **reusable library**
with no dependency on Renpet or the PWA's UI code. Public exports, a typed
contract, a zero-framework embeddable touch keyboard and its opt-in styles are
available from `src/index.mjs`, `types/index.d.mts` and
`styles/keyboard.css`:

```js
import {mountCopticKeyboard,prepareKeyboardIndex,predictKeyboard}
  from './src/index.mjs';
const editor=document.querySelector('textarea');
const keyboard=mountCopticKeyboard({
  target:editor,mount:document.querySelector('#keyboard-container')
});
keyboard.setLexicon(copticCatalog); // verified Coptic release JSON from your app
keyboard.setDialect('sahidic');
keyboard.destroy(); // unmount and clean up listeners
```

```html
<link rel="stylesheet" href="./styles/keyboard.css">
```

The host app owns saved documents, personal usage data, keyboard placement and
its distribution channel. The library never fetches on import or while typing.
`ensureCopticLexicon` is an **optional** separate cache/installer component;
a host may instead supply its own checksum-verified Coptic catalog. Dialect
membership is not invented; editorial source notation is excluded by default.

**API:** `LANGUAGE`, `PREDICTION_API_VERSION`, `keyboardKey`,
`prepareKeyboardIndex`, `predictKeyboard`, `isInsertableSurface`,
`mountCopticKeyboard`, `COPTIC_KEYS`, `ensureCopticLexicon`,
`validateCatalog`, `validateManifest`.

**Package:** `package.json` declares `@sydgouda2022/coptic-keyboard` and
export paths, but deliberately prevents npm publication until the original-code
and dataset redistribution permissions are reviewed. See
[NOTICE.md](NOTICE.md). For a standalone widget example, serve
[examples/index.html](examples/index.html) from the repository root.
