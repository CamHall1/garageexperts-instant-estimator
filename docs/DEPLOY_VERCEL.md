# Deploying to Vercel

## 1. Import the project

Push this repository to GitHub/GitLab/Bitbucket and import it in Vercel, or
run `vercel` from the repo root. Framework preset: **Next.js** (auto-detected).
Build command `next build`, install command `npm install` (this repo uses
npm -- see `README.md` for why pnpm wasn't used).

## 2. Environment variables

Set these in **Project Settings -> Environment Variables**. Mark
**Production** and **Preview** separately -- a Preview deployment typically
wants its own (or no) GHL webhook URLs so test submissions don't land in
the real sales pipeline.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Set to the deployment's own URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | See §3 below for restriction requirements |
| `NEXT_PUBLIC_META_PIXEL_ID` | No | Omit to disable Meta tracking |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` / `_LEAD_LABEL` / `_SELECTION_LABEL` | No | All three needed together for Ads conversion tracking |
| `NEXT_PUBLIC_TRACKING_MODE` | No | `auto` (default) is correct for almost every case -- see `docs/ANALYTICS.md` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Pair with `TURNSTILE_SECRET_KEY` below |
| `NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS` | Yes, if embedding | Must match `EMBED_ALLOWED_ORIGINS` below |
| `GHL_ESTIMATE_CREATED_WEBHOOK_URL` | Yes | From `docs/GHL_SETUP.md` |
| `GHL_OPTION_SELECTED_WEBHOOK_URL` | Yes | From `docs/GHL_SETUP.md` |
| `ESTIMATE_SIGNING_SECRET` | **Yes in Production** | `openssl rand -base64 32`. The app throws at request time in production if this is unset |
| `EMBED_ALLOWED_ORIGINS` | Yes, if embedding | Comma-separated landing-page origins. Enforced via CSP in `proxy.ts` |
| `ESTIMATE_STORAGE_PROVIDER` | No | `none` (default) or `postgres` |
| `DATABASE_URL` | Only if `postgres` | |
| `RATE_LIMIT_PROVIDER` | No | `none` (default) or `upstash` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Only if `upstash` | |
| `TURNSTILE_SECRET_KEY` | No | |
| `ATTOM_ENABLED` / `ATTOM_API_KEY` | No | Leave `false` -- see `docs/ATTOM_FUTURE_INTEGRATION.md` |

## 3. Google Maps key restriction

In the Google Cloud Console, restrict the Maps JS key used for
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:

- **Application restriction**: HTTP referrers, listing your production
  domain, your `*.vercel.app` preview domain pattern, and
  `http://localhost:3000/*` for local dev.
- **API restriction**: Maps JavaScript API and Places API only.

The estimator works with manual address entry if this key is missing,
invalid, or over quota -- restricting it tightly is safe.

## 4. GHL smoke test

After deploying with both webhook URLs set:

```bash
GHL_ESTIMATE_CREATED_WEBHOOK_URL=... npm run send:ghl-test estimate_created
GHL_OPTION_SELECTED_WEBHOOK_URL=... npm run send:ghl-test option_selected -- --plan=gold
```

Confirm both land in HighLevel's workflow execution log, then run one real
submission through the deployed `/` URL and confirm the contact and tags
appear as expected.

## 5. Standalone and iframe URLs

- Standalone: `https://YOUR-DOMAIN/`
- Embed (for landing pages): `https://YOUR-DOMAIN/embed`
- Embed demo (internal use only, `noindex`): `https://YOUR-DOMAIN/embed/demo`
- Parent helper script: `https://YOUR-DOMAIN/embed.js`
- Health check (non-sensitive): `https://YOUR-DOMAIN/api/health`

## 6. Rollback

Vercel keeps every deployment addressable. To roll back:

1. **Dashboard -> Deployments**, find the last known-good deployment.
2. Click **"..." -> Promote to Production**.
3. If the bad deploy also shipped a breaking env var change, fix the env
   var first (Project Settings) before promoting, since promoting reuses
   the *current* environment variables, not the ones active when that
   deployment was originally built.

No database migration is part of the default (`ESTIMATE_STORAGE_PROVIDER=none`)
deployment, so a rollback here is purely a code/config rollback -- there is
no data migration to reverse.
