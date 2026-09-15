# Mobile UI audit — 2026-09-15

## Fixed
- Bag Tags was already the fifth welcome choice, but oversized cards pushed it below the phone viewport. Compact phone cards now expose all five choices at 320x568, 390x844 and 430x932.
- Tablet welcome cards also needed compaction. The 768x1024 layout retains a two-column grid with all five choices accessible.
- Bag Tag disabled-order guidance now distinguishes missing artwork, processing errors and invalid names/quantities.

## Verified locally in Chromium viewport emulation
- All five routes: LED Sign, Classic Hype Chain, Spinner Hype Chain, 3D Plaque, Bag Tags.
- At 320x568, 390x844, 430x932 and 768x1024: correct product selection, control-sheet open/close, no horizontally overflowing form controls or control-sheet content, disabled ordering without customer artwork.
- Bag Tag: Canada Soccer PNG through all three upload steps; team roster totals, focused-input caret, single/team switching, paste/remove, three distinct review images, selected-name preview, project serialization/restoration and legacy projects. Existing check-bag-team.js passed with the mobile sheet open.
- Bag checkout payload: four tags with correct names and quantities; navigation intercepted, no checkout or email sent.
- Spinner: multiword text entry, font-menu opening and selecting Bungee. Classic/Spinner switching selects the correct controls.
- Plaque: size and outdoor selection, backing-colour picker opening/closing, raised-layer controls present.
- LED: size and outdoor selection, side-colour picker opens.
- Visual screenshots inspected for the phone welcome screen, tablet welcome screen and populated Bag team editor. Browser error log empty at end of local checks.
- JavaScript syntax, build and git diff whitespace checks passed.

## Boundaries / remaining device checks
This is a UI audit, not certification of every product workflow. Physical iOS/Android touch gestures, virtual keyboards, camera/HEIC input, Safari rendering, slow connections and completed Shopify payments were not tested. Other products received navigation/layout and selected-control smoke checks; their full custom-upload, persistence and purchase paths were not repeated. Low-resolution logo edge quality remains unchanged as requested previously.

## Reproduction
Run a local server on port 8766. Use agent-browser at the listed viewports, initialize the app, and evaluate verification/audit-mobile-ui.js. For the team integration check, upload and confirm an actual Bag logo, open the mobile control sheet, then evaluate verification/check-bag-team.js. Do not run order-submission tests against production.
