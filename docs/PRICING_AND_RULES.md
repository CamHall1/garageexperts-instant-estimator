# Pricing engine and business rules

Source of truth: [`config/estimator.config.ts`](../config/estimator.config.ts)
(rates, positions, modifiers, minimum, rounding) and
[`lib/pricing/engine.ts`](../lib/pricing/engine.ts) (the calculation itself).
Tests: [`tests/unit/pricing-engine.test.ts`](../tests/unit/pricing-engine.test.ts).

**Every number in this document is internal.** Customers only ever see a
project-total range, a personalized marker, or "Starting at $2,500" --
never a per-square-foot rate.

## Rate table (internal $/sq ft)

| Garage square footage | Silver low–high | Gold low–high | Platinum low–high |
| --- | ---: | ---: | ---: |
| 50–499 | $6.75–$7.75 | $7.50–$8.25 | $7.75–$8.50 |
| 500–799 | $6.50–$7.50 | $7.00–$7.75 | $7.50–$8.25 |
| 800–10,000 | $6.25–$7.00 | $6.50–$7.50 | $6.75–$7.75 |

Boundaries: 499 uses the first tier, 500 the second; 799 uses the second
tier, 800 the third.

## Position formula

```
concretePosition = { new_or_no_cracks: 0.20, average_cracking: 0.50, excessive_cracking: 0.80 }
stemWallAdjustment = { none: 0, up_to_6: 0.05, over_6_to_12: 0.10, not_sure: 0.05 }
finalPosition = clamp(concretePosition + stemWallAdjustment, 0.10, 0.90)
```

"Steps present" is not a pricing input at all -- it is not read anywhere in
`calculatePricing`, so it is structurally impossible for it to change a
price. It is still captured and sent to GHL as lead information.

## Per-plan calculation

```
estimatedRate    = lowRate + (highRate - lowRate) x finalPosition
rawRangeLow      = squareFeet x lowRate
rawRangeHigh     = squareFeet x highRate
rawEstimatedTotal = squareFeet x estimatedRate
```

### Decimal-safety and the rounding sequence

All rate values in the table are exact multiples of $0.25 and are stored as
integer **cents** (e.g. $6.75 -> `675`). `finalPosition` is always a
multiple of `0.05` in practice (from the position table above), though the
engine does not assume that. The engine computes:

```
rawRangeLowCents  = squareFeet * lowRateCents            // exact integer
rawRangeHighCents = squareFeet * highRateCents            // exact integer
rawEstimatedTotalCents =
  rawRangeLowCents + round((highRateCents - lowRateCents) * squareFeet * finalPosition)
```

This is algebraically the same as `squareFeet x estimatedRate`, but it only
introduces **one** `Math.round` (on the position-weighted delta, in cents)
instead of accumulating floating-point error across a chain of
multiplications and divisions. All three raw values (`rawRangeLow`,
`rawRangeHigh`, `rawEstimatedTotal`) are then independently rounded to the
nearest $50 using the same integer-cents half-up rule:

```
roundTo50(cents) = round(cents / 5000) * 5000   // 5000 cents = $50
```

`Math.round` in JavaScript is half-up for positive numbers (`round(0.5) ===
1`), which matches the "ordinary half-up behavior" required by the spec.
This one sequence is used everywhere -- there is no second rounding
convention anywhere else in the codebase.

## $2,500 minimum presentation

Business minimum: **$2,500**. Applied against the *raw* (unrounded) range so
boundary cases are judged before rounding noise:

1. If `rawRangeHigh < 2500`: display **"Starting at $2,500"**. No range bar;
   `visualMarkerPosition = null`; the marker/estimate value shown is $2,500.
2. Else if `rawRangeLow < 2500` (but the high end clears it): the displayed
   low is clamped to $2,500; the marker is clamped to at least $2,500 and to
   no more than the displayed high.
3. If steps 1-2 (plus rounding) leave the displayed low >= displayed high,
   fall back to "Starting at $2,500" rather than draw a zero-width bar.
4. Otherwise: show the full rounded range with no clamping.
5. For a visible range bar, the marker's *visual* position is computed from
   the **displayed** dollar values (`(estimate - low) / (high - low)`), then
   clamped to `[0.10, 0.90]` so it never touches either end of the bar. This
   only changes where the dot sits -- never the dollar figure shown next to
   it.
6. It is expected and acceptable for multiple packages on a very small
   project to all show "Starting at $2,500".
7. The GHL payload always includes the raw values, the displayed values, the
   visual marker position, and the display mode (`range` vs `starting_at`)
   for every plan, so the sales team can see exactly what happened even when
   the customer only saw "Starting at $2,500".

## Promotions

Configured in `config/estimator.config.ts` under `promotion`, **disabled by
default** (`enabled: false`, `mode: "disabled"`). When disabled, no promo UI
renders and no promo math runs -- `applyPromotion` in `lib/pricing/engine.ts`
short-circuits immediately.

When enabled:

- `mode` is one of `badge_only | fixed_discount | percent_discount`.
- `affects` controls what actually changes: `range_endpoints` (discounts the
  low/high/marker), `marker_only` (discounts only the personalized marker),
  or `display_only` (copy/badge only, no math).
- `enforceMinimumAfterPromotion` (default `true`) re-clamps the discounted
  range to the $2,500 minimum -- a promotion can never let a displayed total
  drop below it while this is on.
- Optional `startAt`/`endAt` ISO timestamps gate the discount to a window;
  outside the window the promotion behaves as disabled for math purposes
  (though `promotionEnabled`/label fields still report `true`/set, since the
  feature is configured -- only the discount application is time-gated).
- Every plan result also carries `preDiscountDisplayedRangeLow/High/
  EstimatedTotal` (before-promotion values) whenever a discount was actually
  applied, so both the customer-facing number and the pre-promo number are
  auditable in the GHL payload and any stored record.
- The corporate site's current promotion is never auto-imported; an operator
  must explicitly configure one here.

## Required output per plan

See `PlanPricingResult` in [`lib/pricing/types.ts`](../lib/pricing/types.ts)
for the full serializable shape (plan, tier, internal rates, positions, raw
values, displayed values, visual marker position, display mode, formatted
strings, and promotion fields). The client only ever receives the
`PublicPlanPricingResult` subset (`lib/pricing/engine.ts#toPublicPricingResult`) --
internal rates and raw totals never leave the server.

## Worked examples (verified by the test suite)

| Scenario | Position | Silver marker | Gold marker | Platinum marker |
| --- | --- | ---: | ---: | ---: |
| 50 sq ft, new/no cracks, no stem wall | 0.20 | Starting at $2,500 (all three) | | |
| 500 sq ft, new/no cracks, no stem wall | 0.20 | $3,350 | $3,600 | $3,850 |
| 799 sq ft, excessive cracks, 6–12in stem wall | 0.90 | ~$5,900 | ~$6,150 | ~$6,550 |
| 800 sq ft, average cracks, Not sure stem wall | 0.55 | ~$5,350 | ~$5,650 | ~$5,850 |

Run `npm run test` to re-verify these against the live engine at any time.
