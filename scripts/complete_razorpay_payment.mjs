import puppeteer from 'puppeteer';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log("Starting Puppeteer E2E Test...");
  const browser = await puppeteer.launch({ 
    headless: false, // Run headful so we can interact with Razorpay iframe
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Navigating to customer login...");
    await page.goto('http://localhost:5174/login?demo=customer', { waitUntil: 'networkidle0' });
    
    // Set local storage directly to bypass login screen quickly
    await page.evaluate(() => {
        localStorage.setItem('coophub_demo_customer', 'true');
    });

    console.log("Navigating to request...");
    await page.goto('http://localhost:5174/requests/REQ-8890?demo=customer', { waitUntil: 'networkidle0' });
    await delay(3000);
    
    console.log("Clicking Pay with Razorpay...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const payBtn = btns.find(b => b.innerText.includes('Proceed to Payment'));
        if (payBtn) payBtn.click();
    });
    
    await delay(5000); // Wait for Razorpay modal and iframe to load
    
    console.log("Finding Razorpay iframe...");
    const frames = page.frames();
    const rzpFrame = frames.find(f => f.url().includes('checkout.razorpay.com') || f.name() === 'razorpay-checkout-frame' || f.url().includes('api.razorpay.com'));
    
    if (rzpFrame) {
        console.log("Razorpay iframe found! Attempting to select Card payment...");
        
        // Wait a bit more for internal rendering
        await delay(2000);
        
        // Click Card option
        try {
            await rzpFrame.waitForSelector('button[method="card"]', { timeout: 5000 });
            await rzpFrame.click('button[method="card"]');
            console.log("Clicked Card option.");
        } catch (e) {
            console.log("Could not find Card button, trying fallback selector.");
            await rzpFrame.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const cardBtn = btns.find(b => b.innerText.toLowerCase().includes('card'));
                if (cardBtn) cardBtn.click();
            });
        }
        
        await delay(2000);
        
        // Fill card details
        console.log("Filling card details...");
        await rzpFrame.type('#card_number', '4100280000001007');
        await rzpFrame.type('#card_expiry', '1226');
        await rzpFrame.type('#card_cvv', '123');
        await rzpFrame.type('#card_name', 'Test User');
        
        // Click Pay Now
        await rzpFrame.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const payBtn = btns.find(b => b.innerText.toLowerCase().includes('pay') && b.id !== 'card_name');
            if (payBtn) payBtn.click();
        });
        
        console.log("Waiting for bank authentication popup...");
        await delay(5000);
        
        // Razorpay test mode usually pops up a new window or iframe for the bank
        const allPages = await browser.pages();
        const bankPage = allPages.find(p => p.url().includes('api.razorpay.com'));
        if (bankPage) {
            console.log("Bank page found! Clicking Success...");
            await bankPage.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const successBtn = btns.find(b => b.innerText.toLowerCase().includes('success'));
                if (successBtn) successBtn.click();
            });
        } else {
            // Check if it's in a frame instead
            const bankFrame = page.frames().find(f => f.url().includes('bank'));
            if (bankFrame) {
                console.log("Bank frame found! Clicking Success...");
                await bankFrame.evaluate(() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const successBtn = btns.find(b => b.innerText.toLowerCase().includes('success'));
                    if (successBtn) successBtn.click();
                });
            } else {
                console.log("Could not explicitly find bank popup, waiting for auto-resolve...");
            }
        }
        
        await delay(8000);
        console.log("Payment flow completed!");
    } else {
        console.log("Could not find Razorpay iframe!");
    }

  } catch (err) {
    console.error("Puppeteer error:", err);
  } finally {
    await browser.close();
  }
}

runE2E();
