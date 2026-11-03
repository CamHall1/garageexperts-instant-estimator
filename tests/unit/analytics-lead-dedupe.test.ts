// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("analytics.leadCreated", () => {
  beforeEach(() => {
    vi.resetModules();
    window.sessionStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "1234567890");
    vi.stubEnv("NEXT_PUBLIC_TRACKING_MODE", "child");
  });

  it("fires the Meta Lead event only once per browser session", async () => {
    const fbq = vi.fn();
    window.fbq = fbq;
    const { analytics } = await import("@/lib/analytics/adapter");

    analytics.leadCreated("est_1", "event-1");
    // Same visitor edits answers and resubmits: new estimate, new event id.
    analytics.leadCreated("est_2", "event-2");

    const leadCalls = fbq.mock.calls.filter(([action, name]) => action === "track" && name === "Lead");
    expect(leadCalls).toHaveLength(1);
  });

  it("fires again in a fresh session", async () => {
    const fbq = vi.fn();
    window.fbq = fbq;
    const { analytics } = await import("@/lib/analytics/adapter");
    analytics.leadCreated("est_1", "event-1");

    vi.resetModules();
    window.sessionStorage.clear();
    const fresh = await import("@/lib/analytics/adapter");
    fresh.analytics.leadCreated("est_3", "event-3");

    const leadCalls = fbq.mock.calls.filter(([action, name]) => action === "track" && name === "Lead");
    expect(leadCalls).toHaveLength(2);
  });
});
