# Coptic source provenance and reuse limits

This application contains software plus a separately sourced lexicon. No
blanket relicensing of third-party linguistic data is asserted.

The pinned KELLIA Comprehensive Coptic Lexicon v1.2 (2020) TEI file comes
from commit `f365e2d239bd12b6897f3a761487e40d384b2b24` with SHA-256
`ace84fce11b76386a6adb9888b2cb947056954fc9fe9c04aa0676b1f595fd43d`.
Coptic SCRIPTORIUM coptic-nlp Sahidic/Bohairic forms are recorded in
`sources/seed-word-lists/coptic.json` (revision
`30e02f9e2d6a64386eaf788ec5d6ccb467daca4b`).
The KELLIA published supplement is recorded in
`sources/seed-word-lists/coptic-popular.json`. Check their respective
published licence/attribution notices before third-party redistribution.

The SQLite master records TEI lemma IDs, grammatical class, first English
gloss, written spelling, dialect masks and evidence references. The browser
catalog contains only distinct written surfaces, dialect masks and ranking
hints. It is a **projection produced during the same compilation**, not
a direct query against finalized SQLite. The inventories are compared by
`tools/verify_release.py`; historical identities are not assumed identical.

20,652 distinct surfaces are not 20,652 fully analyzed lemmas. 38,194
master spelling records include intentionally unlinked corpus evidence to
avoid imposing a possibly incorrect TEI homograph identity on outside
attestations. That is not proof of 38,194 independent meanings or witnesses.

The interface omits editorial entries from single-word predictions if a
source form contains punctuation, brackets, a leading reconstruction asterisk,
spaces or hyphenation. These remain in the source master. An unassigned dialect
(mask zero) is not classified as either Sahidic or Bohairic automatically.

Ranking frequency values cover only some forms and are not measured
probabilities from an unbiased held-out Coptic text sample. This is a
prefix-completion keyboard, not a morphological or next-word model.
