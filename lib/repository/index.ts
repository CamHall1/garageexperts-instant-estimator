import "server-only";
import { serverEnv } from "@/lib/env";
import { NoopEstimateRepository } from "@/lib/repository/noop";
import type { EstimateRepository } from "@/lib/repository/types";

let cached: EstimateRepository | null = null;

export async function getEstimateRepository(): Promise<EstimateRepository> {
  if (cached) return cached;

  if (serverEnv.ESTIMATE_STORAGE_PROVIDER === "postgres" && serverEnv.DATABASE_URL) {
    // Dynamically imported so the postgres/drizzle-orm modules are only
    // touched when a database is actually configured.
    const { PostgresEstimateRepository } = await import("@/lib/repository/postgres");
    cached = new PostgresEstimateRepository(serverEnv.DATABASE_URL);
  } else {
    cached = new NoopEstimateRepository();
  }

  return cached;
}

export type { EstimateRepository, StoredEstimate, WebhookDeliveryStatus } from "@/lib/repository/types";
