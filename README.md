**Things I want to work on next**

## Local checks and regression tests

Use Node.js 22.23 or newer and pnpm. Run `pnpm check` for ESLint and TypeScript,
`pnpm test` for the regression suite, and `pnpm build` for a production build.
The tests use Node's built-in test runner and live in `scripts/*.test.mjs`.
`pnpm test:watch` reruns tests as files change. `pnpm test:coverage` uses Node's
experimental coverage reporting; the VM-based TypeScript test loaders do not
provide source-mapped application coverage, so the report is not an application
coverage threshold or a substitute for behavioral regression tests.

Jest is no longer used by these commands. No tracked CI configuration invokes
Jest. At the time of this change, GitHub exposed no Actions workflows, check
runs, repository rulesets, or protection for `main`; the latest default-branch
commit had only a Vercel status. The tracked Vercel build invokes
`pnpm build:vercel`, which does not invoke Jest. This inspection does not cover
untracked tooling or settings in external dashboards.

The unused `jest`, `ts-jest`, and `@types/jest` dependencies, `jest.config.js`,
and obsolete Jest/test-directory ignores have been removed. There were no Jest
test files to migrate; the existing Node regression tests remain in place.
Any independently maintained CI command that explicitly invokes Jest should
use `pnpm test` instead.

## Automatic Convex deployment on Vercel

`vercel.json` sets the build command to `pnpm build:vercel`, overriding the
dashboard build command. When `VERCEL_ENV=production`, this runs:

```bash
pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "pnpm build"
```

Convex builds Next.js with the target deployment URL, then pushes the functions,
schema, and indexes from the same checkout. A missing key, failed build, or failed
Convex deployment fails the Vercel build. Local `pnpm build` and Vercel preview
builds do not deploy Convex; previews retain their configured backend URL.

One-time setup:

1. In the existing Convex project's **production deployment**, open Settings >
   General and generate a production deploy key with `deployment:deploy` permission.
2. In the Vercel project, add `CONVEX_DEPLOY_KEY` as a sensitive environment
   variable scoped to **Production only**. Use the key for the same production
   backend the live application uses. Never commit it or prefix it with
   `NEXT_PUBLIC_`.
3. Verify Vercel's Git production branch is the branch used for releases and
   system environment variables are exposed (`VERCEL_ENV` must be available).
   Retain the app's other required variables, including production
   `CONVEX_DEPLOYMENT`, and configure backend secrets in Convex separately.
4. Merge this configuration into the production branch, or redeploy that commit
   as a production build. Confirm the logs show `convex deploy` and a successful
   function push, and confirm the deployment in the Convex production dashboard.

This takes effect on new builds; promoting a previously built preview without
rebuilding does not run the production build hook. Frontend and backend releases
are not atomic: if Vercel publishing fails after Convex deploys, the backend may
already be updated. Keep backend changes compatible with the currently live app;
rolling back Vercel alone does not roll back Convex functions.

References: [Convex Vercel hosting guide](https://docs.convex.dev/production/hosting/vercel)
and [Vercel buildCommand configuration](https://vercel.com/docs/project-configuration/vercel-json#buildcommand).

## Security deployment requirements

- Set `SITE_URL` to the production HTTPS origin in both the Next.js and Convex environments.
- Set `MEMBER_SIGNUP_ENABLED` in both the Next.js and Convex environments. It
  defaults to `false` and public member registration remains blocked unless it
  is explicitly set to `true` in both environments. Redeploy both services
  after changing it.
- Set the same randomly generated `CONTACT_RATE_LIMIT_SECRET` (at least 32 random bytes) in the Next.js and Convex environments. The public contact endpoint fails closed when it is missing.
- Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_INQUIRY_TO_EMAIL` for transactional and contact email delivery.
- Completed annual purchases, initial monthly checkout payments, and paid monthly invoices notify `raz@smarted.jp` with Bcc to `kevin@smarted.jp`. The notification includes the order number, purchase amount in JPY, and customer email. Deploy the Convex functions with `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` configured in Convex. No new environment variables or migration are required.
- After enabling email verification, existing accounts that have not yet verified will receive a verification link on their next sign-in attempt.

*HP*
[x] - Add how to get started route
[ ] - Revise getting-started route design
  [ ] - background gradient on banner
  [ ] - add images for easy guidance
[ ] - Add What is Raz-Japan page
[x] - Add 特定商取引法に基づく表記 page
[ ] - Review and Revise TP content

[ ] - Change color scheme
[ ] - Make new logo

*BACKEND*
[x] - Send email to admin when new order is placed
[x] - Individual order page in admin dashboard
[x] - Printable order page for individual orders

*UI/UX*
[ ] -add translations for edit dialogs and other dialog components in admin dashboard









