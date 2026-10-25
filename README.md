# Coptic Keyboard — standalone offline writer

An independent installable Coptic Unicode PWA for iPhone, iPad and desktop.
It owns its own on-screen keyboard, physical typing, Sahidic/Bohairic
source-listed suggestions, text editing, selection, copy/paste, undo/redo,
symbols, uppercase letters, local draft and plain-text export. Neither its
UI nor its dictionary depends on Renpet or on Hieroglyphic Keyboard.

## Run locally

```sh
python tools/verify_release.py
node --test tests/keyboard_search.test.mjs tests/isolated_keyboard.test.mjs tests/coptic_install.test.mjs tests/editor.test.mjs
PYTHONPATH=src python -m unittest discover -s tests -p 'test_*.py'
python tools/build_app.py
python -m http.server 8765 --directory dist
```

Open http://localhost:8765/ then install using your browser's PWA command.
On iPhone/iPad use Safari → Share → Add to Home Screen. The PWA works offline
after a successful first installation; browser storage can be cleared, so
export important text for backup. No login, server or telemetry is required.

## Source ownership and compatibility

- `web/` and `src/editor.mjs`: own keyboard UI and Unicode editor.
- `src/keyboard_search.mjs`: **one Coptic-only** predictor, preserving the
  public `keyboardKey`, `prepareKeyboardIndex` and `predictKeyboard` API.
- `src/coptic_install.mjs`: standalone IndexedDB installer with SHA-256
  verification and a previous-verified-release fallback.
- `src/compile_lexica.py`: source-pinned TEI compiler and archival SQLite.
- `src/publish_compiled_coptic.py`: the only supported dictionary publisher.
- `release/`: 20,652 distinct surface strings, 38,194 SQLite spelling rows,
  source evidence and manifest SHA-256.
- `tools/build_app.py`: reproducible installable PWA bundle.
- `tools/rebuild_release.sh`: recompile pinned sources and reject drift.

Renpet consumes the compatible public keyboard module and release data using
its own pinned checksum lock. New keyboard code is not silently reclassified
as a new historical lexicon edition.

A suggestion being **source-listed** does not establish a unique lemma or
a manuscript witness. Editor-only lexicographic notation is excluded from
literal keyboard suggestions but preserved in the canonical dictionary.
No historical completeness or advanced grammatical prediction is claimed.
See [sources and licences](docs/SOURCES.md) and [architecture](docs/AUDIT.md).
