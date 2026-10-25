# Coptic Keyboard API v2 — stabilization contract

The published runtime consists of **pure functions only**: input inventory,
Coptic prefix ranking, stateless UTF-16 editing, source-catalog validation and
SHA-256 checking. No DOM, network access, storage or worker code is permitted
in its public entry points. The example UI and all app-specific persistence
belong to consumers such as Renpet.

## Frozen v2 programming surface

The entry-point names, exported symbol sets and suggestion field shapes are
covered by `tests/public-contract.test.mjs`. Public imports are:

- `@sydgouda2022/coptic-keyboard` — complete headless API
- `@sydgouda2022/coptic-keyboard/prediction` — Coptic predictor and 32 keys
- `@sydgouda2022/coptic-keyboard/editing` — UTF-16 stateless text editing
- `@sydgouda2022/coptic-keyboard/lexicon` — catalog validation and checking
- `@sydgouda2022/coptic-keyboard/data/{lexicon,manifest}.json` — immutable release data

The `src/keyboard_search.mjs` compatibility entry continues to expose the
existing Renpet calls and delegates to the same implementation. It must not
grow a competing prediction engine.

Package version `2.0.0` is the **API compatibility version**; the
`PREDICTION_API_VERSION` export is `2`. Neither should change for test-only,
documentation or internal performance improvements.

## Compatibility policy

- **Patch**: correct internal defects with no change to accepted public inputs
  or the shape/meaning of returned records. Tests must include the countercase.
- **Minor**: add optional capabilities while preserving defaults, public
  exports, return fields and insertion semantics. Expand contract tests.
- **Major**: remove/rename public exports, change defaults, reject previously
  documented valid input, change return shapes, or intentionally change the
  source-attribution meaning of the legacy `attested` field.
- Consumers pin an **exact reviewed commit** and verify the **lexicon SHA-256**.
  A successful build of this repository is not a guarantee that Renpet or
  another editor is compatible; consumers must run their own integration tests.
- The `release` string and hash identify **catalog bytes**. The manifest's
  `sqlite_sha256` separately identifies the canonical audit database. Neither
  is a substitute for a trusted publisher or package version.

## Unicode/editor contract

All start/end/caret offsets are **UTF-16 code units**, compatible with
`HTMLInputElement.selectionStart`. Functions operate on text strings only.
Splitting a UTF-16 surrogate pair is rejected with `RangeError`.
`backspaceRange` uses `Intl.Segmenter` when available so a Coptic base
character and its combining supralinear marks are removed as one grapheme.
The fallback conservatively groups combining marks and joiner sequences,
but real editing hosts should expose `Intl.Segmenter` for full UAX #29
grapheme behavior. The headless library intentionally does not synthesize
`beforeinput`, `input`, undo histories, focus events or IME composition.

Input text is **never normalized for insertion**. `keyboardKey` normalizes
lookup keys only. Source-listed forms are not proof of unique TEI lemmas or
manuscript-level attestations.

## Verification

```sh
npm test
node tools/benchmark.mjs
COP_BENCH_ENFORCE=1 node tools/benchmark.mjs
python tools/verify_release.py
python tools/rebuild_release.py --check
```

The benchmark uses all **20,652** production written forms, a deterministic
1,500-entry learned map, warmup, and 500 prefix queries, reporting median,
p95 and p99. CI's wide upper bounds detect catastrophic regressions on hosted
Linux: indexing under 4,000 ms, p95 prefix prediction under 150 ms.
**These are not iPhone/iPad performance guarantees**, and the benchmark
does not constitute a corpus-wide linguistic accuracy metric. Consumer
applications should measure user-visible latency on target devices.

Node 20, 22 and 24 run the Unicode, property and public-contract tests.
CI also builds a package archive, installs it into a clean project and
type-checks actual TypeScript imports. No npm publication is performed:
the package remains `private:true` pending a source/data rights review.

### Downstream acceptance

Renpet's independently pinned Coptic dependency must retain:
`src/keyboard_search.mjs`, `src/core.mjs`,
`release/manifest.json` and `release/lexicon.json`.
Renpet owns the browser-side `web/coptic-install.mjs` and UI; it must not
import code from this library's removed PWA. Renpet's CI and mobile browser
acceptance must pass when changing the locked source commit.
