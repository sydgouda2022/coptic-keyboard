const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
    const browser=await engine.launch({headless:true});
    try {
      for(const width of [375,768]) {
        const page=await browser.newPage({viewport:{width,height:800},isMobile:true,hasTouch:true});
        try{
          await page.goto('http://127.0.0.1:8129/examples/index.html');
          await page.locator('#status').getByText('Source-compiled').waitFor({timeout:30000});
          assert.equal(await page.locator('.coptic-kb-key').count(),32);
          await page.locator('#sample').fill('ⲡ');
          await page.locator('.coptic-kb-suggestion').first().waitFor();
          const expected=await page.locator('.coptic-kb-suggestion').first().innerText();
          await page.locator('.coptic-kb-suggestion').first().click();
          assert.equal(await page.locator('#sample').inputValue(),expected);
          await page.locator('.coptic-kb-edit [data-value="backspace"]').click();
          assert.ok((await page.locator('#sample').inputValue()).length<expected.length);
          await page.locator('.coptic-kb-key').first().click();
          await page.locator('.coptic-kb-edit [data-value="space"]').click();
          assert.ok((await page.locator('#sample').inputValue()).endsWith(' '));
          await page.locator('select[aria-label="Coptic dialect"]').selectOption('bohairic');
          assert.equal(await page.locator('select[aria-label="Coptic dialect"]').inputValue(),'bohairic');
          const layout=await page.locator('.coptic-keyboard').boundingBox();
          assert.ok(layout.width<=width,'no horizontal overflow');
          await page.evaluate(()=>window.demoKeyboard.destroy());
          assert.equal(await page.locator('.coptic-keyboard').count(),0);
          console.log('PASS '+name+' '+width+'px: Unicode edit, suggestion, dialect, touch, destroy');
        }finally{await page.close();}
      }
    }finally{await browser.close();}
  }
})().catch(err=>{console.error(err);process.exitCode=1;});
