import "server-only";
import { serverEnv } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

/** Default adapter: no external service configured, so nothing is throttled. */
class NoopRateLimiter implements RateLimiter {
  async check(): Promise<RateLimitResult> {
    return { allowed: true, remaining: Infinity };
  }
}

/**
 * Fixed-window limiter backed by the Upstash Redis REST API. Uses plain
 * fetch (no SDK dependency) so the rate-limit adapter stays fully optional.
 */
class UpstashRateLimiter implements RateLimiter {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly limit: number,
    private readonly windowSeconds: number,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    try {
      const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / 1000 / this.windowSeconds)}`;
      const res = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", windowKey],
          ["EXPIRE", windowKey, String(this.windowSeconds)],
        ]),
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) return { allowed: true, remaining: this.limit };
      const [incrResult] = (await res.json()) as Array<{ result: number }>;
      const count = incrResult?.result ?? 0;
      return { allowed: count <= this.limit, remaining: Math.max(0, this.limit - count) };
    } catch (error) {
      // Fail open: an unreachable rate-limit service must never block leads.
      console.error("[rate-limit] upstash check failed", (error as Error).message);
      return { allowed: true, remaining: this.limit };
    }
  }
}

let cachedLimiter: RateLimiter | null = null;

export function getRateLimiter(limit = 10, windowSeconds = 60): RateLimiter {
  if (cachedLimiter) return cachedLimiter;
  if (
    serverEnv.RATE_LIMIT_PROVIDER === "upstash" &&
    serverEnv.UPSTASH_REDIS_REST_URL &&
    serverEnv.UPSTASH_REDIS_REST_TOKEN
  ) {
    cachedLimiter = new UpstashRateLimiter(
      serverEnv.UPSTASH_REDIS_REST_URL,
      serverEnv.UPSTASH_REDIS_REST_TOKEN,
      limit,
      windowSeconds,
    );
  } else {
    cachedLimiter = new NoopRateLimiter();
  }
  return cachedLimiter;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
