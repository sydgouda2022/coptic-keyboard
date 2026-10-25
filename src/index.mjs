/**
 * @packageDocumentation Coptic-only Unicode keyboard, offline prediction and
 * independent DOM widget; no calendar/editor or network dependency at import.
 * Use '@sydgouda2022/coptic-keyboard/styles.css' for the optional visual keyboard.
 */
export {
  LANGUAGE, PREDICTION_API_VERSION, keyboardKey, prepareKeyboardIndex,
  predictKeyboard, isInsertableSurface
} from './keyboard_search.mjs';
export {mountCopticKeyboard, COPTIC_KEYS} from './keyboard.mjs';
export {
  ensureCopticLexicon, ensureCopticLexiconImpl, validateCatalog,
  validateManifest, validateSlot, idbStore, DB_NAME
} from './coptic_install.mjs';
