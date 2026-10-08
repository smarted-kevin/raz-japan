# Annual courses and monthly add-ons

Raz-Japan is an annual one-time purchase with manual renewal. Monthly products
are add-ons attached to the same owned student account, without separate student
inventory or classrooms. Each student has one add-on slot across all products,
including pending checkouts, running subscriptions, paid canceled periods, grace,
and subscriptions awaiting platform deactivation.

Missing billing models remain annual. Add-ons require an immutable
`parent_course_id` pointing to an annual course. No trials, automatic refunds,
billing-model conversion, plan switching, or learning-platform API integration.

## Pages and workflow

- `/dashboard/admin/courses`: create annual courses/add-ons, assign the parent,
  edit names, replace prices, stop/start new sales, and retry Stripe setup.
  Existing subscribers retain their purchased price. Product detail pages show
  Stripe references and related subscriptions.
- `/dashboard/admin/subscriptions`: subscriptions, payment trouble, cancellation,
  and manual platform tasks. Records paginate in batches of 100. Text/status
  filters apply to the displayed batch; global activation tasks use an index.
- Admin home: a compact "Needs attention" panel links pending platform changes
  to the Subscriptions task queue. Expand billing issues to review pending/failed
  course setup, subscription synchronization failures, and checkout errors; links
  open the relevant course, student's subscriptions, or payer's member record.
  There is no separate Billing Review tab. Existing `/dashboard/admin/billing`
  bookmarks redirect to admin home. Recovery controls remain on Courses and
  Subscriptions; checkout errors still require manual investigation.
- Member/classroom details include subscriptions; student rows link to their
  add-ons. Classroom and activation-code creation exclude monthly products.
- `/dashboard/members`: choose an add-on for an existing eligible student,
  resume checkout, inspect billing and activation separately, cancel/undo, and
  open the payer's Stripe portal for invoices, authentication and payment methods.
  Owned inactive/expired students remain visible.
- Order history and receipts identify product snapshots, monthly payments,
  purchased periods, and invoice IDs. Checkout success observes payment records;
  redirects alone never activate add-on access.

Global admins manage products and billing within existing user-access rules,
including god-account protection. Org admins have organization-scoped read access
without another payer's billing controls/portal. Only global admin/god can record
platform acknowledgments.

## Access and manual activation

Add-on payments never change annual `student.expiry_date` or `start_date`.
Subscriptions track their own paid-through date, grace, and access deadline.
Only verified paid invoices grant entitlement. Failed initial payment grants none.
Failed renewals receive seven days after the last paid period, capped by annual
expiry without shortening paid access. Recovery clears grace. Voluntary
cancellation gives no extra grace.

Administrators enable/disable the add-on on the existing account in the learning
platform, then record completion in subscription review. `platform_enabled`
records the acknowledged physical state. A mismatch with desired paid access is
a task; subsequent payments do not create duplicate enable tasks. Acknowledgments
recheck access transactionally and append administrator/timestamp audit records.
Stale acknowledgments are rejected.

Removal, suspension and reassignment are blocked while a student has pending
checkout, running billing, paid access or an enabled add-on. End billing, wait for
paid access to expire and acknowledge deactivation first. Annual renewal and
activation-code extensions remain available alongside add-ons.

## Annual expiry and Stripe cancellation

Stripe receives future `cancel_at` at the first full monthly billing boundary on
or after annual expiry. No new month starts at/after annual expiry; the last paid
month remains available in full. Boundary calculations preserve the original
Stripe anchor day/time in UTC, including month-end and leap-day behavior.

Annual renewal/code extension schedules synchronization and moves the automatic
cutoff for a still-running subscription. It never reverses member-requested
period-end cancellation or restarts ended subscriptions. Portal cancellation is
respected. Undo requires active annual enrollment.

Checkout expires no later than annual enrollment. Starts within 31 minutes of
annual expiry are rejected due to Stripe Checkout's minimum session lifetime;
renew the annual course first. Delayed webhooks, duplicate events and invoices
are idempotent; old invoices cannot shorten access. Signature errors return 400;
transient processing errors return 500 for Stripe retry.

Expiry tasks run every 15 minutes. Reads calculate access immediately; task
indexing may lag until the expiry job. Hourly reconciliation handles 50 due
subscriptions (normally due daily), recovers missed invoices and confirms expired
sessions. Monitor the backlog. Annual orders use immutable snapshots and atomic
fulfillment.

## Backend contracts

- `stripe.createProduct({ course_name, price, billing_model?, parent_course_id? })`:
  defaults annual; typed success/error results.
- `stripe.updateCoursePricing({ course_id, price })`: replacement Stripe Price.
- `stripe.updateCourseDetails({ course_id, course_name })`: application/Stripe
  names; retry the same name after a partial failure.
- `stripe.retryCourseProvisioning({ course_id })`: persisted revision retry.
- `mutations.course.setAddonParent`: missing parent only before billing records
  exist. Existing relationships are immutable.
- `subscriptions.createMonthlyCheckout({ student_id, course_id })`: authenticated
  payer; validates ownership, annual enrollment, parent, flag, price and slot.
- `billingStore.memberBilling`, `adminSubscriptions`, `checkoutStatus`: authorized
  state. Browser checkout never supplies payer, price or Stripe identifiers.
- `subscriptions.scheduleCancellation`, `undoCancellation`, `createBillingPortal`:
  authorized Stripe controls.
- `subscriptions.resolvePayment`: only the payer may open a verified hosted
  invoice to finish payment/authentication. Administrators cannot open another
  payer's payment page.
- `billingStore.acknowledgeActivation`, `activationHistory`: manual platform audit.

## Deployment configuration

Production deployment, migration and Stripe configuration require explicit
authorization. Configure test/live environments separately; never reuse test
Customer/Product/Price IDs in production.

Set these on Convex:

- `STRIPE_SECRET_KEY` preferred, or existing `STRIPE_SANDBOX_SECRET_KEY` fallback.
- `STRIPE_WEBHOOK_SECRET` for the correct event destination.
- `SITE_URL` for trusted Checkout/Portal redirects.
- `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` for the account/mode.
- `STRIPE_ANNUAL_PRODUCT_ID` for the annual cart; legacy fallback remains.
- `MONTHLY_SUBSCRIPTIONS_ENABLED=false` until acceptance. Member UI reads the
  backend flag, so no public flag variable is needed.

Next.js variables are validated in `src/env.js`. Existing sandbox secret/public
key variables remain required and must match the server account/mode. Next.js
`.env.local` does not configure Convex. Dashboard/add-on changes add no new
environment variables beyond the earlier billing implementation.

Configure `<CONVEX_SITE_URL>/stripe/webhook` with version `2025-05-28.basil`,
matching the installed SDK, and:

- `checkout.session.completed`, `checkout.session.expired`
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`
- `customer.subscription.created`, `customer.subscription.updated`,
  `customer.subscription.deleted`

Enable card-only monthly automatic collection. Configure retries inside seven
days and cancellation when exhausted. Portal: payment-method updates, invoice
history and cancellation at period end; disable plan/quantity changes and pauses.
Use Stripe invoice/recovery/authentication emails for recurring notifications;
annual application emails remain annual. Refunds/disputes require manual review.

## Rollout and acceptance

1. Keep the flag false. After approval, deploy schema/functions and pages together.
   Regenerate Convex bindings through the approved workflow. Local schema-derived
   types cover functions exported inside the existing modules.
2. Run resumable internal `billingStore:backfillCourses` with `{}` and subsequent
   `{ cursor }` until `done`. It marks missing models annual and preserves prices,
   dates and orders.
3. Create add-ons with the correct parent and completed Stripe setup. No monthly
   student inventory is required. Existing unused monthly products can receive
   a missing parent using the guarded admin action.
4. If standalone monthly purchases exist from the previous backend, audit first.
   They need separately reviewed mappings to annual students, organization scope
   and physical activation state. Do not automatically reassign paid accounts.
   Legacy rows without organization scope are updated during reconciliation;
   review before granting org-admin access.
5. Sandbox/Test Clocks: initial/renewal payment, authentication/failure, grace and
   recovery, cancellation/reversal, platform tasks, annual renewal, price edits,
   duplicate/reordered webhooks and reconciliation. Verify annual cutoff,
   month-end/leap anchors, full paid periods crossing annual expiry and absence
   of later charges. Check the 31-minute checkout boundary.
6. After acceptance and explicit authorization, configure live and enable the
   Convex flag. Verify purchase through manual platform activation end to end.

Required local checks:

```powershell
pnpm exec node --test scripts/subscription-billing.test.mjs scripts/order-renewal.test.mjs scripts/god-user-access.test.mjs scripts/member-session.test.mjs scripts/auth-metadata.test.mjs scripts/admin-users-access.test.mjs
pnpm check
pnpm test
pnpm build
```

Offline tests execute actual handlers with transactional fixtures and fake Stripe.
They do not replace deployed Convex, authenticated browser or sandbox/Test Clock
acceptance. Administrative text/status search is batch-scoped; learning-platform
changes require an operational administrator workflow.
