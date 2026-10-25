#!/usr/bin/env node
/**
 * Full-release, repeatable Node/V8 predictor benchmark. The benchmark is
 * advisory by default; CI enforces generous regression budgets only when
 * COP_BENCH_ENFORCE=1. No network, UI, telemetry or user data.
 *
 * Ranks and suggestions use the exact 20,652-form production catalog.
 * Warm-up precedes measurements to avoid measuring JIT start-up alone.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {prepareKeyboardIndex,preparePersonalIndex,predictKeyboard,COPTIC_KEYS} from '../src/core.mjs';

const catalog=JSON.parse(readFileSync(new URL('../release/lexicon.json',import.meta.url),'utf8'));
const count=catalog.rows.length;
assert.equal(count,20652);
const start=performance.now();
const index=prepareKeyboardIndex('cop',catalog);
const indexingMs=performance.now()-start;
const sample=catalog.rows.filter(([word])=>/^[\p{Script=Coptic}\p{Script=Greek}]/u.test(word))
 .slice(0,1500).map(([word])=>[...word].slice(0,Math.min(3,[...word].length)).join(''));
assert.ok(sample.length>=800);
const learned=Object.fromEntries(catalog.rows.slice(0,1500).map(([word],i)=>['cop:'+word,1+i%17]));
for(let i=0;i<200;i++)predictKeyboard(index,sample[i%sample.length],{learned,limit:5});
const samples=[];
let suggestions=0;
for(let i=0;i<500;i++){
 const prefix=sample[(i*31)%sample.length];
 const t=performance.now();
 const result=predictKeyboard(index,prefix,{learned,limit:6,
  dialect:i%3===0?'sahidic':i%3===1?'bohairic':'all'});
 samples.push(performance.now()-t);
 assert.equal(result[0].text,prefix);
 assert.ok(result.length<=6);
 suggestions+=result.length;
}
// Separate scalability benchmark: 20k caller-owned words, compiled ONCE.
// A legacy learned object remains supported, but is intentionally not used
// in this benchmark because it incurs a whole-map scan on each keystroke.
const largeLearning={};
for(let i=0;i<20000;i++){
 let n=i,word='ⲡ';
 for(let j=0;j<4;j++){word+=COPTIC_KEYS[n%32];n=Math.floor(n/32);}
 largeLearning['cop:'+word]=1+(i%23);
}
const personalStarted=performance.now();
const personalIndex=preparePersonalIndex(largeLearning);
const personalIndexMs=performance.now()-personalStarted;
const personalSamples=[];
for(let i=0;i<100;i++)predictKeyboard(index,'ⲡ'+COPTIC_KEYS[i%32]+COPTIC_KEYS[Math.floor(i/32)%32],{personalIndex,limit:6});
for(let i=0;i<350;i++){
 const prefix='ⲡ'+COPTIC_KEYS[i%32]+COPTIC_KEYS[Math.floor(i/32)%32];
 const now=performance.now();
 const result=predictKeyboard(index,prefix,{personalIndex,limit:6});
 personalSamples.push(performance.now()-now);
 assert.equal(result[0]?.text,prefix);
}
personalSamples.sort((a,b)=>a-b);
const learnedP95=personalSamples[Math.floor((personalSamples.length-1)*.95)];
samples.sort((a,b)=>a-b);
const percentile=q=>samples[Math.min(samples.length-1,Math.floor((samples.length-1)*q))];
const numbers={rows:count,indexing_ms:Number(indexingMs.toFixed(3)),
 median_ms:Number(percentile(.5).toFixed(3)),
 p95_ms:Number(percentile(.95).toFixed(3)),
 p99_ms:Number(percentile(.99).toFixed(3)),
 max_ms:Number(samples.at(-1).toFixed(3)),
 samples:samples.length,mean_options:Number((suggestions/samples.length).toFixed(2)),
 personal_words:Object.keys(learned).length,
 indexed_personal_words:personalIndex.size,
 personal_index_ms:Number(personalIndexMs.toFixed(3)),
 indexed_personal_p95_ms:Number(learnedP95.toFixed(3)),
 node:process.version};
console.log(JSON.stringify(numbers,null,2));
if(process.env.COP_BENCH_ENFORCE==='1'){
 // Wide guardrails intended to detect pathological O(N) regressions,
 // not to assert iPhone or iPad real-device responsiveness from CI.
 assert.ok(indexingMs<4000,'Indexing regression: over four seconds on CI');
 assert.ok(percentile(.95)<150,'Prefix prediction regression: p95 >150ms on CI');
 assert.ok(personalIndexMs<4000,'20k learned-word index regression on CI');
 assert.ok(learnedP95<75,'Indexed 20k learned-word lookup regression on CI');
}
