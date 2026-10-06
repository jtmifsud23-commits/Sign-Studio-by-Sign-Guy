const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const results = [];
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 } });
      page.setDefaultTimeout(60000);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const submitted = [];
      await page.route('**/api/save-project', async route => {
        const payload = route.request().postDataJSON(); submitted.push(payload);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, designId: payload.orderId, emailQueued: payload.sendOrderEmail, emailSent: false, previewUrl: 'https://sign-studio-by-sign-guy.vercel.app/uploads/test-token/design-preview.png' }) });
      });
      await page.route('**/api/shopify/subscribe', route => route.fulfill({ status: 200, body: '{}' }));
      await page.goto('http://127.0.0.1:8765');
      await page.waitForFunction(() => typeof initializeStudioApp === 'function');
      await page.evaluate(async () => {
        queueEmailMarketingSubscription = () => {}; trackSignStudioEvent = () => {};
        shouldLoadDefaultPlaqueProject = () => false;
        await initializeStudioApp(); hideAppLoading(); hideProductSelectionMenu(); dismissOnboarding();
        isLocalTesting = () => false;
        navigateToCheckoutUrl = url => { window.checkoutCaptured = url; };
        window.uploadedSnapshots = [];
        window.SignStudioPrivateBlob = { upload: async (pathname, file) => {
          if (pathname.includes('/projectFile-')) window.uploadedSnapshots.push(JSON.parse(await file.text()));
          return { pathname, url: `https://test.private.blob.vercel-storage.com/${pathname}`, contentType: file.type };
        } };
      });
      const checks = await page.evaluate(async () => {
        const assert = (condition, message) => { if (!condition) throw new Error(message); };
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffc529'; ctx.fillRect(4, 4, 24, 24);
        const image = canvas.toDataURL('image/png');
        const configurations = [
          ['led', 'SignGuy.LightboxStudio', {}],
          ['plaque', 'SignGuy.WallPlaqueStudio', { plaque: { baseThickness: 4 } }],
          ['classic', 'SignGuy.HypeChainStudio', { hype: { variant: 'classic', patternLength: 3, primary: '#000000', secondary: '#ffc529', tertiary: '#ffffff', pendantCasing: '#000000', chainLength: 'Adult' } }],
          ['spinner', 'SignGuy.HypeChainStudio', { hype: { variant: 'spinner', patternLength: 2, primary: '#000000', secondary: '#ffc529', tertiary: '#ffffff', pendantCasing: '#000000', chainLength: 'Adult', spinner: { topText: 'MVP', bottomText: 'TEAM', fontFamily: 'Arial', ringColor: '#000000', textColor: '#ffffff', baseColor: '#000000' } } }],
          ['single bag', 'SignGuy.BagTagStudio', { bag: { orderMode: 'single', text: 'PLAYER 1', quantity: 2, usage: 'indoor', font: 'Bebas Neue Bold', palette: [], baseColour: '#000000', textColour: '#ffffff' } }],
          ['team bag', 'SignGuy.BagTagStudio', { bag: { orderMode: 'team', roster: [{ name: 'PLAYER 1', quantity: 2 }, { name: 'COACH', quantity: 1 }], usage: 'indoor', font: 'Bebas Neue Bold', palette: [], baseColour: '#000000', textColour: '#ffffff' } }],
        ];
        const checks = [];
        state.customerEmail = 'test@example.com';
        for (const [label, type, config] of configurations) {
          const product = type.includes('BagTag') ? 'bag' : type.includes('HypeChain') ? 'hype' : type.includes('WallPlaque') ? 'plaque' : 'led';
          selectProductType(product);
          state.size = 'small'; state.usage = 'indoor';
          if (product === 'bag') Object.assign(bagState(), config.bag);
          const project = { id: `test-${label.replace(/ /g, '-')}`, type, name: 'Checkout fixture', customerEmail: state.customerEmail, source: { fileName: 'fixture.png', artworkType: 'png', dataUrl: image }, preview: { screenshotDataUrl: image }, config: { size: 'small', usage: 'indoor', ...config } };
          const shot = dataUrlToFile(image, 'preview.png');
          const saved = await uploadProjectFolder(project, { sendOrderEmail: true, screenshots: [{ file: shot, blob: shot, fileName: 'preview.png', label: 'Front' }], message: 'Fixture submission' });
          redirectToShopifyCheckout(project, saved);
          const params = new URL(window.checkoutCaptured).searchParams;
          assert(params.get('properties[_Studio design ID]') === saved.designId, `${label}: missing ID`);
          assert(params.get('return_to') === '/cart', `${label}: cart changed`);
          assert(params.get('checkout[email]') === state.customerEmail, `${label}: email`);
          assert(params.get('id'), `${label}: variant`);
          assert(![...params.keys()].some(key => key.startsWith('attributes[')), `${label}: shared cart metadata`);
          const expected = product === 'bag' ? label === 'team bag' ? '3' : '2' : '1';
          assert(params.get('quantity') === expected, `${label}: quantity`);
          if (label === 'team bag') assert(params.get('properties[Tag 2]') === 'COACH · Qty 1', 'Full roster lost');
          if (label === 'spinner') assert(params.get('properties[Spinner top text]') === 'MVP', 'Spinner text lost');
          if (label === 'classic' || label === 'spinner') assert(params.get('id') === SHOPIFY_HYPE_CHAIN_VARIANTS[config.hype.variant], 'Wrong chain variant');
          const previous = window.checkoutCaptured; let blocked = false;
          try { redirectToShopifyCheckout(project, {}); } catch { blocked = true; }
          assert(blocked && window.checkoutCaptured === previous, `${label}: unrecorded order reached checkout`);
          checks.push({ product: label, designIdPresent: true, expectedQuantity: expected, savedSnapshot: true });
        }
        return checks;
      });
      assert.equal(submitted.length, 6); assert.equal(new Set(submitted.map(payload => payload.orderId)).size, 6);
      assert(submitted.every(payload => payload.sendOrderEmail === true && payload.files.some(file => file.kind === 'projectFile')));
      assert.equal(await page.evaluate(() => window.uploadedSnapshots[5].config.bag.roster.length), 2);
      assert.deepEqual(errors, []);
      results.push({ width, checks, saveRequests: submitted.length, pageErrors: errors });
      await page.close();
    }
    fs.writeFileSync('verification/release-1-2-browser-results.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results.map(result => ({ width: result.width, products: result.checks.map(check => check.product), saveRequests: result.saveRequests, pageErrors: result.pageErrors })), null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
