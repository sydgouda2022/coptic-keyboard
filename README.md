# Coptic Keyboard — Headless API

A **headless, Coptic-only** Unicode keyboard/prediction library. No app, user
interface, widget, HTML, CSS, PWA, service worker, IndexedDB, localStorage,
network requests, or background jobs.

This repository owns the reusable **input alphabet, prediction engine, pure
editing operations, lexicon validation, and verified source-data builds**.
Renpet or any other application supplies its own text field, keyboard UI,
storage, fetching, user preferences, and release deployment.

## JavaScript usage

Install from the Git repository using a fixed reviewed commit. The package is
not published to npm (`private: true`) while code/data licensing is being
reviewed. Node.js >= 20; JavaScript modules also run in modern browsers.

```js
import {
  createCopticKeyboard, COPTIC_KEYS, applyKey,
  verifyReleaseBytes
} from '@sydgouda2022/coptic-keyboard';

// Host acquires/loads these bytes, including a caller-TRUSTED manifest.
const catalog = await verifyReleaseBytes(manifest, catalogBytes);
const keyboard = createCopticKeyboard(catalog, { dialect: 'sahidic' });

// Build whatever UI you like from the 32 Coptic letter keys.
console.log(COPTIC_KEYS, keyboard.suggest('ⲡ'));

// Stateless editing; integrate with your editor/undo system.
const next = applyKey('ⲡⲉ', 1, 1, { text: 'ⲁ' });
// next: {value:'ⲡⲁⲉ',caret:2}
```

Pure exports (no side effects on import):

| Entry point | Functions |
| --- | --- |
| `.` | Every public API described below |
| `./prediction` | `COPTIC_KEYS`, `keyboardKey`, `isInsertableSurface`, `prepareKeyboardIndex`, `predictKeyboard`, `createCopticKeyboard` |
| `./editing` | `wordBeforeCaret`, `replaceRange`, `backspaceRange`, `applyKey` |
| `./lexicon` | `validateCatalog`, `validateManifest`, `verifyReleaseBytes` |
| `./data/lexicon.json` | Source-backed compact browser vocabulary |
| `./data/manifest.json` | Source/release SHA-256 manifest |

All entry points have matching TypeScript declarations. The old
`src/keyboard_search.mjs` entry remains as a thin adapter for Renpet's
version-pinned import; it delegates to **the same** core and is not another
prediction implementation.

### Prediction semantics

The standard inventory contains **20,652 distinct Coptic written forms**,
drawn from fixed KELLIA and Coptic SCRIPTORIUM source editions. The canonical
SQLite evidence master holds **22,934 spelling identities**; it is a build and
audit artifact, **not** required by the runtime or shipped in the JS package.
Sahidic/Bohairic dialect flags are source indications, never inferred.
Personal learned strings are caller-owned; they are not asserted as historical
attestations. The legacy `attested` output means only that a form appears in
the compiled source vocabulary, **not** a manuscript witness. Editorial
transcriptions are excluded from ordinary suggestions unless explicitly
requested. This is Unicode prefix completion, not trained morphology,
sentence-grammar generation, or a claim of complete historical coverage.

### Source and runtime integrity

`verifyReleaseBytes(manifest, bytes)` verifies the UTF-8 catalog size,
SHA-256, language, dialect inventory and row counts. The **caller** must pin
or otherwise authenticate the manifest: hashing two mutually untrusted
objects is not a digital signature. The library does no fetching, automatic
updates, user data collection, or browser storage.

## Testing and rebuilding

```sh
npm test
python tools/verify_release.py
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/rebuild_release.py --check
```

The rebuild downloads the **exact pinned original KELLIA TEI** from a fixed
Git commit, SHA-256 checks it, and compares the regenerated JSON, manifest,
SQLite semantic tables and coverage records. `--write` is for an explicitly
reviewed database change. See [source provenance](docs/SOURCES.md) and
[licensing notices](NOTICE.md). Test the packed JS package from a clean
consumer; CI performs that step on each PR.
