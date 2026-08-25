# Cross-domain iframe embedding

The estimator runs identically at `/` (standalone) and `/embed`
(iframe-optimized -- same pricing logic and API routes, less page chrome).
`/embed/demo` is a local parent-page simulation you can open at
`http://localhost:3000/embed/demo` (or the deployed equivalent) to see the
whole thing working end to end, including the resize behavior.

## Landing-page snippet

```html
<iframe
  id="garageexperts-estimator"
  src="https://YOUR-VERCEL-DOMAIN/embed"
  title="GarageExperts instant garage floor estimator"
  width="100%"
  height="760"
  loading="eager"
  style="display:block;width:100%;border:0;overflow:hidden"
  allow="clipboard-write"
></iframe>
<script src="https://YOUR-VERCEL-DOMAIN/embed.js" defer></script>
```

`public/embed.js` auto-initializes any iframe with `id="garageexperts-estimator"`
or `data-ge-estimator` on `DOMContentLoaded` -- no extra wiring required for
the common case. It:

- Validates that resize/event messages come from the iframe's own origin.
- Applies safe height bounds (480px–6000px) before writing `iframe.style.height`.
- Captures the current page's UTM/click-ID params and sends them to the
  child via `init` once the child announces `ready`.
- Forwards every other event type to an optional `onEvent(type, payload)`
  callback if you call `GarageExpertsEstimator.init(iframe, { onEvent })`
  yourself instead of relying on auto-init -- use this to wire your own
  Meta/Google tags to `lead` / `selection` / `call_click` events without
  installing any pixel from this script itself.

## Responsive behavior

- The child (`/embed`) uses a `ResizeObserver` on its root element and
  posts a debounced (~120ms) `resize` message after every layout change:
  step transitions, validation messages, address suggestions, results
  expansion, and web-font/image load.
- The iframe should always be `width="100%"` with no fixed desktop width;
  the initial `height="760"` in the snippet above is just a sane first
  paint before the first `resize` message arrives.
- There should never be an inner vertical scrollbar during normal use --
  if you see one, the parent page is likely capping the iframe's height
  with its own CSS; remove that constraint.

## postMessage contract

All messages share this envelope:

```json
{
  "namespace": "garageexperts-estimator",
  "version": 1,
  "type": "resize",
  "event_id": "uuid",
  "payload": {}
}
```

Defined in [`lib/embed/protocol.ts`](../lib/embed/protocol.ts).

**Child -> parent:**

| Type | Purpose | Payload |
|---|---|---|
| `ready` | Estimator initialized | `{ version, route }` |
| `resize` | Update iframe height | `{ height }` |
| `progress` | Anonymous funnel progress | `{ step, stepKey }` |
| `lead` | Successful lead creation | `{ estimateId, analyticsEventId }` |
| `selection` | High-intent choice | `{ estimateId, plan, analyticsEventId }` |
| `call_click` | Phone CTA clicked | `{ estimateId, selectedPlan }` |
| `complete` | Flow milestone reached | `{ estimateId, completionType }` |
| `error` | Sanitized operational signal | `{ code }` |

**Parent -> child:**

| Type | Purpose | Payload |
|---|---|---|
| `init` | Initialize embed | `{ attribution, parentOrigin, prefilledAddress? }` |
| `reset` | Start over | `{ confirm }` |

None of these payloads ever contain full name, email, phone, full address,
SMS consent, or raw project answers -- see `docs/ANALYTICS.md` for the full
PII rule.

## Origin and framing security

- `EMBED_ALLOWED_ORIGINS` (server-only) is a comma-separated allowlist. The
  proxy (`proxy.ts`) sets `Content-Security-Policy: frame-ancestors
  <that list>` on `/embed` responses only -- every other route gets
  `frame-ancestors 'none'` plus `X-Frame-Options: DENY` (not sent on
  `/embed`, since it would conflict with the allowed origins there).
- `NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS` mirrors the same list for the child
  page's *client-side* check on incoming `init`/`reset` messages (origins
  aren't secret -- they're the landing-page domains themselves -- so
  duplicating the list client-side is safe; the CSP header above is the
  actual enforcement boundary).
- **Update both env vars whenever a new landing-page domain is introduced.**
  A forgotten domain will simply fail to load the iframe (blocked by CSP),
  which is the safe failure mode.
- The child never accepts executable code, arbitrary HTML, or a redirect URL
  from the parent -- `init`'s payload is a plain data object consumed only
  for attribution capture and an optional address prefill string.

## Keyboard and focus

The embed does not install a focus trap. Tab order flows in and out of the
iframe naturally via the browser's normal iframe focus handling; the
estimator's own step-to-step focus management (see
`components/estimator/StepHeading.tsx`) works identically inside or outside
an iframe.
