# AGENTS.md

## Project overview

RAZ Japan is a bilingual membership and ordering application built with:

- Next.js App Router
- React and TypeScript
- Convex for data and server-side functions
- Better Auth
- Stripe
- next-intl
- Tailwind CSS
- pnpm

## Project structure

- `src/app/` — Next.js routes, layouts, route handlers, and server actions
- `src/components/` — shared React components
- `src/components/ui/` — reusable UI primitives
- `src/lib/` — shared application and integration logic
- `src/i18n/` — locale routing and internationalization configuration
- `messages/` — English and Japanese translations
- `convex/` — schema, queries, mutations, authentication, and scheduled jobs
- `scripts/` — focused regression tests and maintenance scripts
- `public/` — static assets

## Development commands

Use pnpm for all package operations.

```bash
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm format:check
```

Before completing a change:

1. Run `pnpm check`.
2. Run relevant tests with `pnpm test`.
3. Run `pnpm build` when changing routing, configuration, server/client
   boundaries, environment variables, or production behavior.
4. Report any checks that could not be run and why.

Do not fix unrelated lint, formatting, or test failures unless requested.

## Coding conventions

- Use TypeScript and preserve strict type safety.
- Do not introduce `any` merely to bypass a type error.
- Prefer `import type` for type-only imports.
- Use the existing `~/*` alias for files under `src/`.
- Follow nearby naming and file-organization patterns.
- Prefer small, focused components and functions.
- Default to Server Components. Add `"use client"` only when browser APIs,
  local state, effects, or client-side event handlers require it.
- Reuse components from `src/components/ui/` before adding new primitives.
- Use existing helpers such as `cn` rather than duplicating utilities.
- Let Prettier and the Tailwind plugin determine formatting and class order.

## Next.js boundaries

- Keep secrets and privileged operations in server-only code.
- Never import server-only modules into Client Components.
- Validate untrusted input at route-handler, server-action, and Convex
  boundaries.
- Avoid weakening environment-variable validation to make builds pass.
- When adding environment variables, update `src/env.js` and document the
  required deployment configuration.

## Convex and data changes

- Treat `convex/schema.ts` as the source of truth for stored data.
- Use Convex validators for public query and mutation arguments.
- Enforce authorization inside Convex functions; do not rely only on hidden UI.
- Reuse the existing authentication and admin guard helpers.
- Consider existing records when changing required fields or union values.
- Add indexes when a query would otherwise scan a table.
- Do not edit files under `convex/_generated/` manually.

## Authentication, payments, and security

Authentication, authorization, Stripe, activation codes, and order fulfillment
are security-sensitive areas.

- Never expose secrets, session tokens, passwords, or private user data.
- Never commit `.env` files or real credentials.
- Verify authorization for every privileged server operation.
- Preserve role checks for `user`, `admin`, `org_admin`, and `god`.
- Do not trust prices, totals, roles, user IDs, or order status supplied by the
  browser.
- Keep payment operations idempotent and verify Stripe-originated data.
- Do not log credentials or sensitive personal information.
- Add or update regression tests when changing access-control behavior.

## Internationalization

The public application supports English and Japanese.

- Do not hard-code user-facing text when the surrounding feature uses
  translations.
- Add corresponding entries to both `messages/en.json` and
  `messages/ja.json`.
- Preserve the existing locale-routing behavior.
- Keep translation keys stable unless all references and locale files are
  updated together.
- Japanese copy should read naturally; do not rely on literal
  machine-translated phrasing.

## UI and accessibility

- Match the existing visual system and responsive behavior.
- Prefer semantic HTML.
- Ensure controls have accessible labels and keyboard behavior.
- Preserve visible focus states.
- Include loading, empty, success, and error states where applicable.
- Avoid changing shared UI primitives for a single page unless the change is
  intentionally global.

## Testing expectations

Add or update tests for:

- authorization and role-boundary changes
- authentication/session behavior
- order and renewal calculations
- Stripe or fulfillment behavior
- schema-dependent business rules
- bug fixes where a regression test is practical

Test observable behavior instead of implementation details.

## Change discipline

- Make the smallest coherent change that satisfies the request.
- Do not modify generated files, lockfiles, dependencies, schemas, or public
  APIs unless the task requires it.
- Preserve unrelated work already present in the working tree.
- Do not perform destructive data migrations or production operations without
  explicit approval.
- Update documentation when setup or deployment requirements change.

## Completion summary

When finished, state:

- what changed
- which checks were run and their results
- any migrations, environment variables, or deployment steps required
- any remaining risks or follow-up work
