import { PRICING_CONFIG_VERSION } from "@/config/estimator.config";
import { splitFullName } from "@/lib/address/name";
import type { PlanId, PricingCalculationResult, SelectedPlan } from "@/lib/pricing/types";
import type { AddressInput, AttributionInput, ContactInput } from "@/lib/validation/schemas";

/** Every value in a GHL webhook payload must be a flat primitive. */
export type FlatWebhookPayload = Record<string, string | number | boolean>;

export const SCHEMA_VERSION = "1.0";

export interface NormalizedContact extends ContactInput {
  phoneE164: string;
  phoneDisplay: string;
  smsConsentTimestamp: string | null;
}

interface BasePayloadInput {
  estimateId: string;
  createdAt: string;
  contact: NormalizedContact;
  consentDisclosureVersion: string;
  address: AddressInput;
  squareFeet: number;
  stepsPresent: boolean;
  pricing: PricingCalculationResult;
  attribution: AttributionInput;
  selectedPlan: SelectedPlan | "";
  selectionStatus: "pending" | "selected" | "auto_sent_all_options";
}

function planFields(plan: PlanId, pricing: PricingCalculationResult): FlatWebhookPayload {
  const p = pricing.plans[plan];
  return {
    [`${plan}_rate_low`]: p.internalLowRate,
    [`${plan}_rate_high`]: p.internalHighRate,
    [`${plan}_raw_low`]: p.rawRangeLow,
    [`${plan}_raw_high`]: p.rawRangeHigh,
    [`${plan}_raw_estimate`]: p.rawEstimatedTotal,
    [`${plan}_display_low`]: p.displayedRangeLow,
    [`${plan}_display_high`]: p.displayedRangeHigh,
    [`${plan}_display_estimate`]: p.displayedEstimatedTotal,
    [`${plan}_display_range`]: p.formattedRange,
    [`${plan}_display_marker`]: p.formattedEstimatedTotal,
    [`${plan}_visual_marker_position`]: p.visualMarkerPosition ?? -1,
    [`${plan}_display_mode`]: p.displayMode,
  };
}

function basePayload(input: BasePayloadInput): FlatWebhookPayload {
  const { firstName, lastName } = splitFullName(input.contact.fullName);
  const anyPlan = input.pricing.plans.gold;

  return {
    schema_version: SCHEMA_VERSION,
    pricing_config_version: PRICING_CONFIG_VERSION,
    estimate_id: input.estimateId,
    created_at: input.createdAt,

    full_name: input.contact.fullName,
    first_name: firstName,
    last_name: lastName,
    email: input.contact.email,
    phone_e164: input.contact.phoneE164,
    phone_display: input.contact.phoneDisplay,
    sms_consent: input.contact.smsConsent,
    sms_consent_timestamp: input.contact.smsConsentTimestamp ?? "",
    consent_disclosure_version: input.consentDisclosureVersion,

    formatted_address: input.address.formattedAddress,
    address_line_1: input.address.addressLine1,
    address_line_2: input.address.addressLine2 ?? "",
    city: input.address.city ?? "",
    state: input.address.region ?? "",
    postal_code: input.address.postalCode ?? "",
    country: input.address.country ?? "US",
    address_source: input.address.addressSource,
    google_place_id: input.address.placeId ?? "",
    latitude: input.address.latitude ?? 0,
    longitude: input.address.longitude ?? 0,

    square_footage: input.squareFeet,
    square_footage_tier: input.pricing.squareFootageTier,
    concrete_condition: input.pricing.concreteCondition,
    steps_present: input.stepsPresent,
    stem_wall: input.pricing.stemWall,
    concrete_position: input.pricing.concretePosition,
    stem_wall_adjustment: input.pricing.stemWallAdjustment,
    final_position: input.pricing.finalPosition,

    ...planFields("silver", input.pricing),
    ...planFields("gold", input.pricing),
    ...planFields("platinum", input.pricing),

    promotion_enabled: anyPlan.promotionEnabled,
    promotion_code: anyPlan.promotionCode,
    promotion_label: anyPlan.promotionLabel,
    promotion_type: anyPlan.promotionType,
    promotion_value: anyPlan.promotionValue,
    promotion_disclaimer: anyPlan.promotionDisclaimer,

    selected_plan: input.selectedPlan,
    selection_status: input.selectionStatus,

    utm_source: input.attribution.utmSource,
    utm_medium: input.attribution.utmMedium,
    utm_campaign: input.attribution.utmCampaign,
    utm_content: input.attribution.utmContent,
    utm_term: input.attribution.utmTerm,
    gclid: input.attribution.gclid,
    gbraid: input.attribution.gbraid,
    wbraid: input.attribution.wbraid,
    fbclid: input.attribution.fbclid,
    landing_page_url: input.attribution.landingPageUrl,
    referrer: input.attribution.referrer,
    embed_mode: input.attribution.embedMode,
    parent_origin: input.attribution.parentOrigin,
  };
}

export function buildEstimateCreatedPayload(
  input: Omit<BasePayloadInput, "selectedPlan" | "selectionStatus"> & { eventId: string },
): FlatWebhookPayload {
  return {
    event_type: "estimate_created",
    event_id: input.eventId,
    ...basePayload({ ...input, selectedPlan: "", selectionStatus: "pending" }),
  };
}

export function buildOptionSelectedPayload(
  input: BasePayloadInput & {
    eventId: string;
    selectedAt: string;
    selectionSource: "results_card" | "all_options_button";
  },
): FlatWebhookPayload {
  const plan = input.selectedPlan;
  const selectedRangeFields =
    plan
      ? plan === "all_options"
        ? { selected_display_range: "", selected_display_marker: "" }
        : {
            selected_display_range: input.pricing.plans[plan].formattedRange,
            selected_display_marker: input.pricing.plans[plan].formattedEstimatedTotal,
          }
      : { selected_display_range: "", selected_display_marker: "" };

  return {
    event_type: "option_selected",
    event_id: input.eventId,
    ...basePayload({ ...input, selectionStatus: "selected" }),
    selected_at: input.selectedAt,
    selection_source: input.selectionSource,
    ...selectedRangeFields,
  };
}
