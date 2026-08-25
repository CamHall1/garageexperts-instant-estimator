"use client";

import type { AttributionInput } from "@/lib/validation/schemas";

const STORAGE_KEY = "ge_estimator_attribution_v1";

const EMPTY_ATTRIBUTION: AttributionInput = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  gclid: "",
  gbraid: "",
  wbraid: "",
  fbclid: "",
  landingPageUrl: "",
  referrer: "",
  embedMode: false,
  parentOrigin: "",
};

function readStoredAttribution(): AttributionInput {
  if (typeof window === "undefined") return EMPTY_ATTRIBUTION;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ATTRIBUTION;
    return { ...EMPTY_ATTRIBUTION, ...JSON.parse(raw) };
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}

function writeStoredAttribution(value: AttributionInput): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (private mode, quota) -- attribution is
    // best-effort and must never block the estimator.
  }
}

function captureFromLocation(): Partial<AttributionInput> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmContent: params.get("utm_content") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    gclid: params.get("gclid") ?? "",
    gbraid: params.get("gbraid") ?? "",
    wbraid: params.get("wbraid") ?? "",
    fbclid: params.get("fbclid") ?? "",
    landingPageUrl: window.location.href,
    referrer: document.referrer ?? "",
  };
}

/**
 * First-touch attribution: once a field is captured with a non-empty value
 * it is never overwritten, even by a later non-empty value, so a homeowner
 * bouncing between ad clicks and organic visits keeps the campaign that
 * actually brought them to the estimator.
 */
function mergeFirstTouch(existing: AttributionInput, incoming: Partial<AttributionInput>): AttributionInput {
  const merged = { ...existing };
  for (const key of Object.keys(incoming) as Array<keyof AttributionInput>) {
    const incomingValue = incoming[key];
    const existingValue = merged[key];
    const existingIsEmpty =
      existingValue === "" || existingValue === undefined || existingValue === null;
    if (existingIsEmpty && incomingValue !== undefined && incomingValue !== "") {
      (merged[key] as unknown) = incomingValue;
    }
  }
  return merged;
}

export function captureAndPersistAttribution(overrides?: Partial<AttributionInput>): AttributionInput {
  const existing = readStoredAttribution();
  const fromLocation = captureFromLocation();
  const merged = mergeFirstTouch(existing, { ...fromLocation, ...overrides });
  writeStoredAttribution(merged);
  return merged;
}

export function getPersistedAttribution(): AttributionInput {
  return readStoredAttribution();
}

export function setEmbedContext(embedMode: boolean, parentOrigin: string): void {
  const existing = readStoredAttribution();
  writeStoredAttribution({ ...existing, embedMode, parentOrigin });
}
