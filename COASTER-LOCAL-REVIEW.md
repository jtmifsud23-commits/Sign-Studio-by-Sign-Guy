# Custom Coasters — local review

Open http://127.0.0.1:8782/?product=coaster. The preview server is bound to this computer only.

To restart it from this directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-coaster-preview.ps1
```

This is a separate checkout on `codex/coaster-designer`, based on published baseline `895adce`. The original checkout remains at `C:\Users\johnm\Documents\SIGN STUDIO\sign-studio-locker-local-preview`. Nothing has been deployed or pushed.

## Review flow

1. Upload a PNG, JPEG, WebP, or SVG logo.
2. Use the adapted Locker Room circle editor: place/crop the logo, resize, move, centre, change the background, and add independent text boxes. Fonts, text size in millimetres, colours, multiline text, drag handles, and keyboard movement are available.
3. Review the colour conversion, adjust mapping, and confirm.
4. Use the standard colour swatches and Top / 4-pack views. The four-pack view shows three coasters stacked flat with a fourth leaning against the stack, matching the supplied reference. All four remain the same physical size.
5. Save a `.SignGuy` project, reopen it through the folder button or saved-design card, and use Edit design to continue editing.
6. Download artwork to obtain the finished circle as PNG and SVG.

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
- `node --test tests/*.test.js`: all 32 existing tests pass.
- Four-pack geometry measured 101.660003662 mm × 101.660003662 mm × 4.000000000 mm per body (normal floating-point vertex precision).
- Screenshots and machine-readable results are in `verification/coaster-*`.

## Publication boundary

This implements the local designer and review exports. Coaster checkout, pricing, cloud upload, paid-order metadata, and production email integration are not connected. The action button downloads artwork. Local analytics are disabled. No live site, Shopify product, or deployment was changed.

The SVG contains flat, solid-colour artwork paths at the requested physical dimensions. Editable logo placement and text live in the `.SignGuy` file. The 3D view demonstrates the coaster body and flush face; it is not a production multicolour 3MF export or a physical print validation.
