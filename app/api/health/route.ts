import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

/** Non-sensitive readiness status only -- never expose URLs, keys, or tokens. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    ghlEstimateCreatedConfigured: Boolean(serverEnv.GHL_ESTIMATE_CREATED_WEBHOOK_URL),
    ghlOptionSelectedConfigured: Boolean(serverEnv.GHL_OPTION_SELECTED_WEBHOOK_URL),
    storageProvider: serverEnv.ESTIMATE_STORAGE_PROVIDER,
    rateLimitProvider: serverEnv.RATE_LIMIT_PROVIDER,
    attomEnabled: serverEnv.ATTOM_ENABLED,
  });
}
