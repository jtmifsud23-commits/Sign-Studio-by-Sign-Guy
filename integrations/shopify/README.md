# Sign Studio cart migration (3.1.3)

`sg-studio-cart-cleanup.js` is deployed as a Shopify theme asset, independently of Vercel.
The live theme is 158149116044 on 11a02c-d2.myshopify.com (verified October 2, 2026).

In `layout/theme.liquid`, add `data-sg-cart-root="{{ routes.root_url }}"` to `<html>`
and load the asset at the start of `<head>`:

```liquid
<script src="{{ 'sg-studio-cart-cleanup.js' | asset_url }}"></script>
{{ 'sg-studio-cart-details.css' | asset_url | stylesheet_tag }}
```

Also upload `sg-studio-cart-details.css`; it wraps long property labels only on
cart items with a Studio preview link, including the cart drawer.
The early script registers purchase guards before the theme's form handlers.
It removes only the enumerated legacy Studio cart attributes when a `.SignGuy`
file marker identifies them. Item properties, quantities, notes, gift fields,
and other app attributes are preserved. Failed cleanup stops standard checkout
and permits retry. Accelerated wallet clicks are never replayed synthetically;
if clicked before initial cleanup finishes, the user is asked to select the
payment button again. Direct checkout outside the storefront theme cannot run
this migration; new app submissions no longer create cart-level Studio data.

Checks:

- `node verification/check-cart-cleanup.mjs`
- `node verification/check-chain-submission.mjs`
- `verification/check-chain-order.js` in a localhost browser (no email/checkout)
- `verification/check-live-cart.js` in an isolated, empty Shopify test cart

The latter adds two test items. Remove those test items and test gift-note after
verification. It must never run in a customer's active browser cart.

Deployment backup and rendered cart screenshots are in the sibling
`../chain-order-fix/` workspace directory. Historical orders are not migrated.
