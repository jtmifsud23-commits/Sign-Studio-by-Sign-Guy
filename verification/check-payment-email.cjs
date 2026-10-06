const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const { resolve, join } = require('node:path');
const { writeFile } = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const cases = ['classic', 'spinner', 'led', 'plaque', 'bag-single', 'bag-team'].map(name => ({ name, path: resolve(__dirname, 'payment-email-3.1.8', `${name}.html`) }));
  if (process.argv[2]) cases.push({ name: 'provided-order', path: resolve(process.argv[2]) });
  const results = [];
  for (const width of [736, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const entry of cases) {
      await page.goto(pathToFileURL(entry.path).href);
      await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
      const result = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.scrollingElement.scrollWidth,
        previewCount: document.images.length, imageBeforeDetails: [...document.querySelectorAll('img,h2')][0]?.tagName === 'IMG',
        noRawJson: !document.body.textContent.includes('"ringColor"'),
      }));
      if (result.scrollWidth > result.width || !result.imageBeforeDetails || !result.noRawJson) throw new Error(`${entry.name}: ${JSON.stringify(result)}`);
      if (entry.name === 'provided-order' && process.argv[3]) await page.screenshot({ path: join(resolve(process.argv[3]), `implemented-paid-email-${width}.png`), fullPage: true });
      results.push({ product: entry.name, viewport: width, ...result });
    }
  }
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(resolve(__dirname, 'payment-email-browser-results.json'), JSON.stringify({ cases: results, scriptErrors: errors }, null, 2));
  console.log(JSON.stringify({ checkedLayouts: results.length, horizontalOverflow: 0, scriptErrors: errors }));
})();
