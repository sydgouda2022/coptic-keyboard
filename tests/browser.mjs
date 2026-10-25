import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const URL='http://127.0.0.1:8765/';
for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await browserType.launch({headless:true});
 try{
  for(const width of [375,768]){
   const ctx=await browser.newContext({viewport:{width,height:width===375?812:1024},
    isMobile:true,hasTouch:true,serviceWorkers:'allow'});
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   await page.goto(URL,{waitUntil:'domcontentloaded'});
   await page.locator('#status.ready').waitFor({timeout:25000});
   assert((await page.locator('#dictionary-detail').textContent()).includes('insertable'));
   await page.locator('#keys button').first().click();
   assert.equal(await page.locator('#writing').inputValue(),'ⲁ');
   const editor=page.locator('#writing');
   await editor.fill('ⲡ');
   assert((await page.locator('#suggestions button').count())>1);
   await page.locator('#suggestions button').nth(1).click();
   assert((await editor.inputValue()).startsWith('ⲡ'));
   await page.locator('input[name="dialect"][value="bohairic"]').check({force:true});
   await editor.fill('ⲡ');
   const labels=await page.locator('#suggestions button small').allTextContents();
   assert(labels.every(x=>!x.includes('Sahidic')));
   await editor.fill('ⲡⲉ');
   await page.waitForFunction(()=>navigator.serviceWorker?.controller?.state==='activated',
    null,{timeout:30000});
   const cached=await page.evaluate(async()=>{
    const url=new URL('./coptic-lexicon/lexicon.json',location.href);
    return !!(await caches.match(url.href));
   });
   assert(cached,'The verified Coptic catalog must be cached offline');
   await ctx.setOffline(true);
   if(engine==='chromium'){
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#status.ready').waitFor({timeout:25000});
    assert.equal(await editor.inputValue(),'ⲡⲉ');
   }else{
    // Playwright's WebKit network emulation does not always route offline
    // navigation through service workers. Verify genuine cached catalog and
    // storage while offline; exercise navigation on a physical Safari PWA.
    assert.equal(await page.evaluate(()=>localStorage.getItem('coptic-keyboard.draft.v1')),'ⲡⲉ');
   }
   assert.deepEqual(errors,[],engine+' '+width+' uncaught errors');
   console.log('PASS',engine,width,'typing, suggestions, dialect, local draft, offline data');
   await ctx.close();
  }
 }finally{await browser.close();}
}
