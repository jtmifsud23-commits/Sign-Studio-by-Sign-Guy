# Custom Coasters — local review

Open http://127.0.0.1:8782/?product=coaster. The preview server is bound to this computer only.

To restart it from this directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-coaster-preview.ps1
```

This is a separate checkout on `codex/coaster-designer`, based on published baseline `895adce`. The original checkout remains at `C:\Users\johnm\Documents\SIGN STUDIO\sign-studio-locker-local-preview`. The coaster release was published as Build 3.6.0, commit `5cca219`, on October 17, 2026.

## Review flow

1. Upload a PNG, JPEG, WebP, or SVG logo.
2. Use the adapted Locker Room circle editor: place/crop the logo, resize, move, centre, change the background, and add independent text boxes. Fonts, text size in millimetres, colours, multiline text, drag handles, and keyboard movement are available.
3. Review the colour conversion, adjust mapping, and confirm.
4. Use the standard colour swatches and Top / 4-pack / Holder views. The four-pack view shows three coasters stacked flat with a fourth leaning against the stack. Holder shows four upright coasters nested in the supplied holder STL. All four remain the same physical size.
5. Save a `.SignGuy` project, reopen it through the folder button or saved-design card, and use Edit design to continue editing.
6. Use Place Order. Locally this downloads the editable design and a checkout-review JSON file, without sending email or opening checkout. Finished PNG/SVG artwork remains included in the editable file.

For a prepared example, open `verification/coaster-review.SignGuy` through the folder button.

## Fixed product specification

- Round only: 101.66 mm diameter, 4 mm total depth.
- All four bodies use the same dimensions and the same face artwork.
- Artwork and text are flush. No raised geometry or additional thickness.
- At most eight unique colours, including the background/body, logo, and text. Reused colours count once.
- The background ink also colours the sides and plain reverse. Changing it updates that shared ink rather than adding a ninth colour.

## Verification

- `node verification/check-coaster.cjs`: upload, circle/text placement, out-of-bounds blocking, palette changes, local save, file restore, re-edit/cancel, product switching, and 320 / 390 / 768 px layouts. Zero browser errors and zero outbound POSTs.
- `node verification/check-coaster-limits.cjs`: eight-colour limit with background and text included, background replacement at the limit, invalid-size rejection, PNG/SVG download, and export comparison. All 810,693 interior pixels match between PNG and rendered SVG. Zero failed network responses or browser errors.
- `node verification/check-coaster-pack.cjs`: three horizontal bodies at 0–4, 4–8, and 8–12 mm, one leaning body with its bottom at the same floor level, unchanged local body dimensions, identical artwork, and unclipped framing at 1440 / 1024 / 768 / 390 / 320 px. Top view resets correctly and screenshot capture restores the selected view.
- `node verification/check-coaster-holder.cjs`: the bundled STL hash matches the supplied original; its 3,106 triangles are preserved at 1:1 scale. Four unchanged 101.66 × 4 mm bodies share the design texture, sit upright in the cradle, and have 1.5 mm gaps between them and about 0.7585 mm clearance at each end of the holder's cavity. Holder visibility, save/reopen, three screenshot views, framing, and separate camera/zoom buttons pass on five desktop/mobile sizes, with no browser errors or failed requests. The circular cradle measures about 104.017 mm across. These measurements establish preview placement, not physical print fit.
- `node verification/check-coaster-checkout.cjs`: correct live product variant, saved-design metadata despite switched controls, original upload preservation, finished PNG/SVG and three screenshot descriptors, plain-save versus order email flags, upload failure blocking, and desktop/mobile Place Order buttons. Cloud requests and navigation are simulated; no live cart, email or paid order is created.
- `node --test tests/*.test.js`: all 36 tests pass, including coaster record validation, unpaid submission handling, actual paid pack quantities, and exact production attachments through a mocked mail transport.
- Four-pack geometry measured 101.660003662 mm × 101.660003662 mm × 4.000000000 mm per body (normal floating-point vertex precision).
- Screenshots and machine-readable results are in `verification/coaster-*`.

## Publication boundary

The local code is connected to the existing Shopify product `https://mysignguy.ca/products/custom-drink-coaster`, variant `63132097249420` (SKU `MSG-COA-CUSTOM`). On October 17, 2026 Shopify confirmed it is active and available for sale at $30 CAD per four-pack, with inventory untracked. No product settings or pricing were changed.

On a deployed host, Place Order uploads and confirms the saved design, original logo, finished circle PNG/SVG, artwork preview and Top / 4-pack / Holder renders before opening the native Shopify cart. Cart quantity is the number of four-packs. Metadata stays on the specific cart item and includes the Studio design ID, pack size, dimensions, construction, colours, text and fonts, preview link, and editable file name. Production email uses Shopify's actual paid quantity and calculates total coasters as paid packs × four. Unpaid submissions remain labelled unpaid; plain saves queue no email.

Local Place Order remains a dry run and downloads review files. Build 3.6.0 is now published at https://mysignguy.ca/pages/sign-studio?product=coaster. Public access, all three preview views, the black holder, mobile layouts, original logo and finished PNG/SVG uploads, and an unpaid plain save were verified live. No email was queued by the live verification. The Shopify page's default and Canadian template allowlists now forward `product=coaster` into the app. Product-page designer links were also verified. Real cart/checkout and paid-email delivery remain for a paid test order. Local analytics remain disabled. Release evidence is in `verification/coaster-release-360.json` and `verification/coaster-public-live-results.json`.

Checkout uses the existing [Shopify Cart API](https://shopify.dev/docs/api/ajax/reference/cart) integration and line-item properties.

The SVG contains flat, solid-colour artwork paths at the requested physical dimensions. Editable logo placement and text live in the `.SignGuy` file. The 3D view demonstrates the coaster body and flush face; it is not a production multicolour 3MF export or a physical print validation.

The original `Coaster Holder.stl` remains untouched at its supplied location. A byte-identical preview copy is bundled at `assets/coaster/coaster-holder.stl`; `assets/coaster/coaster-holder-source.json` records the source, hash, measured cavity, and coaster placement. The holder is a view option, with no holder purchase option or price added.
