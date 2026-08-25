import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validBody = {
  address: {
    formattedAddress: "1234 SE Example St, Portland, OR 97214",
    addressLine1: "1234 SE Example St",
    addressLine2: "",
    city: "Portland",
    region: "OR",
    postalCode: "97214",
    country: "US",
    latitude: 45.5123,
    longitude: -122.6587,
    placeId: "",
    addressSource: "manual" as const,
  },
  squareFeet: 500,
  concreteCondition: "new_or_no_cracks" as const,
  stepsPresent: false,
  stemWall: "none" as const,
  contact: {
    fullName: "Jordan Taylor",
    email: "jordan@example.com",
    phone: "503-555-1212",
    smsConsent: false,
  },
  attribution: {},
  consentDisclosureVersion: "corporate-2026-08",
  honeypot: "",
  formStartedAtMs: Date.now() - 10_000,
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/estimate", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ESTIMATE_SIGNING_SECRET = "test-secret";
    process.env.GHL_ESTIMATE_CREATED_WEBHOOK_URL = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ESTIMATE_SIGNING_SECRET;
    delete process.env.GHL_ESTIMATE_CREATED_WEBHOOK_URL;
  });

  it("returns a signed estimate and public pricing result for a valid request", async () => {
    const { POST } = await import("@/app/api/estimate/route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.estimateId).toBeDefined();
    expect(json.estimateToken).toBeDefined();
    expect(json.result.plans.gold.formattedEstimatedTotal).toBeDefined();
    // Internal rate fields must never reach the client.
    expect(json.result.plans.gold.internalLowRate).toBeUndefined();
  });

  it("rejects square footage below the minimum", async () => {
    const { POST } = await import("@/app/api/estimate/route");
    const res = await POST(makeRequest({ ...validBody, squareFeet: 10 }));
    expect(res.status).toBe(400);
  });

  it("rejects a tripped honeypot", async () => {
    const { POST } = await import("@/app/api/estimate/route");
    const res = await POST(makeRequest({ ...validBody, honeypot: "bot-filled-this-in" }));
    expect(res.status).toBe(400);
  });

  it("rejects a submission that completed implausibly fast", async () => {
    const { POST } = await import("@/app/api/estimate/route");
    const res = await POST(makeRequest({ ...validBody, formStartedAtMs: Date.now() }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid phone number", async () => {
    const { POST } = await import("@/app/api/estimate/route");
    const res = await POST(
      makeRequest({ ...validBody, contact: { ...validBody.contact, phone: "123" } }),
    );
    expect(res.status).toBe(400);
  });

  it("still returns results when the GHL webhook is unreachable", async () => {
    process.env.GHL_ESTIMATE_CREATED_WEBHOOK_URL = "https://ghl.example.com/webhook";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network error");
      }),
    );
    const { POST } = await import("@/app/api/estimate/route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.leadDelivery.delivered).toBe(false);
    expect(json.result).toBeDefined();
  });
});
