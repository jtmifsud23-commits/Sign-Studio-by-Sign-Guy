# Sign Studio Build 3.1.7 — releases 1 and 2

## Implemented

- Each finalized upload creates an immutable, private record at `studio/designs/<designId>.json`. The uploaded `.SignGuy` file supplies the product, customer, complete settings and Bag Tag roster. The record also identifies the private artwork/project/screenshot files and signed front preview.
- Every Shopify checkout line carries `_Studio design ID`. Missing/unconfirmed IDs prevent checkout. Existing variants, prices, quantities, line summaries, previews and native cart handoff remain in place.
- `/api/save-project` waits for private persistence and queue acceptance, but never waits for SMTP. Plain saves do not send order emails. Checkout submissions queue a message headed **Design submitted — checkout pending**.
- `/api/shopify/orders-paid` uses a Web Standard handler to validate HMAC against original request bytes, the configured shop, `orders/paid`, and `financial_status=paid`. It persists a minimal paid receipt, queues processing and acknowledges Shopify. Shipping addresses and payment details are excluded from persisted receipts.
- Paid processing maps each Studio line back to its saved record, stores the real Shopify order ID/name and paid quantity, and queues **Payment confirmed** emails with the production attachments. Non-Studio/legacy lines are ignored. Test orders say **do not produce**. Bag roster/order quantity differences are flagged.
- Two private Vercel queue consumers retry failures with bounded backoff, retaining queue messages for seven days. Immutable jobs, sent-state checks and conditional Blob leases suppress ordinary duplicate/replayed deliveries. A retry helper is available for retained records after queue expiry.
- Local testing downloads files for review and does not enter real Shopify checkout with an unsaved design ID. Repeated Place Order calls are guarded.

## Verified locally

- `pnpm test`: 18 passing tests covering four products, immutable/repeated/concurrent saves, invalid files/customer, abandoned checkout, email/queue outages, lease recovery, signed/tampered events, configured shop URL normalization, paid state, mixed carts, replay suppression, missing-record recovery, complete team rosters and test-order labels.
- `verification/check-release-1-2.cjs`: 12 checkout scenarios at 1440px and 390px: LED, Plaque, Classic, Spinner, single Bag Tag and team Bag Tags. Real browser compaction/upload/handoff code runs against mocked private upload/save boundaries. IDs, quantities, variants, previews and roster/text properties survive; missing IDs block navigation. No browser script errors.
- Syntax checks, client build and `git diff --check` pass.
- `verification/order-email-release-1-2-preview.html` shows sample pending/paid emails; it sends no messages and creates no Shopify orders.

## Remaining configuration and live acceptance

1. Completed: the merchant saved **SHOPIFY_WEBHOOK_SECRET** directly in this Vercel project's Production environment. A manually created webhook uses this shop signing secret, not the app's `SHOPIFY_CLIENT_SECRET`.
2. Completed: Build 3.1.6 was published and one Shopify **Order payment / JSON / 2026-07** webhook was activated at `https://sign-studio-by-sign-guy.vercel.app/api/shopify/orders-paid`. The initial Shopify test passed HMAC validation but exposed a configured shop URL (`http://.../`) mismatch. Build 3.1.7 normalizes that setting to its exact hostname, while still rejecting other shops; publish it and repeat the signed test.
3. Confirm both queue consumers are deployed and a small submitted design produces a queued pending email without SMTP delaying checkout.
4. Use a Shopify test order carrying a real saved Studio ID; verify receipt → payment link → sent job → actual staff email with matching order and attachments. Re-delivery should not send an additional completed notice. Do not manufacture or mark a real customer order as paid for testing.
5. Verify an abandoned checkout remains pending, plus a mixed cart and team-tag quantities. Verify live mobile/desktop assets and Build 3.1.7.

## Operational boundaries

- A storage or queue-ingestion outage can still prevent safe checkout finalization; the design/job is retained where persistence succeeded. SMTP outages no longer prevent checkout.
- Queue expiry is seven days. Saved design, payment and job records outlive queue messages. In a trusted runtime with project credentials, `node scripts/retry-studio-notification.mjs email|payment <id>` republishes an unfinished record.
- SMTP cannot provide transactional exactly-once delivery with Blob state. A worker crash after SMTP accepted a message but before `sent` was persisted can cause a duplicate; stable Message-ID and the sent ledger reduce ordinary duplicates but do not eliminate that crash window.
- Pending and paid messages can arrive out of order while an earlier SMTP attempt retries. Their explicit headings/order numbers identify the stage.
- These changes support new checkout submissions with design IDs. Existing orders without those IDs are ignored by the paid handler.
- Production publication, signing-secret entry and a real end-to-end Shopify/queue/mail acceptance run are separate from local mocked tests.

## References

- [Shopify merchant webhook setup](https://help.shopify.com/en/manual/orders/notifications/webhooks)
- [Shopify HTTPS delivery and HMAC validation](https://shopify.dev/docs/apps/build/webhooks/subscribe/https)
- [Vercel queue concepts, retention and deployment isolation](https://vercel.com/docs/queues/concepts)
- [Vercel private Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Vercel Web Standard function handlers](https://vercel.com/docs/functions/runtimes/node-js)
