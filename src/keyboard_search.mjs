/** Public Coptic predictor API. Legacy argument signatures remain supported. */
import {keyboardKey as key, prepareKeyboardIndex as prepare, predictKeyboard as predict} from './_generic_search.mjs';
export {isInsertableSurface, LANGUAGE} from './_generic_search.mjs';
export const PREDICTION_API_VERSION = 1;
export function keyboardKey(value, language = 'cop') { return key(value, language); }
export function prepareKeyboardIndex(language, pack) { return prepare(language, pack); }
export function predictKeyboard(index, input, options = {}) { return predict(index, input, options); }
