// Isolated test-browser cart only. Does not place an order or send customer details.
(async () => {
  const check = (ok, label) => { if (!ok) throw new Error(label); };
  const json = async (path, body) => {
    const response = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.json();
  };
  const initial = await json('/cart.js');
  check(initial.items.length === 0, 'Requires an empty isolated cart');
  window.chainCartTestOriginalAttributes = initial.attributes;
  await json('/cart/update.js', { attributes: { 'SignGuy file': 'abandoned-spinner.SignGuy', 'Style': 'Spinner', 'Spinner top text': 'ABANDONED', 'Spinner base colour': '#010202', 'gift-note': 'Regression test - preserve' } });
  await json('/cart/add.js', { items: [
    { id: 43897670271116, quantity: 1, properties: { 'Style': 'Classic', 'Primary chain colour': 'Maroon', 'SignGuy file': 'classic-test.SignGuy', 'Design preview': 'https://example.com/classic-test.png' } },
    { id: 46117827117196, quantity: 1, properties: { 'Style': 'Spinner', 'Spinner top text': 'KEEP ME', 'Spinner ring colour': 'White', 'SignGuy file': 'spinner-test.SignGuy', 'Design preview': 'https://example.com/spinner-test.png' } },
  ] });
  await window.SignStudioCartCleanup.clean();
  const cart = await json('/cart.js');
  check(!cart.attributes.Style && !cart.attributes['SignGuy file'] && !cart.attributes['Spinner top text'], 'Stale order attributes cleared');
  check(cart.attributes['gift-note'] === 'Regression test - preserve', 'Gift data preserved');
  check(cart.items.length === 2, 'Both purchased items retained');
  const classic = cart.items.find(item => item.variant_id === 43897670271116);
  const spinner = cart.items.find(item => item.variant_id === 46117827117196);
  check(classic.properties.Style === 'Classic' && !classic.properties['Spinner top text'], 'Classic item clean');
  check(spinner.properties['Spinner top text'] === 'KEEP ME', 'Actual Spinner properties preserved');
  return { passed: true, attributes: cart.attributes, items: cart.items.map(item => ({ title: item.product_title, variant: item.variant_id, properties: item.properties })) };
})();
