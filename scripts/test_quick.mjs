import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure().errorText));
  page.on('request', req => {
    if (req.url().includes('translate')) {
      console.log('TRANSLATE REQUEST:', req.method(), req.url(), req.postData());
    }
  });
  page.on('response', res => {
    if (res.url().includes('translate')) {
      console.log('TRANSLATE RESPONSE:', res.status(), res.url());
    } else if (res.status() >= 400) {
      console.log('HTTP ERROR RESPONSE:', res.status(), res.url());
    }
  });


  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('select');
  
  console.log('En h1:', await page.evaluate(() => document.querySelector('h1')?.innerText));

  await page.select('select', 'hi');
  console.log('Selected hi. Waiting 8s for IndicTrans2 CPU batch translation...');
  await new Promise(r => setTimeout(r, 8000));

  
  const hiH1 = await page.evaluate(() => document.querySelector('h1')?.innerText);
  console.log('Hi h1 after batch translation:', hiH1);

  const buttonText = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    return btn ? btn.innerText : null;
  });
  console.log('Submit button:', buttonText);

  await browser.close();
}

main().catch(console.error);
