(() => {
  const popover = document.querySelector('#colourPopover');
  const tabs = document.querySelector('.popover-tabs');
  const presetPane = document.querySelector('#presetPane');
  const customPane = document.querySelector('#customPane');
  const usedPane = document.querySelector('#usedPane');
  const usedGrid = document.querySelector('#usedGrid');
  const popoverHex = document.querySelector('#popoverHex');

  if (!popover || !tabs || !presetPane || !customPane || !usedPane || !usedGrid || !popoverHex) return;

  const toHex = (colour) => {
    if (!colour) return '';
    if (colour.startsWith('#')) return colour.length === 4
      ? `#${colour[1]}${colour[1]}${colour[2]}${colour[2]}${colour[3]}${colour[3]}`.toLowerCase()
      : colour.slice(0, 7).toLowerCase();
    const match = colour.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return '';
    return `#${[match[1], match[2], match[3]].map((value) => Number(value).toString(16).padStart(2, '0')).join('')}`;
  };

  const getUsedColours = () => {
    const colours = [];
    const isHype = document.querySelector('[data-product-type="hype"]')?.classList.contains('active');
    const selector = isHype ? '[data-hype-colour] i' : '#frontPlateColours [data-front-colour]';
    document.querySelectorAll(selector).forEach((button) => {
      const hex = toHex(button.style.background || getComputedStyle(button).backgroundColor);
      if (hex && !colours.includes(hex)) colours.push(hex);
    });
    return colours;
  };

  const getHypePendantColours = () => {
    const colours = [];
    document.querySelectorAll('#hypePendantColourRow [data-pendant-casing-colour], #hypePendantColourRow [data-pendant-colour]').forEach((swatch) => {
      const hex = toHex(
        swatch.dataset.pendantCasingColour || swatch.dataset.pendantColour || swatch.getAttribute('style') || swatch.style.background || getComputedStyle(swatch).backgroundColor,
      );
      if (hex && !colours.includes(hex)) colours.push(hex);
    });
    return colours;
  };

  const renderButtons = (colours) => colours
    .map((hex) => `<button type="button" data-used-colour="${hex}" style="background:${hex}" aria-label="${hex}"></button>`)
    .join('');

  const renderUsedColours = () => {
    const isHype = document.querySelector('[data-product-type="hype"]')?.classList.contains('active');
    if (isHype && typeof window.SignGuyRenderUsedColourGrid === 'function') {
      window.SignGuyRenderUsedColourGrid();
      return;
    }
    const colours = getUsedColours();
    const pendantColours = isHype ? getHypePendantColours() : [];
    if (!colours.length && !pendantColours.length) {
      usedGrid.innerHTML = '<span class="used-empty">Upload artwork</span>';
      return;
    }
    usedGrid.innerHTML = isHype
      ? [
        colours.length ? `<span class="used-group-label">Hype Chain</span>${renderButtons(colours)}` : '',
        pendantColours.length ? `<span class="used-group-label">Pendant</span>${renderButtons(pendantColours)}` : '',
      ].join('')
      : renderButtons(colours);
  };

  const setTab = (tab) => {
    tabs.querySelectorAll('[data-popover-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.popoverTab === tab);
    });
    presetPane.classList.toggle('hidden', tab !== 'preset');
    usedPane.classList.toggle('hidden', tab !== 'used');
    customPane.classList.toggle('hidden', tab !== 'custom');
    if (tab === 'used') renderUsedColours();
  };

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-popover-tab]');
    if (!button) return;
    setTab(button.dataset.popoverTab);
  });

  popover.addEventListener('click', (event) => {
    const button = event.target.closest('[data-used-colour]');
    if (!button) return;
    popoverHex.value = button.dataset.usedColour;
    popoverHex.dispatchEvent(new Event('change', { bubbles: true }));
    renderUsedColours();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-front-colour], [data-hype-colour], [data-hype-pendant-casing], [data-hype-pendant-colour], #sideColourButton, #backColourButton')) return;
    window.setTimeout(renderUsedColours, 0);
  }, true);

  const frontColours = document.querySelector('#frontPlateColours');
  if (frontColours) {
    new MutationObserver(renderUsedColours).observe(frontColours, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style'],
    });
  }

  const pendantColours = document.querySelector('#hypePendantColourRow');
  if (pendantColours) {
    new MutationObserver(renderUsedColours).observe(pendantColours, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'aria-label'],
    });
  }

  renderUsedColours();
})();
