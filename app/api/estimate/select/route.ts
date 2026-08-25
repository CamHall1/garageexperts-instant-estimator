import { NextResponse } from "next/server";
import { business, consent } from "@/config/estimator.config";
import { normalizePhone } from "@/lib/address/phone";
import { calculatePricing } from "@/lib/pricing/engine";
import { buildEstimateCreatedPayload, buildOptionSelectedPayload } from "@/lib/ghl/payload";
import { sendGhlWebhook } from "@/lib/ghl/webhook";
import { serverEnv } from "@/lib/env";
import { getEstimateRepository } from "@/lib/repository";
import { getClientIp, getRateLimiter } from "@/lib/security/rate-limit";
import { hashAddress, hashContact } from "@/lib/security/hash";
import { verifyEstimateToken } from "@/lib/security/token";
import { selectRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = selectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "That selection couldn't be processed." }, { status: 400 });
  }
  const input = parsed.data;

  const clientIp = getClientIp(request.headers);
  const rateLimit = await getRateLimiter(20, 60).check(`select:${clientIp}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const verification = verifyEstimateToken(input.estimateToken);
  if (!verification.valid) {
    return NextResponse.json(
      { message: "Your estimate has expired. Please start a new estimate." },
      { status: 410 },
    );
  }
  const tokenPayload = verification.payload;

  const normalizedPhone = normalizePhone(input.contact.phone);
  if (!normalizedPhone) {
    return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
  }

  // Re-verify the resubmitted snapshot against the signed token's hashes.
  const contactHash = hashContact(input.contact.email, normalizedPhone.e164);
  const addressHash = hashAddress(input.address.formattedAddress);
  if (
    contactHash !== tokenPayload.contactHash ||
    addressHash !== tokenPayload.addressHash ||
    input.squareFeet !== tokenPayload.squareFeet ||
    input.concreteCondition !== tokenPayload.concreteCondition ||
    input.stemWall !== tokenPayload.stemWall
  ) {
    return NextResponse.json(
      { message: "Your answers don't match this estimate. Please start a new estimate." },
      { status: 409 },
    );
  }

  // Server-authoritative recalculation -- never trust a client-posted total.
  const pricing = calculatePricing({
    squareFeet: input.squareFeet,
    concreteCondition: input.concreteCondition,
    stemWall: input.stemWall,
  });

  const repository = await getEstimateRepository();
  if (repository.enabled) {
    const reserved = await repository.recordSelection(
      tokenPayload.estimateId,
      input.selectedPlan,
      new Date().toISOString(),
      { attempted: false, delivered: false, attempts: 0, lastAttemptAt: null, lastError: null },
    );
    if (!reserved) {
      // This exact (estimate, plan) pair was already recorded -- treat as a
      // successful duplicate rather than sending a second email.
      return NextResponse.json({
        ok: true,
        duplicate: true,
        callTel: business.phoneE164,
        callDisplay: business.phoneDisplay,
      });
    }
  }

  const eventId = crypto.randomUUID();
  const selectedAt = new Date().toISOString();
  const normalizedContact = {
    ...input.contact,
    phoneE164: normalizedPhone.e164,
    phoneDisplay: normalizedPhone.display,
    smsConsentTimestamp: input.contact.smsConsent ? selectedAt : null,
  };

  // Retry the estimate-created delivery if the token shows it never landed,
  // so GHL still has the contact/estimate record even if the first attempt
  // (from /api/estimate) failed transiently.
  if (!tokenPayload.leadDelivered && serverEnv.GHL_ESTIMATE_CREATED_WEBHOOK_URL) {
    const retryPayload = buildEstimateCreatedPayload({
      estimateId: tokenPayload.estimateId,
      eventId: crypto.randomUUID(),
      createdAt: selectedAt,
      contact: normalizedContact,
      consentDisclosureVersion: consent.disclosureVersion,
      address: input.address,
      squareFeet: input.squareFeet,
      stepsPresent: input.stepsPresent,
      pricing,
      attribution: input.attribution,
    });
    await sendGhlWebhook(serverEnv.GHL_ESTIMATE_CREATED_WEBHOOK_URL, retryPayload);
  }

  let delivered = false;
  if (serverEnv.GHL_OPTION_SELECTED_WEBHOOK_URL) {
    const payload = buildOptionSelectedPayload({
      estimateId: tokenPayload.estimateId,
      eventId,
      createdAt: selectedAt,
      contact: normalizedContact,
      consentDisclosureVersion: consent.disclosureVersion,
      address: input.address,
      squareFeet: input.squareFeet,
      stepsPresent: input.stepsPresent,
      pricing,
      attribution: input.attribution,
      selectedPlan: input.selectedPlan,
      selectionStatus: "selected",
      selectedAt,
      selectionSource: input.selectionSource,
    });
    const delivery = await sendGhlWebhook(serverEnv.GHL_OPTION_SELECTED_WEBHOOK_URL, payload);
    delivered = delivery.delivered;
  }

  if (repository.enabled) {
    await repository.recordSelection(tokenPayload.estimateId, input.selectedPlan, selectedAt, {
      attempted: Boolean(serverEnv.GHL_OPTION_SELECTED_WEBHOOK_URL),
      delivered,
      attempts: 1,
      lastAttemptAt: selectedAt,
      lastError: delivered ? null : "delivery_failed_or_unconfigured",
    });
  }

  return NextResponse.json({
    ok: true,
    duplicate: false,
    callTel: business.phoneE164,
    callDisplay: business.phoneDisplay,
  });
}
