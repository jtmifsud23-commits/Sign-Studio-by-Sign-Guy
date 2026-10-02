/* Sign Studio 3.1.3: migrate legacy shared attributes to item-only details.
 * Install early in theme.liquid. Never change items, properties, notes, or gift data.
 */
(() => {
  if (window.SignStudioCartCleanup) return;
  const legacyKeys = [
    'Customer email', 'Design name', 'Product', 'Style', 'SignGuy file',
    'Spinner top text', 'Spinner bottom text', 'Spinner ring font',
    'Spinner ring colour', 'Spinner text colour', 'Spinner base colour',
    'Pattern length', 'Primary chain colour', 'Secondary chain colour',
    'Tertiary chain colour', 'Connector and attachment colour',
    'Pendant backing sides and hook colour', 'Chain length', 'Studio size',
    'Usage', 'Backing colour', 'Layer count', '_Customer email', 'Design',
    '_Product', '_Usage', 'Order type', 'Total tags', 'Name', '_Font',
    '_Base colour', '_Text colour', '_Dimensions', '_Logo colours and relief', '_SignGuy file',
  ];
  function staleAttributes(attributes = {}) {
    const isStudio = /\.signguy$/i.test(String(attributes['SignGuy file'] || attributes['_SignGuy file'] || '').trim());
    if (!isStudio) return {};
    return Object.fromEntries(legacyKeys.filter(key => Object.hasOwn(attributes, key)).map(key => [key, '']));
  }
  let pending;
  let ready = false;
  const root = `${(document.documentElement.dataset.sgCartRoot || '/').replace(/\/$/, '')}/`;
  async function request(path, options = {}) {
    const response = await fetch(`${root}${path}`, {
      credentials: 'same-origin', cache: 'no-store', ...options,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Could not refresh cart details');
    return response.json();
  }
  function clean() {
    if (pending) return pending;
    pending = (async () => {
      const cart = await request('cart.js');
      const attributes = staleAttributes(cart.attributes);
      if (!Object.keys(attributes).length) { ready = true; return; }
      const updated = await request('cart/update.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
      });
      if (Object.keys(attributes).some(key => updated.attributes?.[key])) {
        throw new Error('Old design details could not be cleared');
      }
      ready = true;
    })().finally(() => { pending = null; });
    return pending;
  }
  let replaying = false;
  let navigating = false;
  function guard(event, resume) {
    if (replaying) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (navigating) return;
    navigating = true;
    clean().then(() => {
      replaying = true;
      try { resume(); } finally { replaying = false; }
    }).catch(() => {
      window.alert('Your cart could not be refreshed. Please try again before checking out.');
    }).finally(() => { navigating = false; });
  }
  document.addEventListener('submit', event => {
    const form = event.target;
    const action = new URL(form.action || location.href, location.href);
    if (action.origin !== location.origin || !/\/cart(?:\/add)?\/?$/.test(action.pathname)) return;
    guard(event, () => form.requestSubmit(event.submitter || undefined));
  }, true);
  document.addEventListener('click', event => {
    const path = event.composedPath();
    const target = path.find(node => node?.matches?.('a[href], button[name="checkout"], input[name="checkout"], .shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart'));
    if (!target) return;
    if (target.matches('.shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart')) {
      // Wallet buttons can live in closed shadow DOM and require a trusted click.
      // Never replay their click synthetically. Finish migration, then let the
      // customer click the original wallet control again.
      if (!ready) guard(event, () => window.alert('Your cart is ready. Please select your payment button again.'));
      return;
    }
    if (target.matches('a')) {
      const url = new URL(target.href, location.href);
      if (url.origin !== location.origin || !/\/checkout(?:\/|$)/.test(url.pathname)) return;
    }
    guard(event, () => {
      // Replay the actual button, including descendants of accelerated-checkout hosts.
      const clicked = path.find(node => typeof node?.click === 'function');
      (clicked || target).click();
    });
  }, true);
  window.SignStudioCartCleanup = { clean, staleAttributes, version: '3.1.3' };
  clean().catch(() => {}); // A failed background attempt is retried by the purchase guard.
  window.addEventListener('pageshow', event => { if (event.persisted) clean().catch(() => {}); });
})();
