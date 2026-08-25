import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("estimate token signing", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ESTIMATE_SIGNING_SECRET = "test-secret-value";
  });

  afterEach(() => {
    delete process.env.ESTIMATE_SIGNING_SECRET;
  });

  async function loadToken() {
    return await import("@/lib/security/token");
  }

  const basePayload = {
    estimateId: "estimate-123",
    squareFeet: 500,
    concreteCondition: "new_or_no_cracks" as const,
    stemWall: "none" as const,
    stepsPresent: false,
    pricingConfigVersion: "2026-08-25",
    contactHash: "contact-hash",
    addressHash: "address-hash",
    leadDelivered: true,
  };

  it("round-trips a signed token", async () => {
    const { createEstimateToken, verifyEstimateToken } = await loadToken();
    const token = createEstimateToken(basePayload);
    const result = verifyEstimateToken(token);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.estimateId).toBe("estimate-123");
      expect(result.payload.squareFeet).toBe(500);
    }
  });

  it("rejects a tampered payload", async () => {
    const { createEstimateToken, verifyEstimateToken } = await loadToken();
    const token = createEstimateToken(basePayload);
    const [payloadB64, signature] = token.split(".");
    const tamperedPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    tamperedPayload.squareFeet = 9999;
    const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload), "utf8").toString("base64url");
    const tamperedToken = `${tamperedB64}.${signature}`;

    const result = verifyEstimateToken(tamperedToken);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("signature");
  });

  it("rejects a malformed token", async () => {
    const { verifyEstimateToken } = await loadToken();
    const result = verifyEstimateToken("not-a-valid-token");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("malformed");
  });

  it("rejects an expired token", async () => {
    const { createEstimateToken, verifyEstimateToken } = await loadToken();
    const token = createEstimateToken(basePayload);
    const [payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    payload.expiresAt = Date.now() - 1000;

    // Re-sign with the (test-only) expired payload using the same module's
    // internal signer via createEstimateToken is not possible directly, so
    // reconstruct using the same HMAC the module would produce by re-importing
    // and calling createEstimateToken then monkey-patching expiresAt in the
    // decoded/re-encoded token, re-signed through the crypto module directly.
    const { createHmac } = await import("node:crypto");
    const newB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const newSignature = createHmac("sha256", "test-secret-value").update(newB64).digest("base64url");
    const expiredToken = `${newB64}.${newSignature}`;

    const result = verifyEstimateToken(expiredToken);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });

  it("rejects a token signed with a different secret", async () => {
    const { createEstimateToken } = await loadToken();
    const token = createEstimateToken(basePayload);

    vi.resetModules();
    process.env.ESTIMATE_SIGNING_SECRET = "a-different-secret";
    const { verifyEstimateToken: verifyWithDifferentSecret } = await loadToken();

    const result = verifyWithDifferentSecret(token);
    expect(result.valid).toBe(false);
  });
});
