# GarageExperts of Portland -- Instant Garage Floor Estimator

A production instant-estimate tool for residential interior garage-floor
Garage FX&reg; coating projects. It doubles as a lead magnet for Meta/Google
Ads: customers get Silver/Gold/Platinum project-total ranges in under a
minute, and GarageExperts gets the lead plus a high-intent "which package"
signal, both delivered into GoHighLevel.

Runs identically as:

1. A standalone page (`/`).
2. A responsive cross-domain iframe (`/embed`), for landing pages.

## Scope and non-goals (V1)

- Residential **interior** garages only.
- All US addresses are accepted; there is no service-area rejection yet
  (normalized address data is preserved so that rule can be added later
  without redoing the intake flow).
- No property-data lookup (ATTOM) -- square footage is always
  self-reported. See `docs/ATTOM_FUTURE_INTEGRATION.md` for the boundary
  already in place for adding it later.
- No permanent app database by default -- GoHighLevel is the system of
  record. An optional Postgres adapter exists (`ESTIMATE_STORAGE_PROVIDER=postgres`)
  but nothing requires it.
- This tool produces an **instant estimate**, not a final quote, contract,
  or offer -- that framing is repeated throughout the UI and emails on
  purpose.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional locally
npm run dev
```

Open `http://localhost:3000` (standalone) or `http://localhost:3000/embed/demo`
(iframe demo). The estimator works with **no** environment variables set --
manual address entry replaces Google Places, no GHL webhook fires (results
still render), and no analytics tags load.

This repo uses **npm**, not pnpm, because the sandboxed build environment
this project was built in couldn't grant `corepack`/pnpm global-symlink
permissions without `sudo`. All commands below are npm; swap in pnpm freely
if your environment supports it, the lockfile is npm's `package-lock.json`.

## Configuration

Nearly everything business-facing lives in one typed file:
[`config/estimator.config.ts`](config/estimator.config.ts) -- business name,
phone numbers, links, the full pricing rate table and modifiers, package
copy, promotion settings, brand colors, placeholder asset paths, email
subject/preheader defaults, and the SMS consent disclosure text.

Secrets and environment-specific URLs are typed and validated in
[`lib/env.ts`](lib/env.ts) and documented in [`.env.example`](.env.example).

## Where things live

| What | Where |
|---|---|
| Pricing engine + rate table | `config/estimator.config.ts`, `lib/pricing/` -- see `docs/PRICING_AND_RULES.md` |
| Consent copy / disclosure version | `config/estimator.config.ts#consent` |
| Business claims, phone, warranty/privacy/terms links | `config/estimator.config.ts#business` |
| Estimator UI flow | `components/estimator/`, `lib/estimator/state.ts` |
| Results, comparison, trust sections | `components/results/`, `components/trust/` |
| API routes (signed-token estimate + selection) | `app/api/estimate/`, `lib/security/token.ts` |
| GHL payload building + delivery | `lib/ghl/` -- see `docs/GHL_SETUP.md` |
| Email templates | `emails/` -- see `emails/README.md` and `docs/EMAIL_IMPORT.md` |
| Embed architecture | `app/embed/`, `components/embed/`, `public/embed.js`, `lib/embed/` -- see `docs/IFRAME_EMBED.md` |
| Analytics adapter | `lib/analytics/` -- see `docs/ANALYTICS.md` |
| Optional Postgres storage | `lib/repository/` |
| ATTOM provider boundary (unused in V1) | `lib/attom/` -- see `docs/ATTOM_FUTURE_INTEGRATION.md` |

## Test commands

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # Vitest (pricing engine + component tests)
npm run build        # Next.js production build
npm run test:e2e     # Playwright critical journeys
```

## Replacing placeholder branding

Every image under `public/assets/placeholders/` is an intentionally obvious
local SVG placeholder -- see `docs/ASSET_REPLACEMENT.md` for exactly what to
edit (one config object) to swap in real photography, and how to add the
corporate Nobel/Nobel Condensed licensed fonts once available (a
`next/font/local` hook already exists; a condensed system-font fallback is
used until then).

## Deployment

See `docs/DEPLOY_VERCEL.md` for the full environment-variable checklist,
Google Maps key restriction requirements, and a post-deploy GHL smoke test.

## Full documentation index

- [`docs/PRICING_AND_RULES.md`](docs/PRICING_AND_RULES.md) -- rate table, position formula, rounding, $2,500 minimum, promotions
- [`docs/GHL_SETUP.md`](docs/GHL_SETUP.md) -- custom fields, both webhook workflows, import checklist
- [`docs/EMAIL_IMPORT.md`](docs/EMAIL_IMPORT.md) -- importing/testing the 4 HTML templates in HighLevel
- [`docs/IFRAME_EMBED.md`](docs/IFRAME_EMBED.md) -- embed snippet, postMessage contract, CSP/origin config
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) -- event taxonomy, tracking modes, PII rules
- [`docs/ATTOM_FUTURE_INTEGRATION.md`](docs/ATTOM_FUTURE_INTEGRATION.md) -- the provider boundary for a future ATTOM integration
- [`docs/ASSET_REPLACEMENT.md`](docs/ASSET_REPLACEMENT.md) -- swapping placeholder images/fonts/colors
- [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md) -- env vars, Google key restriction, GHL smoke test, rollback
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) -- manual QA checklist for shipping a change
