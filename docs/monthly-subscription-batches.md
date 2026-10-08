# Monthly subscription checkout batches

Members open `/dashboard/members/subscriptions/add` to select up to 100 existing
students and one compatible monthly product for each. Checkout collects the first
month in one card payment. Each student then has an independent Stripe subscription
and monthly renewal charge, with the existing individual cancellation, annual
expiry, payment recovery, and manual platform activation controls.

## Deployment

1. Deploy the additive Convex schema and functions before releasing the Next.js UI.
   Regenerate Convex bindings through the CLI; do not edit generated files manually.
2. Use the existing `MONTHLY_SUBSCRIPTIONS_ENABLED`, Stripe credentials, `SITE_URL`,
   webhook endpoint, and billing portal configuration. No new environment variable
   or existing-record migration is required.
3. Keep the existing checkout completed/expired, subscription lifecycle, and invoice
   webhook events enabled. Batch checkout sessions use `monthly_batch_id` metadata
   and payment mode; they must reach monthly processing before annual fulfillment.
4. Validate a single-student and mixed-product multi-student purchase in Stripe
   sandbox, then advance renewal dates with test clocks. Confirm one initial
   payment, separate renewal invoices, no immediate duplicate charge, individual
   cancellation, annual expiry, and member/admin order history.
5. Verify the authenticated screen in English and Japanese at mobile and desktop
   widths, including keyboard selection and return from canceled checkout.

## Recovery

`monthly_checkout_batch` records immutable prices, payment references, the prepaid
period, and fulfillment state. Its linked `monthly_checkout` rows retain one
reservation per student. The hourly billing reconciliation job retries interrupted
session and subscription creation, using Stripe metadata and idempotency keys to
recover objects created before a timeout.

Paid batches retain reservations until their subscriptions are mapped. Unresolved
errors appear in the admin billing attention panel and link to the payer. Inspect
the batch's order, prepaid deadline, and Stripe objects when resolving an error;
never restart the initial checkout for an already paid batch. If the prepaid period
has ended and no Stripe subscription exists, automatic creation stops. An
administrator must determine the appropriate correction or refund using existing
operational procedures. Existing subscriptions recovered from Stripe continue to
reconcile normally.

Initial access is seeded only from a verified successful Stripe payment. Browser
success URLs and selection storage never grant access. A saved batch ID in browser
session storage supports returning from checkout; selection details are restored
through an owner-authorized Convex query.

## Regression checks

Run `pnpm check`, `pnpm test`, `pnpm build`, and:

```powershell
node --test scripts/monthly-batch.test.mjs scripts/subscription-billing.test.mjs scripts/member-session.test.mjs scripts/order-renewal.test.mjs scripts/admin-attention.test.mjs
```

The Node regression scripts run independently of the repository's Jest setup.
