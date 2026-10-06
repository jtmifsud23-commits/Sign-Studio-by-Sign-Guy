# Build 3.1.8 — payment-confirmed production brief

The approved Production brief replaces the paid email's raw settings dump with an email-width layout: paid/test status, order number, product, customer, paid quantity, saved design renders, product-specific production details, labelled colour swatches with exact codes, production attachments and a Shopify order link. Full design/order/line IDs remain in the footer. Duplicate default design titles are omitted.

Classic chains exclude inactive Spinner text, dimensions and colours. Spinner orders show each relevant field separately. LED Signs and 3D Plaques use saved dimensions and selected display colours; Plaques include individual layer depths. Bag Tags include the complete name/quantity roster, the existing quantity mismatch warning, and up to four numbered inline previews; all saved previews remain attached.

Pending-submission emails, recipients, Message-IDs, attachment loading, immutable records, payment validation, retry queues and duplicate suppression retain their existing behavior. No order was created or changed and no email was sent during layout verification. The supplied #1411 .eml was used as local preview data, not requeued.

Validation:

- 25 backend tests pass, including all products, Classic/Spinner distinction, paid quantity vs saved quantity, exact colours, HTML/style/link escaping, roster completeness, test-order warnings, and pending-email preservation.
- 21 browser layout checks pass: six sample configurations and the supplied #1411 email, each at 736px, 390px and 320px. Images resolve, previews precede production details, and there is no horizontal overflow or script error.
- JavaScript syntax, client build and `git diff --check` pass.
- `scripts/preview-payment-email.mjs` renders local previews without invoking storage, queues, SMTP or Shopify. Committed sample HTML uses sample artwork and customer information. The private #1411 fixture and screenshots remain outside the repository.
- Table-based structure, inline styles and an Outlook conditional-width wrapper support email rendering. Actual inbox rendering of the redesigned template still needs to be observed in a subsequent paid-order email; browser previews do not prove all email-client behavior.

Only the email template and visible/cache build versions changed. Build 3.1.7 remains the rollback point.
