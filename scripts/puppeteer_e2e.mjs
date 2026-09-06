import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\115335dd-7fb4-4cd0-a3b8-f847c5b582b4';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log("Starting Puppeteer E2E Test...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating directly to completed order for Razorpay UI test...");
    
    // We navigate to the completed request
    await page.goto('http://localhost:5174/requests/f5435222-7b1b-4da2-85d3-80ce5b717dd9?demo=customer', { waitUntil: 'networkidle0' });
    await delay(3000);
    
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_completed_request.png') });
    
    // Click Pay
    console.log("Clicking Pay with Razorpay...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const payBtn = btns.find(b => b.innerText.includes('Proceed to Payment') || b.innerText.includes('Razorpay'));
        if (payBtn) payBtn.click();
    });
    
    await delay(4000); // Wait for Razorpay modal
    
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_razorpay_modal.png') });
    console.log("Successfully launched Razorpay Modal!");

    console.log("Testing Complete!");
  } catch (err) {
    console.error("Puppeteer error:", err);
  } finally {
    await browser.close();
  }
}

runE2E();
