# Analytics and conversion tracking

Provider-neutral adapter: [`lib/analytics/adapter.ts`](../lib/analytics/adapter.ts).
Attribution capture/persistence: [`lib/analytics/attribution.ts`](../lib/analytics/attribution.ts).
Components call `analytics.viewed()`, `analytics.leadCreated(...)`, etc. --
nothing calls `fbq`/`gtag` directly outside this one file.

## Internal event taxonomy

| Internal event | Trigger |
|---|---|
| `estimator_viewed` | Estimator rendered |
| `estimator_started` | First valid answer or interaction |
| `estimator_question_completed` | Each project question completed |
| `estimator_contact_submitted` | Valid contact form submitted |
| `estimator_lead_created` | `/api/estimate` accepted the lead and returned results |
| `estimator_results_viewed` | Results first become visible |
| `estimator_plan_selected` | Silver, Gold, or Platinum selection API call succeeds |
| `estimator_all_options_requested` | All Options request succeeds |
| `estimator_call_clicked` | Call CTA activated |
| `estimator_error` | Sanitized recoverable error |

## Paid-media mapping

**Contact submission is the primary Lead conversion** (fires only after
`/api/estimate` returns success, in `EstimatorFlow.handleContactSubmit`):

- Meta Pixel: standard `Lead` event.
- Google Ads: `conversion` event to `NEXT_PUBLIC_GOOGLE_ADS_ID` /
  `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL`.
- GA4: `estimator_lead_created`.

**Package selection is a separate high-intent event** (fires only after
`/api/estimate/select` returns success, and only for `silver`/`gold`/
`platinum` -- never for `all_options`):

- Meta Pixel: custom `EstimatorPackageSelected` event with `{ plan }` only.
- Google Ads: `conversion` event to `NEXT_PUBLIC_GOOGLE_ADS_SELECTION_LABEL`.
- GA4: `estimator_plan_selected`.

`all_options` is tracked as `estimator_all_options_requested` for funnel
analysis, but is deliberately **not** mapped to the package-selection
paid-media conversion -- requesting all three options is a lower-intent
signal than picking one.

Both `leadCreated` and `planSelected` take an `analyticsEventId` and
dedupe via an in-memory `Set` for the life of the page, so a retried
network call (or a defensive double-invocation) can't double-fire a pixel.

## Tracking mode: `NEXT_PUBLIC_TRACKING_MODE`

`auto | parent | child | off`, default `auto`.

- **`child`**: the page fires pixels/gtag itself. Used automatically in
  standalone mode under `auto`.
- **`parent`**: the page posts anonymous events to `window.parent` instead
  of firing any pixel itself (see the child->parent message types in
  `docs/IFRAME_EMBED.md`). Used automatically in embedded mode under `auto`,
  so the landing page's own existing tags fire off the forwarded events --
  this avoids double-counting between the child iframe and the parent page
  both firing the same Meta/Google tags.
- **`off`**: no tracking calls of any kind, in either mode.

Set this explicitly to `child` if a landing page has **no** tracking tags of
its own and you want the iframe to fire pixels directly instead of
forwarding (uncommon, but supported).

## Attribution capture

`utm_source/medium/campaign/content/term`, `gclid`, `gbraid`, `wbraid`,
`fbclid`, landing page URL, referrer, embed mode, and parent origin are
captured from `window.location` on mount and merged into `sessionStorage`
using **first-touch** semantics: once a field has a non-empty value, it is
never overwritten (not even by a later non-empty value), so a homeowner who
starts from a Google ad and later revisits organically keeps the campaign
that actually brought them in. See the doc comment on `mergeFirstTouch` in
`lib/analytics/attribution.ts`.

## PII rule

No advertising event, and no `postMessage` sent to a parent page, ever
contains full name, email, phone, full address, SMS consent, or raw project
answers (concrete condition, stem wall, square footage). Only
`estimateId`, an internal `plan` enum value, and generated event IDs cross
that boundary. Dollar totals are also not sent to advertising pixels.

## Standalone vs. embedded

- Standalone (`/`) may load Meta Pixel / GA4 / Google Ads tags directly,
  gated by whether the corresponding `NEXT_PUBLIC_*` ID env vars are set --
  the app works with all of them absent.
- Embedded (`/embed`) defaults (`auto` mode) to **parent-owned** tracking:
  it never loads a pixel script itself, it only posts anonymous events for
  `embed.js` (or your own `onEvent` handler) to forward into whatever tags
  already exist on the landing page.
