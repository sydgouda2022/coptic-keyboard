# Coptic Keyboard

Standalone, reusable **Coptic Unicode keyboard + predictive lexicon**. It has
one script-scoped prediction implementation, an accessible iPhone/iPad-friendly
touch-keyboard widget, browser-offline lexicon installation, and a documented
JavaScript public API. There are **no Renpet, calendar, hieroglyphic or editor
dependencies**.

> Coptic linguistic inventory, not historically exhaustive: the source-backed
> release includes 20,652 distinct written surfaces from the pinned KELLIA and
> Coptic SCRIPTORIUM inputs. Editorial reconstructions and multiword notation
> remain in the *evidence* catalog, but are not suggested as ordinary keyboard
> text by default. Historical source membership is **not** a manuscript-level
> attestation for every surface. The package is marked private until source-code
> and redistributed corpus licensing are explicitly cleared (see NOTICE.md).

## Embedding the keyboard

Use its public module directly or install this Git repository as a dependency
in a project that is entitled to use the associated sources:

```html
<link rel="stylesheet" href="./styles/keyboard.css" />
<textarea id="coptic-input" lang="cop" aria-label="Coptic text"></textarea>
<div id="keyboard-panel"></div>
<script type="module">
  import {mountCopticKeyboard, ensureCopticLexicon} from './src/index.mjs';
  const keyboard=mountCopticKeyboard({
    target: document.getElementById('coptic-input'),
    mount: document.getElementById('keyboard-panel')
  });
  // Host application must serve the manifest and JSON at /coptic-lexicon/*,
  // or supply an already validated pack from its own release manager.
  try {
    const installed=await ensureCopticLexicon();
    keyboard.setLexicon(installed.payload);
  } catch (err) {
    console.error('Coptic lexicon unavailable; Unicode typing remains usable',err);
  }
  // Call keyboard.destroy() when the embedding view is removed.
</script>
```

The keyboard **never** performs its own network request. The optional installer
uses a separate IndexedDB namespace, verifies SHA-256 before activation,
supports recovery/rollback, and can run in a volatile mode when storage is
unavailable. The host owns all typed documents, learning counters, event
persistence, notifications, keyboard placement and deployment.

## API

```js
import {
  LANGUAGE, PREDICTION_API_VERSION,
  keyboardKey, prepareKeyboardIndex, predictKeyboard,
  isInsertableSurface, mountCopticKeyboard, COPTIC_KEYS,
  validateCatalog, validateManifest, ensureCopticLexicon
} from '@sydgouda2022/coptic-keyboard';
```

- `keyboardKey(text, 'cop')` — normalized **lookup key**, never a replacement
  for the original Unicode string.
- `prepareKeyboardIndex('cop', lexicon)` — validates and indexes the pinned
  source-backed compact catalog once. No on-keystroke whole-dictionary scan.
- `predictKeyboard(index, typedPrefix, options)` — raw input always first;
  options include `dialect`, `learned`, `previous`, `limit`, and opt-ins
  `includeEditorial`, `includePhrases`, `balanced`, `includePersonal`.
  Every suggestion indicates whether it is source-listed or personal.
  `attested` is retained for legacy Renpet compatibility and means
  **present in the compiled source inventory, not witness-proven**.
  `lexicon_ref` is `null` until a verified per-suggestion source ID is
  available; `record_key` is only a local lookup identity.
- `mountCopticKeyboard({target,mount,lexicon,dialect,learned,onChange})` —
  text-only DOM interface supporting grapheme-aware deletion, suggestions,
  Sahidic/Bohairic filtering, Coptic letters, selection-safe insertion and
  responsive touch keys; returns `{element,setLexicon,setDialect,setLearned,
  refresh,destroy}`. No global application state.
- `ensureCopticLexicon()` — separately optional browser installer. The host
  serves `/coptic-lexicon/manifest.json` and `lexicon.json`; it must configure
  PWA precaching/offline routes if offline installation is desired.

The old `src/keyboard_search.mjs` import path and its three functions remain
compatible with the existing Renpet consumer. The `src/_generic_search.mjs`
path is retained only because Renpet's locked updater currently fetches it.
There is no second implementation behind that compatibility wrapper.

For TypeScript, see [types/index.d.mts](types/index.d.mts).
For a runnable zero-framework example, see [examples/index.html](examples/index.html).

## Source build, tests and audit

```sh
npm test
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/rebuild_release.py --check
# Explicitly regenerate after reviewing a source change:
python tools/rebuild_release.py --write
```

The reproducible compiler pins the official KELLIA TEI SHA-256 and the
committed SCRIPTORIUM/KELLIA supplemental word sources. It publishes a
SQLite canonical master with lemma, spelling, attestation and independent
`prediction_surface` tables. The JSON projection is compared **exactly**
against `prediction_surface` before publishing. The master contains a
`sqlite_sha256` in the manifest and all source fingerprints are in the
coverage report. The runtime consumes only the validated JSON projection.

`npm run test` needs Node 20+. `tools/rebuild_release.py --check` needs
Internet access to the **pinned original public source file**; it never
downloads a moving/latest upstream edition. There are no Python install
dependencies. Browser regression uses Playwright in CI.

See [docs/UPSTREAM_SOURCE.md](docs/UPSTREAM_SOURCE.md) for exact versions,
provenance limitations, source rights and what the dictionary does not prove.
