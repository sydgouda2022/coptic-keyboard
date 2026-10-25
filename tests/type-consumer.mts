import {
 createCopticKeyboard,applyKey,verifyReleaseBytes,COPTIC_KEYS,
 type CopticCatalog,type CopticSuggestion,type CopticManifest
} from '@sydgouda2022/coptic-keyboard';
import {predictKeyboard,prepareKeyboardIndex}
 from '@sydgouda2022/coptic-keyboard/prediction';
import {wordBeforeCaret}
 from '@sydgouda2022/coptic-keyboard/editing';
import {validateManifest}
 from '@sydgouda2022/coptic-keyboard/lexicon';
declare const pack:CopticCatalog;
declare const manifest:CopticManifest;
declare const buffer:ArrayBuffer;
const engine=createCopticKeyboard(pack);
const suggestions:CopticSuggestion[]=engine.suggest('ⲡ');
const ix=prepareKeyboardIndex('cop',pack);
const more=predictKeyboard(ix,'ⲁ');
const after=applyKey('ⲁ',1,1,{text:'ⲃ'});
const range=wordBeforeCaret(after.value,after.caret);
const checked=validateManifest(manifest);
void [suggestions,more,range,checked,COPTIC_KEYS];
void verifyReleaseBytes(manifest,buffer);
