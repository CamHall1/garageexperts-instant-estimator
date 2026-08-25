import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import type { ConcreteCondition, StemWall } from "@/lib/pricing/types";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEV_FALLBACK_SECRET = "dev-only-insecure-estimate-signing-secret";

export interface EstimateTokenPayload {
  estimateId: string;
  squareFeet: number;
  concreteCondition: ConcreteCondition;
  stemWall: StemWall;
  stepsPresent: boolean;
  pricingConfigVersion: string;
  contactHash: string;
  addressHash: string;
  leadDelivered: boolean;
  issuedAt: number;
  expiresAt: number;
}

function getSigningSecret(): string {
  if (serverEnv.ESTIMATE_SIGNING_SECRET) return serverEnv.ESTIMATE_SIGNING_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ESTIMATE_SIGNING_SECRET must be set in production.");
  }
  console.warn(
    "[security] ESTIMATE_SIGNING_SECRET is not set. Using an insecure development fallback.",
  );
  return DEV_FALLBACK_SECRET;
}

function toBase64Url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSigningSecret()).update(payloadB64).digest("base64url");
}

export function createEstimateToken(
  payload: Omit<EstimateTokenPayload, "issuedAt" | "expiresAt">,
): string {
  const issuedAt = Date.now();
  const full: EstimateTokenPayload = {
    ...payload,
    issuedAt,
    expiresAt: issuedAt + TOKEN_TTL_MS,
  };
  const payloadB64 = toBase64Url(Buffer.from(JSON.stringify(full), "utf8"));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export type TokenVerificationResult =
  | { valid: true; payload: EstimateTokenPayload }
  | { valid: false; reason: "malformed" | "signature" | "expired" };

export function verifyEstimateToken(token: string): TokenVerificationResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };
  const [payloadB64, signature] = parts;

  const expectedSignature = sign(payloadB64);
  const provided = Buffer.from(signature, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { valid: false, reason: "signature" };
  }

  let payload: EstimateTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }

  if (typeof payload.expiresAt !== "number" || Date.now() > payload.expiresAt) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, payload };
}
