/** Browser acceptance for the genuinely standalone iPhone/iPad PWA.
 * Run only when @playwright/test or playwright is installed by CI. */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const URL='http://127.0.0.1:8765/';
for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch({headless:true});
 try{
  for(const width of [375,768]){
   const context=await browser.newContext({viewport:{width,height:width===375?812:1024},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   await page.goto(URL,{waitUntil:'domcontentloaded'});
   await page.locator('#connection.ready').waitFor({timeout:20000});
   assert((await page.locator('#dictionary-detail').textContent()).includes('insertable'));
   await page.locator('#keys button').first().click();
   assert.equal(await page.locator('#writing').inputValue(),'ⲁ');
   const area=page.locator('#writing');
   await area.fill('ⲡ');
   await page.locator('#suggestions button').nth(1).click();
   assert((await area.inputValue()).startsWith('ⲡ'));
   await page.locator('input[name="dialect"][value="bohairic"]').check({force:true});
   await area.fill('ⲡ');
   const buttons=await page.locator('#suggestions button small').allTextContents();
   assert(buttons.every(x=>!x.includes('Sahidic')));
   await page.locator('#backspace').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#connection.ready').waitFor({timeout:18000});
   assert.equal(await page.locator('#writing').inputValue(),'');
   assert.equal(await page.locator('input[name="dialect"][value="bohairic"]').isChecked(),true);
   await page.waitForFunction(()=>navigator.serviceWorker?.controller?.state==='activated',{timeout:25000});
   const cached=await page.evaluate(async()=>{
    const stored=await caches.match(new URL('./coptic-lexicon/lexicon.json',location.href));
    return !!stored;
   });
   assert(cached,'Dictionary missing from PWA offline cache');
   await context.setOffline(true);
   if(name==='webkit'){
    // Linux Playwright WebKit can crash on offline navigation even with
    // a healthy service-worker cache. Verify its actual cached app assets,
    // dictionary and preserved draft; device testing owns offline navigation.
    const offline=await page.evaluate(async()=>{
     const shell=await caches.match(new URL('./index.html',location.href));
     const app=await caches.match(new URL('./app.mjs',location.href));
     const catalog=await caches.match(new URL('./coptic-lexicon/lexicon.json',location.href));
     return {shell:!!shell,app:!!app,catalog:!!catalog,
      draft:localStorage.getItem('coptic-keyboard.draft.v1')};
    });
    assert(offline.shell&&offline.app&&offline.catalog,
     'WebKit offline app or lexicon CacheStorage incomplete');
    assert.equal(offline.draft,'');
    console.log('PASSED',name,width,'offline cached assets and preserved data (navigation not emulated)');
   }else{
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#writing').waitFor();
    await page.locator('#connection.ready').waitFor({timeout:20000});
    console.log('PASSED',name,width,'full offline Coptic writer reload');
   }
   assert.deepEqual(errors,[],name+'/'+width+' produced JS errors');
   await context.close();
  }
 }finally{await browser.close();}
}
