"use client";

import { analyticsEvents } from "@/config/estimator.config";
import { publicEnv } from "@/lib/env";
import { createEnvelope, EMBED_NAMESPACE } from "@/lib/embed/protocol";
import type { PlanId, SelectedPlan } from "@/lib/pricing/types";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type TrackingMode = "parent" | "child" | "off";

let isEmbedded = false;

export function initAnalytics(embedMode: boolean): void {
  isEmbedded = embedMode;
}

function getEffectiveMode(): TrackingMode {
  const configured = publicEnv.NEXT_PUBLIC_TRACKING_MODE;
  if (configured === "off") return "off";
  if (configured === "parent") return "parent";
  if (configured === "child") return "child";
  return isEmbedded ? "parent" : "child"; // auto
}

function postToParent(type: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || window.parent === window) return;
  const envelope = createEnvelope(type, payload);
  // A specific targetOrigin is required in production; in local/dev preview
  // the parent origin may still be establishing itself via the init handshake.
  window.parent.postMessage(envelope, "*");
}

function firePixelLead(): void {
  if (typeof window === "undefined") return;
  if (publicEnv.NEXT_PUBLIC_META_PIXEL_ID && window.fbq) {
    window.fbq("track", "Lead");
  }
  if (publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID && window.gtag) {
    window.gtag("event", analyticsEvents.estimatorLeadCreated);
  }
  if (
    publicEnv.NEXT_PUBLIC_GOOGLE_ADS_ID &&
    publicEnv.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL &&
    window.gtag
  ) {
    window.gtag("event", "conversion", {
      send_to: `${publicEnv.NEXT_PUBLIC_GOOGLE_ADS_ID}/${publicEnv.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL}`,
    });
  }
}

function firePixelSelection(plan: PlanId): void {
  if (typeof window === "undefined") return;
  if (publicEnv.NEXT_PUBLIC_META_PIXEL_ID && window.fbq) {
    window.fbq("trackCustom", "EstimatorPackageSelected", { plan });
  }
  if (publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID && window.gtag) {
    window.gtag("event", analyticsEvents.estimatorPlanSelected, { plan });
  }
  if (
    publicEnv.NEXT_PUBLIC_GOOGLE_ADS_ID &&
    publicEnv.NEXT_PUBLIC_GOOGLE_ADS_SELECTION_LABEL &&
    window.gtag
  ) {
    window.gtag("event", "conversion", {
      send_to: `${publicEnv.NEXT_PUBLIC_GOOGLE_ADS_ID}/${publicEnv.NEXT_PUBLIC_GOOGLE_ADS_SELECTION_LABEL}`,
    });
  }
}

function fireGenericEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

const seenEventIds = new Set<string>();
function isDuplicate(eventId: string): boolean {
  if (seenEventIds.has(eventId)) return true;
  seenEventIds.add(eventId);
  return false;
}

export const analytics = {
  viewed(): void {
    fireGenericEvent(analyticsEvents.estimatorViewed);
  },
  started(): void {
    fireGenericEvent(analyticsEvents.estimatorStarted);
  },
  questionCompleted(step: number, stepKey: string): void {
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("progress", { step, stepKey });
      return;
    }
    fireGenericEvent(analyticsEvents.estimatorQuestionCompleted, { step, stepKey });
  },
  contactSubmitted(): void {
    fireGenericEvent(analyticsEvents.estimatorContactSubmitted);
  },
  /** Primary Lead conversion. Fire only after /api/estimate succeeds. */
  leadCreated(estimateId: string, analyticsEventId: string): void {
    if (isDuplicate(analyticsEventId)) return;
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("lead", { estimateId, analyticsEventId });
      return;
    }
    firePixelLead();
    fireGenericEvent(analyticsEvents.estimatorLeadCreated);
  },
  resultsViewed(estimateId: string): void {
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("complete", { estimateId, completionType: "results_viewed" });
      return;
    }
    fireGenericEvent(analyticsEvents.estimatorResultsViewed);
  },
  /** High-intent conversion. Fire only after the selection API call succeeds. */
  planSelected(plan: PlanId, estimateId: string, analyticsEventId: string): void {
    if (isDuplicate(analyticsEventId)) return;
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("selection", { estimateId, plan, analyticsEventId });
      return;
    }
    firePixelSelection(plan);
    fireGenericEvent(analyticsEvents.estimatorPlanSelected, { plan });
  },
  allOptionsRequested(estimateId: string): void {
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("complete", { estimateId, completionType: "all_options_requested" });
      return;
    }
    fireGenericEvent(analyticsEvents.estimatorAllOptionsRequested);
  },
  callClicked(estimateId: string, selectedPlan: SelectedPlan | ""): void {
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("call_click", { estimateId, selectedPlan });
      return;
    }
    fireGenericEvent(analyticsEvents.estimatorCallClicked);
  },
  error(code: string): void {
    const mode = getEffectiveMode();
    if (mode === "off") return;
    if (mode === "parent") {
      postToParent("error", { code });
      return;
    }
    fireGenericEvent(analyticsEvents.estimatorError, { code });
  },
};

export const __embedNamespaceForTests = EMBED_NAMESPACE;
