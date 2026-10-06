const escape = value => String(value ?? '').replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[char]);
const display = value => typeof value === 'string' ? value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, char => char.toUpperCase()) : String(value ?? '');
const number = value => value != null && value !== '' && Number.isFinite(Number(value)) ? String(Number(Number(value).toFixed(2))) : null;
const unit = (value, suffix) => number(value) == null ? null : `${number(value)} ${suffix === 'links' && Number(value) === 1 ? 'link' : suffix}`;
const hex = value => {
  if (typeof value !== 'string') return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${[...value.slice(1)].map(char => char + char).join('')}`.toUpperCase();
  return null;
};
const colourNames = { '#000000': 'Black', '#020201': 'Black', '#FFFFFF': 'White', '#FBFBFB': 'White', '#E3B535': 'Gold', '#FFD700': 'Gold', '#FF0000': 'Red', '#FB0211': 'Red', '#0000FF': 'Blue', '#008000': 'Green', '#FFFF00': 'Yellow' };

// A bounded, product-specific brief; the complete saved settings remain in .SignGuy.
export function productionBrief(record, event) {
  const config = record.settings || {}, preview = record.preview || {}, hype = config.hype || {}, bag = config.bag || {}, plaque = config.plaque || {};
  const details = [], colours = [], facts = [];
  const add = (label, value) => { if (value != null && value !== '' && typeof value !== 'object') details.push([label, String(value)]); };
  const colourGroup = (title, entries) => {
    const items = entries.map(({ label, value, name }) => {
      const code = hex(value);
      if (!code) return null;
      const savedName = typeof name === 'string' && name.trim() && !/^\d+$/.test(name.trim()) ? name.trim() : null;
      return { label, hex: code, name: savedName || colourNames[code] || 'Custom colour' };
    }).filter(Boolean);
    if (items.length) colours.push({ title, items });
  };
  const dimension = preview.dimensions || config.dimensions || {};
  const faceSize = unit(dimension.faceInches, 'in');
  const tagDimensions = [dimension.widthMm, dimension.heightMm, dimension.depthMm].filter(value => number(value) != null).map(number).join(' × ');
  const quantity = (event.lineItems || []).reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const quantityLabel = `${quantity} ${record.product === 'Hype Chain' ? (quantity === 1 ? 'chain' : 'chains') : record.product === 'Bag Tag' ? (quantity === 1 ? 'tag' : 'tags') : record.product === '3D Plaque' ? (quantity === 1 ? 'plaque' : 'plaques') : (quantity === 1 ? 'sign' : 'signs')}`;
  facts.push(['Quantity ordered', quantityLabel]);
  let productTitle = record.product;
  if (record.product === 'Hype Chain') {
    const style = hype.variant === 'spinner' ? 'Spinner' : 'Classic';
    productTitle = `${style} Hype Chain`;
    const length = [display(hype.chainLength), unit(hype.linkCount, 'links')].filter(Boolean).join(' · ');
    if (length) facts.push(['Chain length', length]);
    if (hype.finish) facts.push(['Finish', display(hype.finish)]);
    add('Style', style); add('Chain pattern', unit(hype.patternLength, 'links'));
    add('Pendant depth', unit(hype.depth, 'mm')); add('Border thickness', unit(hype.borderThickness, 'mm'));
    const pattern = Math.max(1, Math.min(3, Number(hype.patternLength) || 1));
    colourGroup('Chain colours', ['primary', 'secondary', 'tertiary'].slice(0, pattern).map((key, i) => ({ label: ['Primary', 'Secondary', 'Tertiary'][i], value: hype[key] })));
    colourGroup('Pendant colours', [
      { label: 'Backing, sides and hook', value: hype.pendantCasing },
      ...(Array.isArray(hype.pendantColours) ? hype.pendantColours : []).map((value, i) => ({ label: `Colour ${i + 1}`, value, name: hype.pendantColourLabels?.[i] })),
    ]);
    if (hype.variant === 'spinner') {
      const spinner = hype.spinner || {};
      add('Top text', spinner.topText); add('Bottom text', spinner.bottomText); add('Text font', spinner.fontFamily);
      add('Ring diameter', unit(spinner.ringDiameter, 'mm')); add('Ring thickness', unit(spinner.ringThickness, 'mm')); add('Ring clearance', unit(spinner.ringClearance, 'mm'));
      colourGroup('Spinner colours', [{ label: 'Ring', value: spinner.ringColor }, { label: 'Ring text', value: spinner.textColor }, { label: 'Base', value: spinner.baseColor }]);
    }
  } else if (record.product === 'Bag Tag') {
    productTitle = bag.orderMode === 'team' ? 'Team Bag Tags' : 'Bag Tag';
    facts.push(['Order type', bag.orderMode === 'team' ? 'Team roster' : 'Single name']);
    if (tagDimensions) facts.push(['Dimensions', `${tagDimensions} mm`]);
    add('Font', bag.font); add('Usage', bag.usage ? display(bag.usage) : null);
    add('Backing shape', bag.resolvedBacking || bag.backing ? display(bag.resolvedBacking || bag.backing) : null);
    colourGroup('Tag colours', [{ label: 'Backing', value: bag.baseColour }, { label: 'Name', value: bag.textColour }]);
    colourGroup('Logo colours', (Array.isArray(bag.palette) ? bag.palette : []).map((item, i) => ({ label: `Colour ${i + 1}${item.raised === true ? ' · raised 2 mm' : item.raised === false ? ' · flat' : ''}`, value: typeof item === 'string' ? item : item.colour, name: item.label })));
  } else {
    if (faceSize) facts.push(['Face size', faceSize]);
    const usage = record.product === '3D Plaque' ? plaque.usage || config.usage : config.usage;
    if (usage) facts.push(['Usage', display(usage)]);
    if (!faceSize) add('Size', config.size ? display(config.size) : null);
    if (record.product === '3D Plaque') {
      add('Backing thickness', unit(plaque.baseThickness ?? dimension.depthMm, 'mm')); add('Backing padding', unit(plaque.basePadding, 'mm'));
      (Array.isArray(plaque.layerDepths) ? plaque.layerDepths : []).forEach((value, i) => add(`Layer ${i + 1} depth`, unit(value, 'mm')));
      colourGroup('Backing colour', [{ label: 'Backing', value: plaque.backingColourOverride || preview.colours?.find(item => item.index === 'backing')?.display }]);
    } else {
      add('Sign depth', unit(dimension.depthMm, 'mm'));
      colourGroup('Shell colours', [{ label: 'Sides', value: config.shellColours?.side }, { label: 'Back', value: config.shellColours?.back }]);
    }
    const artworkColours = Array.isArray(preview.colours) ? preview.colours : [];
    colourGroup(record.product === '3D Plaque' ? 'Layer colours' : 'Artwork colours', artworkColours.filter(item => item?.index !== 'backing').map((item, i) => ({ label: record.product === '3D Plaque' ? `Layer ${i + 1}` : `Colour ${i + 1}`, value: typeof item === 'string' ? item : item.display || item.hex || item.colour, name: item.label })));
    if (record.product === '3D Plaque' && !artworkColours.length) colourGroup('Layer colours', (plaque.colourOverrides || []).map((value, i) => ({ label: `Layer ${i + 1}`, value })));
  }
  const roster = record.product === 'Bag Tag' ? (bag.orderMode === 'team' ? bag.roster || [] : [{ name: bag.text, quantity: bag.quantity }]) : [];
  const rosterQuantity = roster.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const warning = roster.length && rosterQuantity !== quantity ? `CHECK QUANTITIES: the saved roster totals ${rosterQuantity}; Shopify ordered ${quantity}. Confirm the roster before production.` : null;
  const files = record.files || [];
  const screenshots = files.filter(file => /^renderScreenshot\d+$/.test(file.kind)).sort((a, b) => Number(a.kind.slice(16)) - Number(b.kind.slice(16)));
  const previews = screenshots.slice(0, record.product === 'Bag Tag' ? 4 : 2).map((file, i) => ({
    cid: `bag-tag-${file.kind.slice(16)}`,
    label: record.product === 'Bag Tag' ? `Tag ${Number(file.kind.slice(16))}${roster[Number(file.kind.slice(16)) - 1]?.name ? ` · ${roster[Number(file.kind.slice(16)) - 1].name}` : ''}` : i === 0 ? 'Saved design · front' : record.product === 'Hype Chain' ? 'Saved design · chain view' : 'Saved design · angled',
  }));
  if (!previews.length && files.some(file => file.kind === 'logoPreview' || file.kind === 'logo')) previews.push({ cid: 'uploaded-logo', label: 'Uploaded artwork · design preview unavailable' });
  const shop = String(event.shop || '');
  const orderUrl = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop) && /^\d+$/.test(String(event.orderId || ''))
    ? `https://admin.shopify.com/store/${shop.split('.')[0]}/orders/${event.orderId}` : null;
  return { productTitle, facts, details, colours, quantity, roster, warning, previews, screenshotCount: screenshots.length, orderUrl };
}

export function paidProductionEmail(record, event) {
  const brief = productionBrief(record, event);
  const title = `${event.test ? 'TEST payment' : 'Payment confirmed'} — ${event.orderName}`;
  const note = event.test ? 'TEST ORDER — do not produce.' : 'Shopify reports this order as paid. Review the saved design before production.';
  const testWarning = event.test ? `<p style="margin:0 0 18px;padding:14px;background:#fff3ce;color:#473600;font-weight:bold">${escape(note)}</p>` : '';
  const facts = brief.facts.map(([label, value]) => `<td valign="top" style="padding:14px 8px 14px 0"><div style="font-size:12px;color:#62645c">${escape(label)}</div><div style="font-size:14px;font-weight:bold;margin-top:5px">${escape(value)}</div></td>`).join('');
  const images = brief.previews.map(item => `<td class="sg-preview" valign="top" style="padding:0 10px 16px 0"><img src="cid:${item.cid}" width="280" alt="${escape(item.label)}" style="display:block;width:100%;max-width:280px;height:auto;border-radius:8px"><div style="font-size:12px;color:#62645c;margin-top:7px">${escape(item.label)}</div></td>`);
  const imageRows = []; for (let i = 0; i < images.length; i += 2) imageRows.push(`<tr>${images.slice(i, i + 2).join('')}</tr>`);
  const morePreviews = brief.screenshotCount > brief.previews.length ? `<p style="font-size:13px;color:#62645c;margin:0 0 20px">Showing ${brief.previews.length} of ${brief.screenshotCount} saved tag previews. All numbered previews are attached and match the roster below.</p>` : '';
  const rows = brief.details.map(([label, value]) => `<tr><th scope="row" style="width:45%;padding:9px 12px 9px 0;text-align:left;vertical-align:top;color:#62645c;font-weight:normal;border-bottom:1px solid #e7e7e0">${escape(label)}</th><td style="padding:9px 0;vertical-align:top;font-weight:bold;border-bottom:1px solid #e7e7e0;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join('');
  const details = rows ? `<h2 style="font-size:16px;margin:20px 0 10px">Production details</h2><table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5">${rows}</table>` : '';
  const colours = brief.colours.map(group => `<h2 style="font-size:16px;margin:22px 0 12px">${escape(group.title)}</h2>${group.items.map(item => `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 14px 14px 0;vertical-align:top"><tr><td valign="top" style="padding:3px 8px 0 0"><div style="width:22px;height:22px;background-color:${item.hex};border:1px solid #d8d8d0;border-radius:50%">&nbsp;</div></td><td style="font-size:13px;line-height:1.4"><div style="color:#62645c;font-size:12px">${escape(item.label)}</div><div>${escape(item.name)}</div><div style="font-size:11px;color:#62645c">${item.hex}</div></td></tr></table>`).join('')}`).join('');
  const roster = brief.roster.length ? `<h2 style="font-size:16px;margin:22px 0 10px">Bag Tag roster</h2><table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f6f6f1"><th style="padding:10px;text-align:left">Tag</th><th style="padding:10px;text-align:left">Name on tag</th><th style="padding:10px;text-align:right">Quantity</th></tr></thead><tbody>${brief.roster.map((row, i) => `<tr><td style="padding:10px;border-bottom:1px solid #e7e7e0">${i + 1}</td><td style="padding:10px;border-bottom:1px solid #e7e7e0;overflow-wrap:anywhere">${escape(row.name)}</td><td style="padding:10px;border-bottom:1px solid #e7e7e0;text-align:right">${escape(row.quantity)}</td></tr>`).join('')}</tbody></table>` : '';
  const warning = brief.warning ? `<p style="padding:14px;background:#fff3ce;color:#473600;font-weight:bold;font-size:14px;line-height:1.5">${escape(brief.warning)}</p>` : '';
  const lineDetails = (event.lineItems || []).map(line => `${line.title} — quantity ${line.quantity} · line ${line.lineItemId}`);
  const fileNote = `Editable .SignGuy project · original logo${brief.screenshotCount ? ` · ${brief.screenshotCount} design preview${brief.screenshotCount === 1 ? '' : 's'}` : ''}`;
  const orderLink = brief.orderUrl ? `<a href="${escape(brief.orderUrl)}" style="display:inline-block;background:#ffcb28;color:#171710;text-decoration:none;padding:13px 18px;border-radius:6px;font-size:14px;font-weight:bold">View order ${escape(event.orderName)} in Shopify &#8599;</a>` : '';
  const designName = record.name && String(record.name).trim().toLowerCase() !== String(brief.productTitle).trim().toLowerCase() ? `<p style="font-size:14px;margin:0 0 6px;line-height:1.5">${escape(record.name)}</p>` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media only screen and (max-width:480px){.sg-body{padding:18px!important}.sg-preview{display:block!important;width:100%!important;padding-right:0!important}.sg-preview img{max-width:100%!important}.sg-heading{font-size:23px!important}}</style></head><body style="margin:0;padding:0;background:#f6f6f1;color:#202020;font-family:Arial,sans-serif"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background:#f6f6f1"><tr><td align="center" style="padding:20px 8px"><!--[if mso]><table role="presentation" align="center" width="640" cellpadding="0" cellspacing="0"><tr><td><![endif]--><table role="presentation" cellpadding="0" cellspacing="0" width="640" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e7e7e0;border-radius:12px;overflow:hidden"><tr><td style="padding:18px 24px;background:#ffcb28;color:#171710;font-size:16px;font-weight:bold">SIGN GUY <span style="float:right;font-size:12px;font-weight:normal">STUDIO ORDER</span></td></tr><tr><td class="sg-body" style="padding:24px"><span style="display:inline-block;padding:6px 10px;background:${event.test ? '#fff3ce' : '#eaf6ed'};color:${event.test ? '#473600' : '#20744d'};font-size:12px;font-weight:bold;border-radius:20px">${event.test ? 'TEST ORDER — DO NOT PRODUCE' : 'PAYMENT CONFIRMED'}</span><h1 class="sg-heading" style="font-size:28px;margin:14px 0 8px;line-height:1.25">${escape(brief.productTitle)} <span style="white-space:nowrap">${escape(event.orderName)}</span></h1>${designName}<p style="font-size:13px;margin:0;color:#62645c;line-height:1.5">${escape(note)}</p><p style="font-size:13px;margin:10px 0 0;overflow-wrap:anywhere">Customer: ${escape(record.customerEmail)}</p><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-bottom:1px solid #e7e7e0;margin:10px 0 20px"><tr>${facts}</tr></table>${testWarning}${warning}<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed">${imageRows.join('')}</table>${morePreviews}${details}${colours}${roster}<div style="margin:22px 0 18px;padding:15px 16px;background:#f6f6f1;border-radius:8px;font-size:13px;line-height:1.5"><strong style="display:block;margin-bottom:4px;font-size:14px">Production files attached</strong>${escape(fileNote)}<br>Full artwork and settings are in the attached .SignGuy file.</div>${orderLink}</td></tr><tr><td style="padding:16px 24px;background:#f6f6f1;color:#62645c;font-size:11px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word">Studio design ID: ${escape(record.designId)}<br>Shopify order ID: ${escape(event.orderId)}<br>${lineDetails.map(escape).join('<br>')}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
  const text = [title, note, brief.productTitle, record.name, `Customer: ${record.customerEmail}`, ...brief.facts.map(([label, value]) => `${label}: ${value}`), ...(brief.warning ? [brief.warning] : []), '', 'Production details', ...brief.details.map(([label, value]) => `${label}: ${value}`), ...brief.colours.flatMap(group => ['', group.title, ...group.items.map(item => `${item.label}: ${item.name} (${item.hex})`)]), ...(brief.roster.length ? ['', 'Bag Tag roster:', ...brief.roster.map(row => `${row.name} — quantity ${row.quantity}`)] : []), '', 'Production files attached', fileNote, 'Full artwork and settings are in the attached .SignGuy file.', ...(brief.orderUrl ? ['', `View Shopify order: ${brief.orderUrl}`] : []), '', `Studio design ID: ${record.designId}`, `Shopify order ID: ${event.orderId}`, ...lineDetails].join('\n');
  return { html, text };
}
