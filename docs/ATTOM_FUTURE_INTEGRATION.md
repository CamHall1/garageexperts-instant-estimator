# Future ATTOM property-data integration

**V1 does not call ATTOM.** No live request is made, and no fake response
is fabricated anywhere in the codebase, regardless of the `ATTOM_ENABLED`
flag's value. This document describes the boundary that exists today so a
real integration can be added later without touching the intake flow.

## The boundary

[`lib/attom/provider.ts`](../lib/attom/provider.ts) defines:

```ts
interface PropertyDataProvider {
  readonly name: string;
  status(): "disabled" | "available" | "unavailable";
  lookupByAddress(address: AddressInput): Promise<PropertyFacts | null>;
}
```

- `NoopPropertyDataProvider` -- the only provider active today. Always
  returns `null` and reports `status() === "disabled"`.
- `AttomPropertyDataProvider` -- constructed but throws if called. It exists
  so the provider *shape* (constructor takes an API key, same interface as
  Noop) is settled now, before any real HTTP client code is written.
- `getPropertyDataProvider()` reads `ATTOM_ENABLED` and returns the Noop
  provider unless it is exactly `"true"`.

`ATTOM_API_KEY` is server-only and is never read outside this module.

## When a real integration is built

1. Implement `AttomPropertyDataProvider.lookupByAddress` against ATTOM's
   real API, mapping their response into `PropertyFacts` (currently
   `suggestedSquareFootage`, `yearBuilt`, `lotSizeSquareFeet` -- extend as
   needed).
2. **Never silently replace the homeowner's entered square footage.** The
   intended UX is: after the address step, optionally show a suggestion
   ("We found this property is approximately 520 sq ft -- does that sound
   right?") that the homeowner can accept or dismiss before they enter their
   own number on the square-footage step. The pricing engine must keep
   receiving whatever the homeowner ultimately confirms.
3. Wire the call into `app/api/estimate/route.ts` (or a dedicated
   `/api/property-lookup` route called right after the address step) behind
   the existing `getPropertyDataProvider()` factory -- no other file should
   need to change.
4. Add ATTOM-specific rate limiting and error handling; a provider failure
   must never block the estimator (fall back to `null`, exactly like the
   Noop provider does today).
5. Add a service-area or coverage check here if ATTOM's response includes
   parcel data useful for that -- see the "Service area" note in
   `README.md` V1 non-goals for how that would plug into the address step's
   already-normalized output.

## Why this exists now instead of later

Building the intake flow, the pricing engine, and the GHL payload against a
stable `PropertyDataProvider` interface (even with only a no-op
implementation) means none of those layers need to change shape when ATTOM
is actually added -- only this one file grows a real implementation.
