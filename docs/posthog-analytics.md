# PostHog analytics

## Configure and roll out

1. RAZ Japan uses US Cloud with separate [QA](https://us.posthog.com/project/740630) and [Production](https://us.posthog.com/project/740305) projects. The website sends anonymous events after opt-in, with analytics settings on the landing, getting-started, signup and member pages. Its SDK disables replay and autocapture.
2. For an isolated QA deployment, configure Stripe test mode, enable member signup and monthly subscriptions in the test environment, and set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` to the **QA** project token and `NEXT_PUBLIC_POSTHOG_HOST` to `https://us.i.posthog.com` before building. Leave the variables unset in regular Vercel Preview and Development environments. Production and QA should use distinct origins so browser storage remains isolated.
3. Before enabling production collection, disable IP data capture in PostHog under **Settings → Project → General**. GeoIP enrichment is disabled in the browser SDK, but the QA event check showed that PostHog can still store the request IP. Verify new events omit the IP property. Then add the same variables to **Vercel Production** with the **production** project token. Redeploy and check PostHog Live Events. Remove the token and redeploy to disable browser collection. See [PostHog IP data capture settings](https://posthog.com/docs/settings/projects#ip-data-capture-configuration).

The public project token starts with `phc_`. Keep personal API keys out of `NEXT_PUBLIC_*` variables, Vercel application settings and source control.

For confirmed-payment tracking, set **Convex** variables `POSTHOG_PAYMENT_PROJECT_TOKEN` and `POSTHOG_PAYMENT_HOST` to the same project token and ingestion host as the Next.js deployment. Leave both unset for Convex deployments without analytics. Deploy Convex before publishing the Next.js changes so the checkout actions accept the new optional input. The Convex deploy adds a table for temporary attribution and requires no data backfill or Stripe changes. Remove the Convex token to disable server collection.

## Dashboard

The [QA dashboard](https://us.posthog.com/project/740630/dashboard/2365967) contains the six planned insights. Preview the dashboard definition with `node scripts/setup-posthog-dashboard.mjs --dry-run`. To provision it in another project from an authorized shell, set `POSTHOG_REGION=us`, `POSTHOG_PROJECT_ID` to the numeric project ID, and `POSTHOG_PERSONAL_API_KEY` to a key scoped to that project with `dashboard:read`, `dashboard:write`, `insight:read`, and `insight:write`. Run `node scripts/setup-posthog-dashboard.mjs` to create the dashboard and its missing insights. The command prints the dashboard URL and preserves existing insights with the same name.

The dashboard counts activity from opted-in browsers. Landing-to-checkout measures a Stripe redirect. The dashboard script also adds landing-to-confirmed-payment and checkout-to-confirmed-payment funnels. Use the checkout trend and the shorter payment funnel for people who already have an account or skip an earlier funnel step.

The UTM allowlist is in `src/lib/analytics-context.ts`. Add approved lowercase campaign slugs there before distributing campaign URLs. Named campaign reporting stays empty until those slugs are configured. Approved source and medium values work independently. Only the first approved set seen after consent is retained for the current anonymous ID.

`payment_confirmed` means Convex recorded a verified payment for an annual checkout or the first charge for a monthly add-on batch. The `annual_order_type` property identifies new seats, renewals, reactivations, and mixed annual orders. A batch emits one event regardless of the number of students. Recurring invoices, unpaid sessions, and older checkouts with no attribution do not emit. The event uses the anonymous ID and consent captured when starting checkout. If a checkout is resumed without consent, the stored attribution is removed. Withdrawing consent or signing out clears the browser ID for future activity. It cannot recall attribution for a checkout already open on Stripe. No raw order IDs, Stripe IDs, or amounts are sent to PostHog.

## Verify in QA

- Start in a clean browser. In English and Japanese, verify the page sends no PostHog requests before consent or after decline. Opt in on the landing page and confirm one landing event. Check that normal navigation, back navigation and repeat visits behave as expected.
- Complete a signup from a Get Started link and complete a direct signup in a separate browser profile. Check that successful signup sends one event and failed signup sends none.
- Open an annual checkout and a monthly checkout in separate test runs. Confirm each sends one `checkout_started` with its matching type only after Stripe returns a checkout URL. Verify failed checkout, payment recovery and opening the billing portal do not send this event.
- Complete both types of checkout in Stripe Sandbox. Verify one `payment_confirmed` per paid checkout with the same anonymous ID as `checkout_started`. Verify that leaving Stripe without returning to the success page still records the payment. Re-deliver the webhook and verify it does not add a second event. Check that a recurring monthly invoice does not emit one.
- Inspect outgoing payloads for the documented events, browser ID, locale, approved campaign properties and fixed page or checkout type. Check that URLs, referrers, member and student details, and payment identifiers are absent. Check admin and password recovery pages for unexpected traffic.
- Withdraw consent with another tab open and verify both stop sending events. Allow again and verify a new browser ID. Verify both checkout paths continue to work when the PostHog host or browser storage is blocked. Verify a regular preview produces no requests.
- Review the dashboard and event usage after the first week in production.

### Sandbox verification on November 18, 2026

Tested the local development frontend against Convex development deployment `quaint-dachshund-865` and PostHog QA project `740630`. Annual checkout passed in English and Japanese using `prod_SXpH8diltRufBp`. The initial monthly add-on payment passed in Japanese using `prod_VPFughEkfhsUT7`. PostHog recorded the browser funnel and three confirmed payments with the same anonymous browser ID. Replaying each of the first two signed Stripe checkout events twice returned HTTP 200 and added no payment events. A declined monthly test card produced no confirmed payment before a successful retry. PostHog event visibility was delayed during verification.

Checkout now waits up to 500 milliseconds for a cold SDK to queue its navigation-safe event. The added regression covers delayed and blocked SDK imports. The repeat monthly checkout was expired without payment, the Sandbox recurring subscription was canceled, and temporary development billing settings were restored. Test members, seats, orders, and QA analytics remain available for inspection. This run did not exercise a real recurring invoice or prevent the browser from returning to the success page.

References: [Next.js SDK](https://posthog.com/docs/libraries/next-js), [dashboard API](https://posthog.com/docs/api/dashboards), [insights API](https://posthog.com/docs/api/insights).
