// Run on localhost with agent-browser eval --stdin. No checkout or email is sent.
(async () => {
  if (!isLocalTesting()) throw new Error('Local tests only');
  const checks = [];
  const check = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  await initializeStudioApp(); hideAppLoading(); hideProductSelectionMenu();
  selectProductType('hype'); closeOnboarding();
  const oldNavigate = navigateToCheckoutUrl, oldTrack = trackSignStudioEvent;
  const oldState = structuredClone(state.hype);
  let url;
  navigateToCheckoutUrl = value => { url = new URL(value); };
  trackSignStudioEvent = () => {};
  try {
    const base = {
      type: 'SignGuy.HypeChainStudio', name: 'Order regression test',
      source: { fileName: 'order-test.png' },
      config: { hype: { variant: 'classic', patternLength: 1, primary: '#95022f',
        secondary: '#ffffff', tertiary: '#010202', pendantCasing: '#010202', chainLength: 'Standard',
        spinner: { topText: 'PLAYER OF', bottomText: 'THE GAME', fontFamily: 'Bebas Neue Bold',
          ringColor: '#95022f', textColor: '#ffffff', baseColor: '#010202' } } },
    };
    const preview = 'https://example.com/order-specific/design-preview.png';
    state.hype.variant = 'spinner'; state.hype.primary = '#00a651';
    redirectToShopifyCheckout(base, { previewUrl: preview });
    let p = url.searchParams;
    check(p.get('id') === SHOPIFY_HYPE_CHAIN_VARIANTS.classic, 'Classic saved design selects Classic variant despite changed controls');
    check(p.get('properties[Style]') === 'Classic', 'Classic style belongs to line item');
    check(p.get('properties[Primary chain colour]') === 'Maroon', 'Saved colour becomes Maroon');
    check(p.get('properties[Pendant backing sides and hook colour]') === 'Black', 'Near-black becomes Black');
    check(p.get('properties[Design preview]') === preview, 'Order-specific preview belongs to item');
    check(![...p.keys()].some(key => key.startsWith('attributes[')), 'No shared cart attributes');
    check(![...p.keys()].some(key => key.includes('Spinner')), 'No Spinner fields on Classic');
    check(!p.has('properties[Secondary chain colour]') && !p.has('properties[Tertiary chain colour]'), 'Unused chain colours omitted');
    const spinner = structuredClone(base); spinner.config.hype.variant = 'spinner'; spinner.config.hype.patternLength = 3;
    state.hype.variant = 'classic';
    redirectToShopifyCheckout(spinner, { previewUrl: preview + '?spinner' }); p = url.searchParams;
    check(p.get('id') === SHOPIFY_HYPE_CHAIN_VARIANTS.spinner, 'Spinner saved design selects Spinner variant');
    check(p.get('properties[Spinner top text]') === 'PLAYER OF', 'Spinner text preserved');
    check(p.get('properties[Spinner ring colour]') === 'Maroon' && p.get('properties[Spinner text colour]') === 'White', 'Spinner colours named');
    check(p.get('properties[Tertiary chain colour]') === 'Black', 'Three-colour pattern preserved');
    check(base.config.hype.primary === '#95022f' && spinner.config.hype.spinner.ringColor === '#95022f', 'Production hex values unchanged');
    check(getOrderColourName('#954132').includes('custom shade'), 'Custom shades labelled honestly');
    const params = new URLSearchParams(); setShopifyOrderField(params, '_SignGuy file', 'bag.SignGuy');
    check(params.get('properties[_SignGuy file]') === 'bag.SignGuy' && [...params].length === 1, 'Other products retain item-level production-file marker');
    state.hype.variant = 'classic'; renderHypeChain();
    const project = await buildHypeChainProject();
    check(project.preview.screenshotDataUrl.startsWith('data:image/'), 'Classic design preview can be captured');
    check(project.config.hype.variant === 'classic', 'Saved project style matches preview');
    return { passed: checks.length, checks };
  } finally { navigateToCheckoutUrl = oldNavigate; trackSignStudioEvent = oldTrack; Object.assign(state.hype, oldState); }
})();
