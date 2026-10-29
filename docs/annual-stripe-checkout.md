# Annual Stripe checkout configuration

Annual price previews and checkout execute in `convex/stripe.ts`. Configure their
environment variables on the **Convex deployment used by the production app**.
Setting variables on the Next.js host or in `.env.local` does not configure Convex.

## Fixing `No such product`

Older code fell back to `prod_SXpH8diltRufBp` when `STRIPE_ANNUAL_PRODUCT_ID`
was missing. That product is not guaranteed to exist in another Stripe account,
sandbox, or live mode. Stripe isolates test and live objects. A deleted product or
an incorrect configured ID can produce the same error.

1. In the Stripe Dashboard, select the account and live mode intended for production.
   Verify the annual product exists and has an active, one-time JPY default price
   with the expected amount.
2. In the production Convex deployment's environment settings, set
   `STRIPE_SECRET_KEY` to a key for that account and mode, and set
   `STRIPE_ANNUAL_PRODUCT_ID` to that product's `prod_...` ID. The Stripe client
   prefers `STRIPE_SECRET_KEY` and falls back to `STRIPE_SANDBOX_SECRET_KEY` only
   when it is absent. Verify which key is actually configured; do not switch a
   production app to test credentials to work around missing live objects.
3. Verify the production `course` record has the matching `stripe_product_id`
   and default `stripe_price_id`, is active, and has annual billing and available
   student inventory. Checkout matches new students to a course by the default
   price ID. Existing renewal courses must also reference prices in the same
   Stripe account and mode. Review any imported test IDs before changing data;
   do not bulk-rewrite existing subscriptions, customers, or paid orders.
4. Deploy the updated Convex functions. The product ID is now required explicitly
   for annual billing, including legacy orders that need a new-student mapping.
   No schema migration or new environment variable is introduced.
5. Verify the annual price preview shows the expected yen amount, then initiate
   checkout and inspect its line items in Stripe before completing a payment.
   Also verify the existing webhook secret belongs to the same account/mode.

Missing or malformed product configuration now fails before a product API request.
A missing Stripe product reports that the Convex product and server key's account
and mode need checking. Other Stripe errors retain their original diagnostics.

See [Stripe API keys](https://docs.stripe.com/keys#sandbox-versus-live-mode) for
the separation between sandbox and live objects.
