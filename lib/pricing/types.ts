export type PlanId = "silver" | "gold" | "platinum";
export const PLAN_IDS: PlanId[] = ["silver", "gold", "platinum"];

export type SelectedPlan = PlanId | "all_options";

export type ConcreteCondition =
  | "new_or_no_cracks"
  | "average_cracking"
  | "excessive_cracking";

export type StemWall = "none" | "up_to_6" | "over_6_to_12" | "not_sure";

export type SquareFootageTier = "50_499" | "500_799" | "800_10000";

export type DisplayMode = "range" | "starting_at";

export type PromotionMode =
  | "disabled"
  | "badge_only"
  | "fixed_discount"
  | "percent_discount";

export type PromotionAffects = "range_endpoints" | "marker_only" | "display_only";

export interface PromotionConfig {
  enabled: boolean;
  mode: PromotionMode;
  publicLabel: string;
  shortTerms: string;
  fixedAmountCents: number;
  percentage: number;
  startAt: string | null;
  endAt: string | null;
  promoCode: string | null;
  affects: PromotionAffects;
  enforceMinimumAfterPromotion: boolean;
}

export interface PlanRateCents {
  lowRateCents: number;
  highRateCents: number;
}

export interface SquareFootageTierRates {
  tier: SquareFootageTier;
  minSquareFeet: number;
  maxSquareFeet: number;
  silver: PlanRateCents;
  gold: PlanRateCents;
  platinum: PlanRateCents;
}

export interface PromotionResultFields {
  promotionEnabled: boolean;
  promotionCode: string;
  promotionLabel: string;
  promotionType: PromotionMode;
  promotionValue: number;
  promotionDisclaimer: string;
  preDiscountDisplayedRangeLow: number | null;
  preDiscountDisplayedRangeHigh: number | null;
  preDiscountDisplayedEstimatedTotal: number | null;
}

export interface PlanPricingResult extends PromotionResultFields {
  plan: PlanId;
  squareFootageTier: SquareFootageTier;

  internalLowRate: number;
  internalHighRate: number;
  internalEstimatedRate: number;

  concretePosition: number;
  stemWallAdjustment: number;
  finalPosition: number;

  rawRangeLow: number;
  rawRangeHigh: number;
  rawEstimatedTotal: number;

  displayedRangeLow: number;
  displayedRangeHigh: number;
  displayedEstimatedTotal: number;

  visualMarkerPosition: number | null;
  displayMode: DisplayMode;

  formattedRange: string;
  formattedEstimatedTotal: string;
}

export interface PricingCalculationInput {
  squareFeet: number;
  concreteCondition: ConcreteCondition;
  stemWall: StemWall;
}

export interface PricingCalculationResult {
  squareFeet: number;
  squareFootageTier: SquareFootageTier;
  concreteCondition: ConcreteCondition;
  stemWall: StemWall;
  concretePosition: number;
  stemWallAdjustment: number;
  finalPosition: number;
  pricingConfigVersion: string;
  plans: Record<PlanId, PlanPricingResult>;
}

/** Client-safe subset of a plan result — never includes internal rates. */
export interface PublicPlanPricingResult {
  plan: PlanId;
  displayedRangeLow: number;
  displayedRangeHigh: number;
  displayedEstimatedTotal: number;
  visualMarkerPosition: number | null;
  displayMode: DisplayMode;
  formattedRange: string;
  formattedEstimatedTotal: string;
  promotionEnabled: boolean;
  promotionLabel: string;
  promotionDisclaimer: string;
}

export interface PublicPricingResult {
  squareFeet: number;
  plans: Record<PlanId, PublicPlanPricingResult>;
}
