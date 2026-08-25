/**
 * Sends one sample estimate_created payload (and optionally a matching
 * option_selected payload) to the configured GHL webhook URL(s), so an
 * operator can map custom fields in HighLevel without going through the
 * full UI flow. See docs/GHL_SETUP.md.
 *
 * Usage:
 *   npx tsx scripts/send-ghl-test-payload.ts estimate_created
 *   npx tsx scripts/send-ghl-test-payload.ts option_selected --plan=gold
 */
import { calculatePricing } from "../lib/pricing/engine";
import { buildEstimateCreatedPayload, buildOptionSelectedPayload } from "../lib/ghl/payload";

const eventType = process.argv[2] ?? "estimate_created";
const planArg = process.argv.find((a) => a.startsWith("--plan="));
const selectedPlan = (planArg?.split("=")[1] ?? "gold") as "silver" | "gold" | "platinum" | "all_options";

const webhookUrl =
  eventType === "option_selected"
    ? process.env.GHL_OPTION_SELECTED_WEBHOOK_URL
    : process.env.GHL_ESTIMATE_CREATED_WEBHOOK_URL;

if (!webhookUrl) {
  console.error(
    `Set ${eventType === "option_selected" ? "GHL_OPTION_SELECTED_WEBHOOK_URL" : "GHL_ESTIMATE_CREATED_WEBHOOK_URL"} before running this script.`,
  );
  process.exit(1);
}

const estimateId = crypto.randomUUID();
const createdAt = new Date().toISOString();

const pricing = calculatePricing({
  squareFeet: 500,
  concreteCondition: "new_or_no_cracks",
  stemWall: "none",
});

const sampleInput = {
  estimateId,
  createdAt,
  contact: {
    fullName: "Jordan Taylor",
    email: "jordan@example.com",
    phone: "5035551212",
    smsConsent: false,
    phoneE164: "+15035551212",
    phoneDisplay: "(503) 555-1212",
    smsConsentTimestamp: null,
  },
  consentDisclosureVersion: "corporate-2026-08",
  address: {
    formattedAddress: "1234 SE Example St, Portland, OR 97214, USA",
    addressLine1: "1234 SE Example St",
    addressLine2: "",
    city: "Portland",
    region: "OR",
    postalCode: "97214",
    country: "US",
    latitude: 45.5123,
    longitude: -122.6587,
    placeId: "sample-place-id",
    addressSource: "google_places" as const,
  },
  squareFeet: 500,
  stepsPresent: false,
  pricing,
  attribution: {
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
  },
};

const payload =
  eventType === "option_selected"
    ? buildOptionSelectedPayload({
        ...sampleInput,
        eventId: crypto.randomUUID(),
        selectedPlan,
        selectionStatus: "selected",
        selectedAt: createdAt,
        selectionSource: "results_card",
      })
    : buildEstimateCreatedPayload({ ...sampleInput, eventId: crypto.randomUUID() });

async function main() {
  console.log(`Sending ${eventType} sample payload to configured webhook...`);
  const res = await fetch(webhookUrl!, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Estimator-Schema-Version": "1.0" },
    body: JSON.stringify(payload),
  });
  console.log(`Response: ${res.status} ${res.statusText}`);
  console.log("Payload sent:");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error("Failed to send test payload:", error);
  process.exit(1);
});
