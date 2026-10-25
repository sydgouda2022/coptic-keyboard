# Source rights and attribution

This project contains an independently built Coptic input and prediction engine
plus Coptic word-form inventories derived from the following attributed sources:

- KELLIA Comprehensive Coptic Lexicon v1.2 (2020); see the exact XML edition
  identifier and SHA-256 in `release/coverage.json`.
- Coptic SCRIPTORIUM coptic-nlp word inventory, with source commit recorded in
  `sources/seed-word-lists/coptic.json`.
- KELLIA supplemental_entries word-ranking hints, referenced in
  `sources/seed-word-lists/coptic-popular.json`.

The corpus resources and any derived redistribution must comply with each
upstream license, attribution and share-alike obligations. Do not mistake the
MIT-style package API for an assertion that the lexicon is unrestricted.

**Original engine source licensing has not been granted in this repository.**
No blanket project license is inferred. The package is marked `private: true`
to prevent accidental publication to npm pending a separate rights review.
The public programming API remains usable by the owner's other projects
through the Git repository. The published JSON has incomplete historical
coverage and does not itself prove individual-manuscript attestations.
