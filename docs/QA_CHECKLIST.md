# QA checklist

Manual sign-off checklist before shipping a change. Automated coverage for
most of this lives in `tests/unit`, `tests/component`, and `tests/e2e` --
run `npm run test` and `npm run test:e2e` first and only manually re-check
what those don't cover (visual polish, real device behavior, third-party
service behavior).

## Core flow

- [ ] Complete the estimator on a phone-sized viewport without assistance.
- [ ] Manual address entry works with Google Maps key unset.
- [ ] Manual address entry works with Google Maps key set (via "Enter
      address manually").
- [ ] Square footage rejects `49` and `10001`; accepts `50` and `10000`.
- [ ] Selecting a concrete/steps/stem-wall card auto-advances in ~250-400ms
      and moves focus to the next heading (test with a screen reader or the
      accessibility tree, not just visually).
- [ ] Back button never clears a previously entered answer.
- [ ] Reloading the browser mid-flow restores progress; reloading *after*
      reaching Results returns to the contact step (contact info is
      intentionally not persisted) rather than showing a blank page.
- [ ] SMS consent checkbox starts unchecked and stays optional -- submitting
      without checking it still returns a successful estimate.

## Pricing

- [ ] `npm run test` passes, including every worked example in
      `docs/PRICING_AND_RULES.md`.
- [ ] A 50 sq ft / new-concrete / no-stem-wall estimate shows "Starting at
      $2,500" on all three cards.
- [ ] The visual marker never touches either end of a range bar.
- [ ] Changing Steps from No to Yes never changes any displayed price.
- [ ] No customer-facing surface (cards, comparison table, emails) ever
      shows a per-square-foot rate.

## Results and selection

- [ ] All three cards render with correct copy, Gold badged "Most Popular".
- [ ] Selecting Silver/Gold/Platinum disables all three buttons immediately
      and shows a success state + Call CTA.
- [ ] Double-clicking a selection button does not create two selection
      events (check GHL's execution log, or the Postgres `estimate_selections`
      table if enabled).
- [ ] "Send Me All Three Options" does not visually claim a specific plan
      was chosen.
- [ ] Comparison table converts to stacked groups below `sm` breakpoint
      without hiding any row.

## GHL integration

- [ ] `estimate_created` fires on every successful contact submission.
- [ ] `option_selected` fires on every successful selection, with the same
      `estimate_id` as the originating estimate.
- [ ] Killing/misconfiguring `GHL_ESTIMATE_CREATED_WEBHOOK_URL` still lets a
      customer see their results (delivery failure is swallowed and
      surfaced only in server logs + the signed token's `leadDelivered`
      flag).
- [ ] A subsequent selection retries the estimate-created delivery when the
      token shows it never landed (see `app/api/estimate/select/route.ts`).
- [ ] Full 10-minute no-selection path sends All Options exactly once
      (use a shortened wait in a staging workflow copy to test this without
      actually waiting 10 minutes).

## Embed

- [ ] `/embed/demo` shows the estimator resizing without an inner
      scrollbar as you move through steps.
- [ ] Opening `/embed` directly from an origin *not* in
      `EMBED_ALLOWED_ORIGINS` is blocked by the browser via CSP
      `frame-ancestors` (check DevTools console for the CSP violation).
- [ ] No `postMessage` payload (inspect via DevTools) contains name, email,
      phone, address, or raw project answers.

## Accessibility

- [ ] Full keyboard operation: Tab/Shift+Tab through every step, Space/Enter
      to select cards, no keyboard trap.
- [ ] All interactive targets are >= 44x44px.
- [ ] `prefers-reduced-motion: reduce` removes the auto-advance transition
      animation (the ~300ms confirmation delay itself is not an animation
      and intentionally still applies).
- [ ] Every form error is both visually shown and programmatically
      associated (`aria-describedby`) with its field.
- [ ] Test at 320px, 375x812, 768x1024, and 1440x900.

## Browser matrix

Current Chrome (desktop + Android), current Safari (desktop + iOS), current
Firefox, current Edge, and one real cross-origin iframe embed on a staging
landing-page domain.

`npm run test:e2e` runs the `chromium` and `mobile-chrome` Playwright
projects by default. A `mobile-safari` (WebKit) project is intentionally
not wired into the default run: Playwright's WebKit build is frozen on
older macOS hosts (as with the machine this project was built on) and fails
to even launch a page there. Add an `iPhone 13`-device WebKit project back
in `playwright.config.ts` and run it on a host with a current macOS/Safari
before shipping any change that touches iOS-specific behavior (the `tel:`
CTA, Places Autocomplete, or focus management are the highest-risk areas).

## Emails

- [ ] All four templates render correctly in Gmail (web + mobile), Apple
      Mail, and Outlook (or a reliable preview service like Litmus/Email on
      Acid if available).
- [ ] Readable with images blocked (there are no images in the default
      templates, so this should trivially pass -- re-check if you add one).
- [ ] Dark mode reviewed for readability in at least one client.
- [ ] Long name / long address fixture (`emails/previews/04-long-name-and-address/`)
      does not overflow or break the layout.

## Build and checks

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

None of the above should produce type errors, failing tests, console
errors, or hydration warnings before a change ships.
