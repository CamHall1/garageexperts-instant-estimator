import { describe, expect, it } from "vitest";
import { calculatePricing, computeFinalPosition, resolveSquareFootageTier } from "@/lib/pricing/engine";
import type { ConcreteCondition, StemWall } from "@/lib/pricing/types";

const CONCRETE: ConcreteCondition[] = ["new_or_no_cracks", "average_cracking", "excessive_cracking"];
const STEM_WALLS: StemWall[] = ["none", "up_to_6", "over_6_to_12", "not_sure"];

describe("square footage tier boundaries", () => {
  it("499 uses the first tier, 500 uses the second", () => {
    expect(resolveSquareFootageTier(499).tier).toBe("50_499");
    expect(resolveSquareFootageTier(500).tier).toBe("500_799");
  });

  it("799 uses the second tier, 800 uses the third", () => {
    expect(resolveSquareFootageTier(799).tier).toBe("500_799");
    expect(resolveSquareFootageTier(800).tier).toBe("800_10000");
  });

  it("covers the full accepted range", () => {
    expect(resolveSquareFootageTier(50).tier).toBe("50_499");
    expect(resolveSquareFootageTier(10_000).tier).toBe("800_10000");
  });

  it("throws outside the supported range", () => {
    expect(() => resolveSquareFootageTier(49)).toThrow();
    expect(() => resolveSquareFootageTier(10_001)).toThrow();
  });
});

describe("position formula", () => {
  it("computes concrete position + stem wall adjustment, clamped 0.10-0.90", () => {
    expect(computeFinalPosition("new_or_no_cracks", "none").finalPosition).toBeCloseTo(0.2);
    expect(computeFinalPosition("average_cracking", "not_sure").finalPosition).toBeCloseTo(0.55);
    expect(computeFinalPosition("excessive_cracking", "over_6_to_12").finalPosition).toBeCloseTo(0.9);
  });

  it("never lets the position reach the extremes", () => {
    for (const concrete of CONCRETE) {
      for (const stemWall of STEM_WALLS) {
        const { finalPosition } = computeFinalPosition(concrete, stemWall);
        expect(finalPosition).toBeGreaterThanOrEqual(0.1);
        expect(finalPosition).toBeLessThanOrEqual(0.9);
      }
    }
  });
});

describe("spec worked examples", () => {
  it("case 1: 50 sq ft, new/no cracks, no stem wall -> all plans Starting at $2,500", () => {
    const result = calculatePricing({
      squareFeet: 50,
      concreteCondition: "new_or_no_cracks",
      stemWall: "none",
    });
    for (const plan of ["silver", "gold", "platinum"] as const) {
      expect(result.plans[plan].displayMode).toBe("starting_at");
      expect(result.plans[plan].displayedEstimatedTotal).toBe(2500);
      expect(result.plans[plan].visualMarkerPosition).toBeNull();
      expect(result.plans[plan].formattedRange).toBe("Starting at $2,500");
    }
  });

  it("case 2: 500 sq ft, new/no cracks, no stem wall, position 0.20", () => {
    const result = calculatePricing({
      squareFeet: 500,
      concreteCondition: "new_or_no_cracks",
      stemWall: "none",
    });
    expect(result.finalPosition).toBeCloseTo(0.2);

    expect(result.plans.silver.displayedEstimatedTotal).toBe(3350);
    expect(result.plans.silver.displayedRangeLow).toBe(3250);
    expect(result.plans.silver.displayedRangeHigh).toBe(3750);

    expect(result.plans.gold.displayedEstimatedTotal).toBe(3600);
    expect(result.plans.gold.displayedRangeLow).toBe(3500);
    expect(result.plans.gold.displayedRangeHigh).toBe(3900);

    expect(result.plans.platinum.displayedEstimatedTotal).toBe(3850);
    expect(result.plans.platinum.displayedRangeLow).toBe(3750);
    expect(result.plans.platinum.displayedRangeHigh).toBe(4150);
  });

  it("case 3: 799 sq ft, excessive cracks, 6-12in stem wall, position 0.90", () => {
    const result = calculatePricing({
      squareFeet: 799,
      concreteCondition: "excessive_cracking",
      stemWall: "over_6_to_12",
    });
    expect(result.finalPosition).toBeCloseTo(0.9);
    expect(result.plans.silver.displayedEstimatedTotal).toBeCloseTo(5900, -1);
    expect(result.plans.gold.displayedEstimatedTotal).toBeCloseTo(6150, -1);
    expect(result.plans.platinum.displayedEstimatedTotal).toBeCloseTo(6550, -1);
  });

  it("case 4: 800 sq ft, average cracks, Not sure stem wall, position 0.55", () => {
    const result = calculatePricing({
      squareFeet: 800,
      concreteCondition: "average_cracking",
      stemWall: "not_sure",
    });
    expect(result.finalPosition).toBeCloseTo(0.55);
    expect(result.plans.silver.displayedEstimatedTotal).toBeCloseTo(5350, -1);
    expect(result.plans.gold.displayedEstimatedTotal).toBeCloseTo(5650, -1);
    expect(result.plans.platinum.displayedEstimatedTotal).toBeCloseTo(5850, -1);
  });

  it("case 5: steps never change price (steps are not a pricing input at all)", () => {
    // Steps is intentionally absent from PricingCalculationInput -- the type
    // system itself guarantees it cannot affect price. This test documents
    // that guarantee at the value level for two otherwise-identical calls.
    const a = calculatePricing({ squareFeet: 600, concreteCondition: "average_cracking", stemWall: "none" });
    const b = calculatePricing({ squareFeet: 600, concreteCondition: "average_cracking", stemWall: "none" });
    expect(a).toEqual(b);
  });
});

describe("marker clamping", () => {
  it("never places the visual marker at the extreme left or right", () => {
    for (const squareFeet of [50, 100, 499, 500, 799, 800, 5000, 10_000]) {
      for (const concrete of CONCRETE) {
        for (const stemWall of STEM_WALLS) {
          const result = calculatePricing({ squareFeet, concreteCondition: concrete, stemWall });
          for (const plan of ["silver", "gold", "platinum"] as const) {
            const marker = result.plans[plan].visualMarkerPosition;
            if (marker !== null) {
              expect(marker).toBeGreaterThanOrEqual(0.1);
              expect(marker).toBeLessThanOrEqual(0.9);
            }
          }
        }
      }
    }
  });
});

describe("$50 rounding and range integrity", () => {
  it("rounds all displayed totals to the nearest $50", () => {
    for (const squareFeet of [61, 137, 512, 803, 4321, 9999]) {
      const result = calculatePricing({
        squareFeet,
        concreteCondition: "average_cracking",
        stemWall: "up_to_6",
      });
      for (const plan of ["silver", "gold", "platinum"] as const) {
        const p = result.plans[plan];
        expect(p.displayedRangeLow % 50).toBe(0);
        expect(p.displayedRangeHigh % 50).toBe(0);
        expect(p.displayedEstimatedTotal % 50).toBe(0);
      }
    }
  });

  it("never produces a low value greater than a high value", () => {
    for (const squareFeet of [50, 250, 500, 799, 800, 2000, 10_000]) {
      for (const concrete of CONCRETE) {
        for (const stemWall of STEM_WALLS) {
          const result = calculatePricing({ squareFeet, concreteCondition: concrete, stemWall });
          for (const plan of ["silver", "gold", "platinum"] as const) {
            const p = result.plans[plan];
            expect(p.displayedRangeLow).toBeLessThanOrEqual(p.displayedRangeHigh);
            expect(p.displayedEstimatedTotal).toBeGreaterThanOrEqual(p.displayedRangeLow);
            expect(p.displayedEstimatedTotal).toBeLessThanOrEqual(p.displayedRangeHigh);
          }
        }
      }
    }
  });

  it("uses Starting at $2,500 whenever the minimum collapses the range", () => {
    const result = calculatePricing({
      squareFeet: 50,
      concreteCondition: "new_or_no_cracks",
      stemWall: "none",
    });
    expect(result.plans.silver.displayMode).toBe("starting_at");
  });
});

describe("full matrix sanity", () => {
  it("produces a valid, internally consistent result for every combination", () => {
    for (let squareFeet = 50; squareFeet <= 10_000; squareFeet += 137) {
      for (const concrete of CONCRETE) {
        for (const stemWall of STEM_WALLS) {
          const result = calculatePricing({ squareFeet, concreteCondition: concrete, stemWall });
          for (const plan of ["silver", "gold", "platinum"] as const) {
            const p = result.plans[plan];
            expect(p.displayedEstimatedTotal).toBeGreaterThanOrEqual(2500);
            expect(Number.isFinite(p.displayedEstimatedTotal)).toBe(true);
          }
        }
      }
    }
  });
});
