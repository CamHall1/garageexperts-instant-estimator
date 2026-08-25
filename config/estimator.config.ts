import type {
  PromotionConfig,
  SquareFootageTierRates,
  ConcreteCondition,
  StemWall,
} from "@/lib/pricing/types";

/**
 * Central, typed configuration for the GarageExperts Instant Estimator.
 *
 * This is the single source of truth for business copy, pricing rates,
 * modifiers, brand tokens, and links. Components and the pricing engine
 * must read from here rather than duplicating literals. Secrets (webhook
 * URLs, signing keys, API keys) live only in environment variables and are
 * never imported into client bundles — see lib/env.ts.
 */

// ---------------------------------------------------------------------------
// Business identity
// ---------------------------------------------------------------------------

export const business = {
  name: "GarageExperts of Portland",
  shortName: "GarageExperts",
  locationName: "Portland, OR",
  phoneDisplay: "(503) 994-1227",
  phoneE164: "+15039941227",
  websiteUrl: "https://www.garageexperts.com/portland-or/",
  privacyUrl: "https://www.garageexperts.com/privacy-policy/",
  // Verified against the live site footer: the "acceptable use" terms link
  // points to their web provider (Scorpion), not a garageexperts.com page.
  termsUrl: "https://www.scorpion.co/acceptable-use-policy/",
  warrantyUrl: "https://www.garageexperts.com/why-us/warranty/",
  defaultCountry: "US",
} as const;

// ---------------------------------------------------------------------------
// Address intake
// ---------------------------------------------------------------------------

export const addressConfig = {
  /** Bias, not restrict — all US addresses are accepted in V1. */
  bias: {
    lat: 45.5152,
    lng: -122.6784,
    radiusMeters: 50000,
  },
  countryRestrictions: ["us"] as const,
} as const;

// ---------------------------------------------------------------------------
// Square footage bounds
// ---------------------------------------------------------------------------

export const squareFootage = {
  min: 50,
  max: 10000,
} as const;

// ---------------------------------------------------------------------------
// Pricing configuration
// ---------------------------------------------------------------------------

/**
 * Bump this whenever the rate table, positions, or modifiers change so GHL
 * payloads and stored records can be traced to the pricing rules that
 * produced them.
 */
export const PRICING_CONFIG_VERSION = "2026-08-25";

export const pricing = {
  configVersion: PRICING_CONFIG_VERSION,
  minimumPresentationCents: 250_000, // $2,500
  roundingIncrementCents: 5_000, // $50
  positionClamp: { min: 0.1, max: 0.9 },

  /** Internal dollars-per-square-foot. Never rendered to customers. */
  tiers: [
    {
      tier: "50_499",
      minSquareFeet: 50,
      maxSquareFeet: 499,
      silver: { lowRateCents: 675, highRateCents: 775 },
      gold: { lowRateCents: 750, highRateCents: 825 },
      platinum: { lowRateCents: 775, highRateCents: 850 },
    },
    {
      tier: "500_799",
      minSquareFeet: 500,
      maxSquareFeet: 799,
      silver: { lowRateCents: 650, highRateCents: 750 },
      gold: { lowRateCents: 700, highRateCents: 775 },
      platinum: { lowRateCents: 750, highRateCents: 825 },
    },
    {
      tier: "800_10000",
      minSquareFeet: 800,
      maxSquareFeet: 10_000,
      silver: { lowRateCents: 625, highRateCents: 700 },
      gold: { lowRateCents: 650, highRateCents: 750 },
      platinum: { lowRateCents: 675, highRateCents: 775 },
    },
  ] satisfies SquareFootageTierRates[],

  concretePositions: {
    new_or_no_cracks: 0.2,
    average_cracking: 0.5,
    excessive_cracking: 0.8,
  } satisfies Record<ConcreteCondition, number>,

  stemWallAdjustments: {
    none: 0,
    up_to_6: 0.05,
    over_6_to_12: 0.1,
    not_sure: 0.05,
  } satisfies Record<StemWall, number>,
} as const;

export const mostPopularPlan = "gold" as const;

// ---------------------------------------------------------------------------
// Promotion configuration — disabled by default
// ---------------------------------------------------------------------------

export const promotion: PromotionConfig = {
  enabled: false,
  mode: "disabled",
  publicLabel: "",
  shortTerms: "",
  fixedAmountCents: 0,
  percentage: 0,
  startAt: null,
  endAt: null,
  promoCode: null,
  affects: "display_only",
  enforceMinimumAfterPromotion: true,
};

// ---------------------------------------------------------------------------
// Package content
// ---------------------------------------------------------------------------

export interface PackageContent {
  id: "silver" | "gold" | "platinum";
  name: string;
  positioningLine: string;
  buttonLabel: string;
  emailValueStatement: string;
  features: string[];
  emailFeatures: string[];
}

export const packages: Record<"silver" | "gold" | "platinum", PackageContent> = {
  silver: {
    id: "silver",
    name: "Silver",
    positioningLine: "The essential Garage FX® system",
    buttonLabel: "Select Silver",
    emailValueStatement:
      "Our trusted Garage FX foundation for a clean, durable residential garage.",
    features: [
      "Professional concrete surface preparation",
      "Garage FX® fusing epoxy primer/base",
      "Full broadcast standard chip-flake blend",
      "One polyaspartic topcoat",
      "Durable, easy-to-clean finished surface",
      "Applicable residential limited lifetime warranty, subject to official terms",
    ],
    emailFeatures: [
      "Garage FX fusing primer",
      "Full-broadcast standard chip flake",
      "One polyaspartic topcoat",
    ],
  },
  gold: {
    id: "gold",
    name: "Gold",
    positioningLine: "Added strength for everyday durability",
    buttonLabel: "Select Gold",
    emailValueStatement:
      "Our Most Popular upgrade for homeowners who want added strength and durability.",
    features: [
      "Everything in Silver",
      "A second polyaspartic topcoat",
      "Added build, strength, and durability for a garage that sees regular use",
    ],
    emailFeatures: [
      "Everything in Silver",
      "A second polyaspartic topcoat",
      "Added wear and protection",
    ],
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    positioningLine: "The premium showroom-ready finish",
    buttonLabel: "Select Platinum",
    emailValueStatement:
      "Our showroom-ready premium finish with upgraded flake and topcoat protection.",
    features: [
      "Everything in Gold",
      "Premium Brindle flake upgrade",
      "A more refined, showroom-ready appearance",
      "The added protection of the double polyaspartic topcoat",
    ],
    emailFeatures: ["Everything in Gold", "Premium Brindle flake", "Elevated showroom appearance"],
  },
};

export const cardDisclaimer =
  "General estimate based on your answers. Final pricing requires an on-site inspection and verified measurements.";

export const emailCardDisclaimer =
  "General estimate based on the information provided. Final pricing requires an on-site inspection and written proposal.";

export const fullResultDisclaimer =
  "This instant estimate is provided for general planning purposes based on the information entered. It is not a final quote, contract, or offer. Final pricing requires an on-site inspection, verified measurements, and review of the concrete and project conditions. Pricing may change based on actual square footage, moisture conditions, existing coatings or contaminants, cracking and repairs, vertical surfaces, access, and other site-specific factors. Promotions, when shown, are subject to their stated terms. Selecting an option indicates interest only and creates no obligation.";

export const selectionDisclaimer =
  "Selecting an option tells our team what interests you most. It does not commit you to purchase.";

// ---------------------------------------------------------------------------
// Comparison / process / trust content
// ---------------------------------------------------------------------------

export const comparisonRows = [
  { label: "Professional surface preparation", silver: true, gold: true, platinum: true },
  { label: "Garage FX® epoxy primer/base", silver: true, gold: true, platinum: true },
  { label: "Standard chip flake", silver: true, gold: true, platinum: true },
  { label: "Polyaspartic topcoat", silver: true, gold: true, platinum: true },
  { label: "Double Top Coat", silver: false, gold: true, platinum: true },
  { label: "Premium Brindle flake", silver: false, gold: false, platinum: true },
  { label: "Easy-clean finish", silver: true, gold: true, platinum: true },
  {
    label: "Residential limited lifetime coverage, subject to terms",
    silver: true,
    gold: true,
    platinum: true,
  },
] as const;

export const processSteps = [
  {
    title: "Free on-site inspection and verified measurements",
    description:
      "A local GarageExperts professional confirms your project details in person.",
  },
  {
    title: "Concrete preparation and required repairs",
    description: "The slab is prepared and any necessary repairs are addressed.",
  },
  {
    title: "Garage FX® system installation",
    description: "Your chosen system is professionally installed.",
  },
  {
    title: "Final walkthrough and care guidance",
    description:
      "We review the finished floor and how to care for it. Many residential installations can be completed in as little as one day, subject to project conditions.",
  },
] as const;

export const trustProofPoints = [
  "Garage FX® combines a fusing epoxy base with a polyaspartic finish.",
  "More than 80 million square feet installed across the national GarageExperts network.",
  "More than 140 styles and color options.",
  "American-made products.",
  "Locally owned service backed by a national brand with 100+ locations nationwide.",
  "Residential floor-coating materials carry limited lifetime coverage against peeling/delamination for the original purchaser's ownership period, subject to the written warranty.",
] as const;

// ---------------------------------------------------------------------------
// Cabinets cross-sell -- shown at the end of the results page and every
// estimate email. Content sourced from GarageExperts' Cabinets Edition
// magazine; the "Learn More" CTA links to the full Garage Code magazine
// (com.garageexperts.files.fc S3 bucket).
// ---------------------------------------------------------------------------

export const cabinetsCrossSell = {
  heading: "Complete the Transformation with Custom Cabinets",
  body: "Your floor is protected -- now take control of the walls. GarageExperts® custom cabinet systems are made in the USA and built for real garage conditions, with 18 finishes to match your new floor.",
  bullets: [
    "18 cabinet colors, made in the USA",
    "¾-inch or 1-inch adjustable shelves built to support serious weight",
    "Soft-close European-style hinges and full-extension drawer slides",
    "Full backs and industrial-strength edgebanding on every cabinet",
  ],
  ctaLabel: "Learn More",
  ctaUrl:
    "https://s3.us-west-1.amazonaws.com/com.garageexperts.files.fc/The-Garage-Code-Magazine-by-GarageExperts_2026.pdf",
} as const;

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------

export const brandColors = {
  black: "#000000",
  green: "#3AAD2C",
  white: "#FFFFFF",
  lightGray: "#EFEFEF",
  darkGray: "#272727",
  supportingGray: "#AFAFAF",
} as const;

// ---------------------------------------------------------------------------
// Placeholder assets — obviously replaceable, never scraped from production
// ---------------------------------------------------------------------------

export const assets = {
  // Real GarageExperts photography -- see docs/ASSET_REPLACEMENT.md for
  // provenance (magazine source pages, or client-provided files) and how
  // to swap these for different shots.
  introHero: "/assets/photos/intro-hero.jpg",
  heroFinishedFloor: "/assets/photos/finished-floor-hero.jpg",
  standardFlake: "/assets/photos/standard-flake.jpg",
  brindleFlake: "/assets/photos/brindle-flake.jpg",
  doubleTopcoat: "/assets/photos/double-topcoat.jpg",
  cabinetsHero: "/assets/photos/cabinets-hero.jpg",
  // Concrete-condition step intentionally uses line icons, not photos --
  // see components/estimator/icons.tsx -- to avoid ever implying a specific
  // crack severity via imagery ("do not use imagery that exaggerates
  // damage").
  concreteNew: "/assets/placeholders/concrete-new.svg",
  concreteAverage: "/assets/placeholders/concrete-average.svg",
  concreteExcessive: "/assets/placeholders/concrete-excessive.svg",
  // Real GarageExperts logo (client-provided). logoMark is icon + wordmark
  // only, sized for compact header use; logo is the full lockup including
  // the "High-Performance Floor Coatings / Storage Solutions" tagline, for
  // larger placements.
  logoMark: "/assets/photos/logo-mark.png",
  logo: "/assets/photos/logo.png",
} as const;

// ---------------------------------------------------------------------------
// Email defaults
// ---------------------------------------------------------------------------

export const emailDefaults = {
  silver: {
    subject: "Your Silver Garage Floor Estimate",
    preheader: "Your Silver estimate, plus Gold and Platinum for comparison.",
  },
  gold: {
    subject: "Your Gold Garage Floor Estimate",
    preheader: "See your Most Popular Gold option and compare all three systems.",
  },
  platinum: {
    subject: "Your Platinum Garage Floor Estimate",
    preheader: "Your premium Brindle flake estimate and two comparison options.",
  },
  allOptions: {
    subject: "Your Garage Floor Estimate: Three Options",
    preheader: "Compare Silver, Gold, and Platinum Garage FX flooring options.",
  },
} as const;

export const allOptionsDelayMinutes = 10;

// ---------------------------------------------------------------------------
// Consent / disclosure
// ---------------------------------------------------------------------------

export const consent = {
  disclosureVersion: "corporate-2026-08",
  smsDisclosureText:
    "By submitting, you agree to receive text messages from GarageExperts at the number provided, including those related to your inquiry, follow-ups, and review requests, via automated technology. Consent is not a condition of purchase. Msg & data rates may apply. Msg frequency may vary. Reply STOP to cancel or HELP for assistance.",
  privacyNotice:
    "The information you submit is used to prepare and follow up on your requested estimate.",
} as const;

// ---------------------------------------------------------------------------
// Analytics event names (internal taxonomy)
// ---------------------------------------------------------------------------

export const analyticsEvents = {
  estimatorViewed: "estimator_viewed",
  estimatorStarted: "estimator_started",
  estimatorQuestionCompleted: "estimator_question_completed",
  estimatorContactSubmitted: "estimator_contact_submitted",
  estimatorLeadCreated: "estimator_lead_created",
  estimatorResultsViewed: "estimator_results_viewed",
  estimatorPlanSelected: "estimator_plan_selected",
  estimatorAllOptionsRequested: "estimator_all_options_requested",
  estimatorCallClicked: "estimator_call_clicked",
  estimatorError: "estimator_error",
} as const;

export const estimatorConfig = {
  business,
  addressConfig,
  squareFootage,
  pricing,
  mostPopularPlan,
  promotion,
  packages,
  cardDisclaimer,
  emailCardDisclaimer,
  fullResultDisclaimer,
  selectionDisclaimer,
  comparisonRows,
  processSteps,
  trustProofPoints,
  brandColors,
  assets,
  emailDefaults,
  allOptionsDelayMinutes,
  consent,
  analyticsEvents,
};

export type EstimatorConfig = typeof estimatorConfig;
export default estimatorConfig;
