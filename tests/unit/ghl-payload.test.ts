import { describe, expect, it } from "vitest";
import { buildEstimateCreatedPayload, buildOptionSelectedPayload } from "@/lib/ghl/payload";
import { calculatePricing } from "@/lib/pricing/engine";

const pricing = calculatePricing({
  squareFeet: 500,
  concreteCondition: "new_or_no_cracks",
  stemWall: "none",
});

const contact = {
  fullName: "Jordan Taylor",
  email: "jordan@example.com",
  phone: "5035551212",
  smsConsent: true,
  phoneE164: "+15035551212",
  phoneDisplay: "(503) 555-1212",
  smsConsentTimestamp: "2026-08-25T18:30:00.000Z",
};

const address = {
  formattedAddress: "1234 SE Example St, Portland, OR 97214, USA",
  addressLine1: "1234 SE Example St",
  addressLine2: "",
  city: "Portland",
  region: "OR",
  postalCode: "97214",
  country: "US",
  latitude: 45.5123,
  longitude: -122.6587,
  placeId: "place-id",
  addressSource: "google_places" as const,
};

const attribution = {
  utmSource: "facebook",
  utmMedium: "paid_social",
  utmCampaign: "garage_floor_estimator",
  utmContent: "",
  utmTerm: "",
  gclid: "",
  gbraid: "",
  wbraid: "",
  fbclid: "",
  landingPageUrl: "https://example.com/garage-estimator",
  referrer: "https://www.google.com/",
  embedMode: true,
  parentOrigin: "https://example.com",
};

function assertFlat(payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    expect(Array.isArray(value), `${key} must not be an array`).toBe(false);
    if (value !== null && typeof value === "object") {
      throw new Error(`${key} must not be a nested object`);
    }
    expect(/^[a-z0-9_]+$/.test(key), `${key} must be snake_case`).toBe(true);
  }
}

describe("buildEstimateCreatedPayload", () => {
  const payload = buildEstimateCreatedPayload({
    estimateId: "estimate-123",
    eventId: "event-123",
    createdAt: "2026-08-25T18:30:00.000Z",
    contact,
    consentDisclosureVersion: "corporate-2026-08",
    address,
    squareFeet: 500,
    stepsPresent: false,
    pricing,
    attribution,
  });

  it("is fully flat: snake_case keys, no arrays, no nested objects", () => {
    assertFlat(payload);
  });

  it("sets event_type and correlation IDs correctly", () => {
    expect(payload.event_type).toBe("estimate_created");
    expect(payload.event_id).toBe("event-123");
    expect(payload.estimate_id).toBe("estimate-123");
  });

  it("includes per-plan rate, raw, and display fields for all three plans", () => {
    for (const plan of ["silver", "gold", "platinum"]) {
      expect(payload[`${plan}_rate_low`]).toBeDefined();
      expect(payload[`${plan}_rate_high`]).toBeDefined();
      expect(payload[`${plan}_raw_estimate`]).toBeDefined();
      expect(payload[`${plan}_display_range`]).toBeDefined();
      expect(payload[`${plan}_display_marker`]).toBeDefined();
      expect(payload[`${plan}_display_mode`]).toBeDefined();
    }
  });

  it("sends booleans as real booleans, not strings", () => {
    expect(payload.sms_consent).toBe(true);
    expect(payload.steps_present).toBe(false);
    expect(payload.embed_mode).toBe(true);
  });

  it("has an empty selected_plan and pending status before any selection", () => {
    expect(payload.selected_plan).toBe("");
    expect(payload.selection_status).toBe("pending");
  });
});

describe("buildOptionSelectedPayload", () => {
  const payload = buildOptionSelectedPayload({
    estimateId: "estimate-123",
    eventId: "event-456",
    createdAt: "2026-08-25T18:31:12.000Z",
    contact,
    consentDisclosureVersion: "corporate-2026-08",
    address,
    squareFeet: 500,
    stepsPresent: false,
    pricing,
    attribution,
    selectedPlan: "gold",
    selectionStatus: "selected",
    selectedAt: "2026-08-25T18:31:12.000Z",
    selectionSource: "results_card",
  });

  it("is fully flat", () => {
    assertFlat(payload);
  });

  it("carries the selected plan and its display fields", () => {
    expect(payload.event_type).toBe("option_selected");
    expect(payload.selected_plan).toBe("gold");
    expect(payload.selected_display_range).toBe(pricing.plans.gold.formattedRange);
    expect(payload.selected_display_marker).toBe(pricing.plans.gold.formattedEstimatedTotal);
  });

  it("repeats the full pricing snapshot for all three plans", () => {
    expect(payload.silver_display_range).toBeDefined();
    expect(payload.platinum_display_range).toBeDefined();
  });

  it("leaves selected fields blank for an all_options request", () => {
    const allOptionsPayload = buildOptionSelectedPayload({
      estimateId: "estimate-123",
      eventId: "event-789",
      createdAt: "2026-08-25T18:31:12.000Z",
      contact,
      consentDisclosureVersion: "corporate-2026-08",
      address,
      squareFeet: 500,
      stepsPresent: false,
      pricing,
      attribution,
      selectedPlan: "all_options",
      selectionStatus: "selected",
      selectedAt: "2026-08-25T18:31:12.000Z",
      selectionSource: "all_options_button",
    });
    expect(allOptionsPayload.selected_display_range).toBe("");
    expect(allOptionsPayload.selected_display_marker).toBe("");
  });
});
