import { NextResponse } from "next/server";
import { consent } from "@/config/estimator.config";
import { normalizePhone } from "@/lib/address/phone";
import { calculatePricing, toPublicPricingResult } from "@/lib/pricing/engine";
import { buildEstimateCreatedPayload } from "@/lib/ghl/payload";
import { sendGhlWebhook } from "@/lib/ghl/webhook";
import { serverEnv } from "@/lib/env";
import { getEstimateRepository } from "@/lib/repository";
import { getClientIp, getRateLimiter } from "@/lib/security/rate-limit";
import { isHoneypotTripped, isSubmissionTooFast, verifyTurnstileToken } from "@/lib/security/bot-protection";
import { hashAddress, hashContact } from "@/lib/security/hash";
import { createEstimateToken } from "@/lib/security/token";
import { estimateRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = estimateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please check your answers and try again.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // --- Abuse protection -----------------------------------------------
  if (isHoneypotTripped(input.honeypot) || isSubmissionTooFast(input.formStartedAtMs)) {
    // Return a generic success-shaped rejection; never reveal bot detection.
    return NextResponse.json({ message: "Unable to process this request." }, { status: 400 });
  }

  const clientIp = getClientIp(request.headers);
  const { verified: turnstileOk } = await verifyTurnstileToken(input.turnstileToken, clientIp);
  if (!turnstileOk) {
    return NextResponse.json({ message: "Verification failed. Please try again." }, { status: 400 });
  }

  const rateLimit = await getRateLimiter(10, 60).check(`estimate:${clientIp}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  // --- Normalize --------------------------------------------------------
  const normalizedPhone = normalizePhone(input.contact.phone);
  if (!normalizedPhone) {
    return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
  }

  const estimateId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const smsConsentTimestamp = input.contact.smsConsent ? createdAt : null;

  // --- Calculate (server-authoritative) ---------------------------------
  const pricing = calculatePricing({
    squareFeet: input.squareFeet,
    concreteCondition: input.concreteCondition,
    stemWall: input.stemWall,
  });

  // --- Deliver to GHL -----------------------------------------------------
  let leadDelivered = false;
  if (serverEnv.GHL_ESTIMATE_CREATED_WEBHOOK_URL) {
    const payload = buildEstimateCreatedPayload({
      estimateId,
      eventId,
      createdAt,
      contact: {
        ...input.contact,
        phoneE164: normalizedPhone.e164,
        phoneDisplay: normalizedPhone.display,
        smsConsentTimestamp,
      },
      consentDisclosureVersion: input.consentDisclosureVersion || consent.disclosureVersion,
      address: input.address,
      squareFeet: input.squareFeet,
      stepsPresent: input.stepsPresent,
      pricing,
      attribution: input.attribution,
    });
    const delivery = await sendGhlWebhook(serverEnv.GHL_ESTIMATE_CREATED_WEBHOOK_URL, payload);
    leadDelivered = delivery.delivered;
  }

  // --- Optional persistence -----------------------------------------------
  const repository = await getEstimateRepository();
  if (repository.enabled) {
    await repository.createEstimate({
      estimateId,
      createdAt,
      updatedAt: createdAt,
      pricingConfigVersion: pricing.pricingConfigVersion,
      contact: { ...input.contact, phone: normalizedPhone.e164 },
      address: input.address,
      squareFeet: input.squareFeet,
      concreteCondition: input.concreteCondition,
      stepsPresent: input.stepsPresent,
      stemWall: input.stemWall,
      pricing,
      attribution: input.attribution,
      consentDisclosureVersion: input.consentDisclosureVersion || consent.disclosureVersion,
      smsConsentTimestamp,
      estimateCreatedDelivery: {
        attempted: Boolean(serverEnv.GHL_ESTIMATE_CREATED_WEBHOOK_URL),
        delivered: leadDelivered,
        attempts: 1,
        lastAttemptAt: createdAt,
        lastError: leadDelivered ? null : "delivery_failed_or_unconfigured",
      },
      selectedPlan: null,
      selectedAt: null,
      optionSelectedDelivery: null,
    });
  }

  // --- Signed token so /select can be verified without local PII storage --
  const estimateToken = createEstimateToken({
    estimateId,
    squareFeet: input.squareFeet,
    concreteCondition: input.concreteCondition,
    stemWall: input.stemWall,
    stepsPresent: input.stepsPresent,
    pricingConfigVersion: pricing.pricingConfigVersion,
    contactHash: hashContact(input.contact.email, normalizedPhone.e164),
    addressHash: hashAddress(input.address.formattedAddress),
    leadDelivered,
  });

  return NextResponse.json({
    estimateId,
    estimateToken,
    result: toPublicPricingResult(pricing),
    leadDelivery: { delivered: leadDelivered },
  });
}
