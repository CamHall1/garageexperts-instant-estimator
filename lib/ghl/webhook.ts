import "server-only";
import type { FlatWebhookPayload } from "@/lib/ghl/payload";
import { SCHEMA_VERSION } from "@/lib/ghl/payload";

export interface WebhookDeliveryResult {
  delivered: boolean;
  attempts: number;
  lastError: string | null;
}

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 6000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffWithJitter(attempt: number): number {
  const exponential = BASE_DELAY_MS * 2 ** (attempt - 1);
  const jitter = Math.random() * exponential * 0.5;
  return exponential + jitter;
}

/** Sanitizes an error for logs: never leaks the webhook URL, headers, or body. */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return "request_timeout";
    return error.message.slice(0, 200);
  }
  return "unknown_error";
}

/**
 * Sends a flattened payload to a GHL inbound webhook, server-to-server only.
 * Retries transient failures with bounded exponential backoff and jitter.
 * Never logs the webhook URL or raw payload contents.
 */
export async function sendGhlWebhook(
  url: string,
  payload: FlatWebhookPayload,
): Promise<WebhookDeliveryResult> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Estimator-Schema-Version": SCHEMA_VERSION,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.ok) {
        return { delivered: true, attempts: attempt, lastError: null };
      }

      lastError = `http_${res.status}`;
      // Do not retry client errors (4xx) other than 429 -- retrying won't help.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        break;
      }
    } catch (error) {
      lastError = sanitizeError(error);
    }

    if (attempt < MAX_ATTEMPTS) {
      await delay(backoffWithJitter(attempt));
    }
  }

  console.error("[ghl] webhook delivery failed", {
    event_type: payload.event_type,
    estimate_id: payload.estimate_id,
    error: lastError,
  });

  return { delivered: false, attempts: MAX_ATTEMPTS, lastError };
}
