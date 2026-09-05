/**
 * AutoTranslate verification test v3
 * Uses 'domcontentloaded' + manual wait instead of 'networkidle2' to avoid timeout
 */
import puppeteer from "puppeteer";

const BASE = "http://localhost:5173";

async function testPage(page, url, scriptRegex, langName) {
  console.log(`\n--- ${url} [${langName}] ---`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  
  // Wait for React render + AutoTranslate + async API translations
  await new Promise(r => setTimeout(r, 8000));
  
  const result = await page.evaluate((scriptRe) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const all = [];
    
    // Known non-translatable tokens
    const skip = new Set([
      'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi',
      'Gujarati', 'Malayalam', 'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Sanskrit',
      'Kashmiri', 'Sindhi', 'Nepali', 'Konkani', 'Maithili', 'Bodo', 'Santali',
      'Manipuri', 'Dogri', 'COOP HUB', 'COOP', 'HUB',
      'OTP', 'KYC', 'UPI', 'GPS', 'AI', 'PAN', 'ID', 'PIN', 'PDF', 'GST',
      'or', 'of', 'to', 'a', 'an', 'is', 'in', 'on', 'at', 'by', 'for', '|', '•'
    ]);
    
    while (walker.nextNode()) {
      const txt = walker.currentNode.textContent.trim();
      if (txt.length < 2) continue;
      
      // Skip script/style content
      let parent = walker.currentNode.parentElement;
      let skipNode = false;
      while (parent) {
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT') {
          skipNode = true; break;
        }
        parent = parent.parentElement;
      }
      if (skipNode) continue;
      
      all.push(txt);
    }
    
    const re = new RegExp(scriptRe);
    const translated = all.filter(t => re.test(t));
    const englishOnly = all.filter(t => /[a-zA-Z]/.test(t) && !re.test(t));
    const meaningful = englishOnly.filter(t => !skip.has(t.trim()) && t.trim().length > 2);
    
    return {
      total: all.length,
      translatedCount: translated.length,
      translatedSample: translated.slice(0, 8),
      meaningfulEnglishCount: meaningful.length,
      meaningfulEnglishSample: meaningful.slice(0, 15)
    };
  }, scriptRegex);
  
  const denominator = result.translatedCount + result.meaningfulEnglishCount;
  const coverage = denominator > 0 
    ? ((result.translatedCount / denominator) * 100).toFixed(1) 
    : "N/A";
  
  console.log(`  Total: ${result.total} | Translated: ${result.translatedCount} | English remaining: ${result.meaningfulEnglishCount}`);
  console.log(`  Coverage: ${coverage}%`);
  console.log(`  Translated: ${result.translatedSample.slice(0, 5).join(' | ')}`);
  if (result.meaningfulEnglishCount > 0) {
    console.log(`  Still English: ${result.meaningfulEnglishSample.slice(0, 10).join(' | ')}`);
  }
  
  return parseFloat(coverage) || 0;
}

async function main() {
  console.log("=== AutoTranslate Coverage Test v3 ===\n");
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    
    const results = [];
    
    // Hindi tests (Devanagari: \u0900-\u097F)
    results.push(await testPage(page, `${BASE}/admin/login?lang=hi`, '[\\u0900-\\u097F]', 'Hindi'));
    results.push(await testPage(page, `${BASE}/?lang=hi`, '[\\u0900-\\u097F]', 'Hindi'));
    
    // Tamil (Tamil: \u0B80-\u0BFF)
    results.push(await testPage(page, `${BASE}/admin/login?lang=ta`, '[\\u0B80-\\u0BFF]', 'Tamil'));
    
    console.log("\n=== SUMMARY ===");
    const avg = results.reduce((s, r) => s + r, 0) / results.length;
    console.log(`Average: ${avg.toFixed(1)}%`);
    console.log(`Status: ${avg > 60 ? "✅ GOOD" : avg > 30 ? "⚠️ PARTIAL" : "❌ NEEDS WORK"}`);
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await browser.close();
  }
}

main();
