import { pricing, promotion as promotionConfig, PRICING_CONFIG_VERSION } from "@/config/estimator.config";
import { clamp, formatRange, formatWholeDollarsFromCents, roundToIncrementCents } from "@/lib/pricing/money";
import type {
  PlanId,
  PlanPricingResult,
  PricingCalculationInput,
  PricingCalculationResult,
  PromotionConfig,
  PublicPlanPricingResult,
  PublicPricingResult,
  SquareFootageTierRates,
} from "@/lib/pricing/types";
import { PLAN_IDS } from "@/lib/pricing/types";

export function resolveSquareFootageTier(squareFeet: number): SquareFootageTierRates {
  const tier = pricing.tiers.find(
    (t) => squareFeet >= t.minSquareFeet && squareFeet <= t.maxSquareFeet,
  );
  if (!tier) {
    throw new RangeError(`Square footage ${squareFeet} is outside the supported tiers.`);
  }
  return tier;
}

export function computeFinalPosition(
  concreteCondition: PricingCalculationInput["concreteCondition"],
  stemWall: PricingCalculationInput["stemWall"],
): { concretePosition: number; stemWallAdjustment: number; finalPosition: number } {
  const concretePosition = pricing.concretePositions[concreteCondition];
  const stemWallAdjustment = pricing.stemWallAdjustments[stemWall];
  const finalPosition = clamp(
    concretePosition + stemWallAdjustment,
    pricing.positionClamp.min,
    pricing.positionClamp.max,
  );
  return { concretePosition, stemWallAdjustment, finalPosition };
}

interface MinimumResolution {
  displayMode: "range" | "starting_at";
  displayedRangeLowCents: number;
  displayedRangeHighCents: number;
  displayedEstimatedTotalCents: number;
  visualMarkerPosition: number | null;
}

/**
 * Applies the $2,500 minimum-presentation rules to a rounded raw range.
 * See docs/PRICING_AND_RULES.md for the numbered rule list this implements.
 */
function applyMinimumAndDisplay(
  rawRangeLowCents: number,
  rawRangeHighCents: number,
  rawEstimatedTotalCents: number,
  minimumCents: number,
  incrementCents: number,
): MinimumResolution {
  const roundedLow = roundToIncrementCents(rawRangeLowCents, incrementCents);
  const roundedHigh = roundToIncrementCents(rawRangeHighCents, incrementCents);
  const roundedEstimate = roundToIncrementCents(rawEstimatedTotalCents, incrementCents);

  // Rule 1: entire raw range below minimum -> "Starting at $2,500", no range bar.
  if (rawRangeHighCents < minimumCents) {
    return {
      displayMode: "starting_at",
      displayedRangeLowCents: minimumCents,
      displayedRangeHighCents: minimumCents,
      displayedEstimatedTotalCents: minimumCents,
      visualMarkerPosition: null,
    };
  }

  // Rule 4 (default path): raw low already at/above minimum -> full range.
  let displayedLow = roundedLow;
  const displayedHigh = roundedHigh;
  let displayedEstimate = roundedEstimate;

  // Rule 2: raw low below minimum but raw high exceeds it -> clamp low/marker to minimum.
  if (rawRangeLowCents < minimumCents) {
    displayedLow = minimumCents;
    displayedEstimate = Math.max(minimumCents, displayedEstimate);
  }

  // Keep the marker truthfully within the displayed endpoints.
  displayedEstimate = clamp(displayedEstimate, displayedLow, displayedHigh);

  // Rule 3: minimum enforcement/rounding collapsed the range to zero width.
  if (displayedHigh <= displayedLow) {
    return {
      displayMode: "starting_at",
      displayedRangeLowCents: minimumCents,
      displayedRangeHighCents: minimumCents,
      displayedEstimatedTotalCents: minimumCents,
      visualMarkerPosition: null,
    };
  }

  const rawMarkerPosition =
    (displayedEstimate - displayedLow) / (displayedHigh - displayedLow);
  const visualMarkerPosition = clamp(rawMarkerPosition, 0.1, 0.9);

  return {
    displayMode: "range",
    displayedRangeLowCents: displayedLow,
    displayedRangeHighCents: displayedHigh,
    displayedEstimatedTotalCents: displayedEstimate,
    visualMarkerPosition,
  };
}

function applyPromotion(
  plan: PlanId,
  resolution: MinimumResolution,
  promo: PromotionConfig,
  minimumCents: number,
  incrementCents: number,
) {
  if (!promo.enabled || promo.mode === "disabled") {
    return {
      resolution,
      promotionFields: {
        promotionEnabled: false,
        promotionCode: "",
        promotionLabel: "",
        promotionType: "disabled" as const,
        promotionValue: 0,
        promotionDisclaimer: "",
        preDiscountDisplayedRangeLow: null,
        preDiscountDisplayedRangeHigh: null,
        preDiscountDisplayedEstimatedTotal: null,
      },
    };
  }

  const now = Date.now();
  const withinWindow =
    (!promo.startAt || new Date(promo.startAt).getTime() <= now) &&
    (!promo.endAt || new Date(promo.endAt).getTime() >= now);

  const baseFields = {
    promotionEnabled: true,
    promotionCode: promo.promoCode ?? "",
    promotionLabel: promo.publicLabel,
    promotionType: promo.mode,
    promotionValue: promo.mode === "percent_discount" ? promo.percentage : promo.fixedAmountCents / 100,
    promotionDisclaimer: promo.shortTerms,
  };

  if (!withinWindow || promo.mode === "badge_only" || resolution.displayMode !== "range") {
    return {
      resolution,
      promotionFields: {
        ...baseFields,
        preDiscountDisplayedRangeLow: null,
        preDiscountDisplayedRangeHigh: null,
        preDiscountDisplayedEstimatedTotal: null,
      },
    };
  }

  const discount = (cents: number) => {
    if (promo.mode === "fixed_discount") return Math.max(0, cents - promo.fixedAmountCents);
    if (promo.mode === "percent_discount")
      return Math.max(0, Math.round(cents * (1 - promo.percentage / 100)));
    return cents;
  };

  const preLow = resolution.displayedRangeLowCents;
  const preHigh = resolution.displayedRangeHighCents;
  const preEstimate = resolution.displayedEstimatedTotalCents;

  let newLow = resolution.displayedRangeLowCents;
  let newHigh = resolution.displayedRangeHighCents;
  let newEstimate = resolution.displayedEstimatedTotalCents;

  if (promo.affects === "range_endpoints") {
    newLow = discount(preLow);
    newHigh = discount(preHigh);
    newEstimate = discount(preEstimate);
  } else if (promo.affects === "marker_only") {
    newEstimate = discount(preEstimate);
  }
  // "display_only" changes no math, only UI copy.

  if (promo.enforceMinimumAfterPromotion) {
    newLow = Math.max(newLow, minimumCents);
    newHigh = Math.max(newHigh, newLow);
    newEstimate = clamp(newEstimate, newLow, newHigh);
  }

  newLow = roundToIncrementCents(newLow, incrementCents);
  newHigh = roundToIncrementCents(newHigh, incrementCents);
  newEstimate = clamp(roundToIncrementCents(newEstimate, incrementCents), newLow, newHigh);

  const visualMarkerPosition =
    newHigh > newLow ? clamp((newEstimate - newLow) / (newHigh - newLow), 0.1, 0.9) : null;

  return {
    resolution: {
      displayMode: newHigh > newLow ? ("range" as const) : ("starting_at" as const),
      displayedRangeLowCents: newLow,
      displayedRangeHighCents: newHigh,
      displayedEstimatedTotalCents: newEstimate,
      visualMarkerPosition,
    },
    promotionFields: {
      ...baseFields,
      preDiscountDisplayedRangeLow: preLow / 100,
      preDiscountDisplayedRangeHigh: preHigh / 100,
      preDiscountDisplayedEstimatedTotal: preEstimate / 100,
    },
  };
}

function calculatePlan(
  plan: PlanId,
  tier: SquareFootageTierRates,
  squareFeet: number,
  finalPosition: number,
  concretePosition: number,
  stemWallAdjustment: number,
): PlanPricingResult {
  const rate = tier[plan];
  const rawRangeLowCents = squareFeet * rate.lowRateCents;
  const rawRangeHighCents = squareFeet * rate.highRateCents;
  const rateDiffCents = rate.highRateCents - rate.lowRateCents;
  const rawEstimatedTotalCents =
    rawRangeLowCents + Math.round((rateDiffCents * squareFeet * finalPosition));
  const internalEstimatedRateCents = rate.lowRateCents + rateDiffCents * finalPosition;

  const minimum = applyMinimumAndDisplay(
    rawRangeLowCents,
    rawRangeHighCents,
    rawEstimatedTotalCents,
    pricing.minimumPresentationCents,
    pricing.roundingIncrementCents,
  );

  const { resolution, promotionFields } = applyPromotion(
    plan,
    minimum,
    promotionConfig,
    pricing.minimumPresentationCents,
    pricing.roundingIncrementCents,
  );

  const formattedRange =
    resolution.displayMode === "starting_at"
      ? `Starting at ${formatWholeDollarsFromCents(resolution.displayedRangeLowCents)}`
      : formatRange(resolution.displayedRangeLowCents, resolution.displayedRangeHighCents);

  return {
    plan,
    squareFootageTier: tier.tier,

    internalLowRate: rate.lowRateCents / 100,
    internalHighRate: rate.highRateCents / 100,
    internalEstimatedRate: internalEstimatedRateCents / 100,

    concretePosition,
    stemWallAdjustment,
    finalPosition,

    rawRangeLow: rawRangeLowCents / 100,
    rawRangeHigh: rawRangeHighCents / 100,
    rawEstimatedTotal: rawEstimatedTotalCents / 100,

    displayedRangeLow: resolution.displayedRangeLowCents / 100,
    displayedRangeHigh: resolution.displayedRangeHighCents / 100,
    displayedEstimatedTotal: resolution.displayedEstimatedTotalCents / 100,

    visualMarkerPosition: resolution.visualMarkerPosition,
    displayMode: resolution.displayMode,

    formattedRange,
    formattedEstimatedTotal: formatWholeDollarsFromCents(resolution.displayedEstimatedTotalCents),

    ...promotionFields,
  };
}

export function calculatePricing(input: PricingCalculationInput): PricingCalculationResult {
  const { squareFeet, concreteCondition, stemWall } = input;
  const tier = resolveSquareFootageTier(squareFeet);
  const { concretePosition, stemWallAdjustment, finalPosition } = computeFinalPosition(
    concreteCondition,
    stemWall,
  );

  const plans = Object.fromEntries(
    PLAN_IDS.map((plan) => [
      plan,
      calculatePlan(plan, tier, squareFeet, finalPosition, concretePosition, stemWallAdjustment),
    ]),
  ) as Record<PlanId, PlanPricingResult>;

  return {
    squareFeet,
    squareFootageTier: tier.tier,
    concreteCondition,
    stemWall,
    concretePosition,
    stemWallAdjustment,
    finalPosition,
    pricingConfigVersion: PRICING_CONFIG_VERSION,
    plans,
  };
}

/** Strips internal rate/raw fields before the result is sent to the browser. */
export function toPublicPricingResult(result: PricingCalculationResult): PublicPricingResult {
  const plans = Object.fromEntries(
    PLAN_IDS.map((plan) => {
      const p = result.plans[plan];
      const publicPlan: PublicPlanPricingResult = {
        plan: p.plan,
        displayedRangeLow: p.displayedRangeLow,
        displayedRangeHigh: p.displayedRangeHigh,
        displayedEstimatedTotal: p.displayedEstimatedTotal,
        visualMarkerPosition: p.visualMarkerPosition,
        displayMode: p.displayMode,
        formattedRange: p.formattedRange,
        formattedEstimatedTotal: p.formattedEstimatedTotal,
        promotionEnabled: p.promotionEnabled,
        promotionLabel: p.promotionLabel,
        promotionDisclaimer: p.promotionDisclaimer,
      };
      return [plan, publicPlan];
    }),
  ) as Record<PlanId, PublicPlanPricingResult>;

  return { squareFeet: result.squareFeet, plans };
}
