import "server-only";
import { serverEnv } from "@/lib/env";

/** Minimum plausible time (ms) for a human to complete the multi-step form. */
const MIN_HUMAN_COMPLETION_MS = 2500;

export function isHoneypotTripped(honeypotValue: string | undefined): boolean {
  return Boolean(honeypotValue && honeypotValue.length > 0);
}

export function isSubmissionTooFast(formStartedAtMs: number): boolean {
  return Date.now() - formStartedAtMs < MIN_HUMAN_COMPLETION_MS;
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
): Promise<{ verified: boolean; skipped: boolean }> {
  if (!serverEnv.TURNSTILE_SECRET_KEY) {
    return { verified: true, skipped: true };
  }
  if (!token) return { verified: false, skipped: false };

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: serverEnv.TURNSTILE_SECRET_KEY,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
      signal: AbortSignal.timeout(3000),
    });
    const data = (await res.json()) as { success: boolean };
    return { verified: data.success === true, skipped: false };
  } catch (error) {
    console.error("[bot-protection] turnstile verification failed", (error as Error).message);
    // Fail open rather than lose a legitimate lead to a transient outage.
    return { verified: true, skipped: false };
  }
}
