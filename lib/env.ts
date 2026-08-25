import { z } from "zod";

/**
 * Typed, validated environment variables. Secrets stay server-only; only
 * variables explicitly prefixed NEXT_PUBLIC_ are readable in the browser.
 * Every optional integration must be able to be absent without breaking
 * local development or the production build.
 */

const serverSchema = z.object({
  GHL_ESTIMATE_CREATED_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  GHL_OPTION_SELECTED_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  ESTIMATE_SIGNING_SECRET: z.string().optional().or(z.literal("")),
  EMBED_ALLOWED_ORIGINS: z.string().optional().default(""),

  ESTIMATE_STORAGE_PROVIDER: z.enum(["none", "postgres"]).optional().default("none"),
  DATABASE_URL: z.string().optional().or(z.literal("")),

  RATE_LIMIT_PROVIDER: z.enum(["none", "upstash"]).optional().default("none"),
  UPSTASH_REDIS_REST_URL: z.string().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),

  TURNSTILE_SECRET_KEY: z.string().optional().or(z.literal("")),

  ATTOM_ENABLED: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  ATTOM_API_KEY: z.string().optional().or(z.literal("")),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_GOOGLE_ADS_ID: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_GOOGLE_ADS_SELECTION_LABEL: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_TRACKING_MODE: z.enum(["auto", "parent", "child", "off"]).optional().default("auto"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().or(z.literal("")),
  /**
   * Mirrors EMBED_ALLOWED_ORIGINS for the /embed page's client-side
   * postMessage origin check. Origins are not secrets (they're the public
   * landing-page domains), so duplicating the list here is safe; the
   * server-only CSP frame-ancestors header remains the enforced boundary.
   */
  NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS: z.string().optional().default(""),
});

function loadServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid server environment variables", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment configuration.");
  }
  return parsed.data;
}

function loadPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
    NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL,
    NEXT_PUBLIC_GOOGLE_ADS_SELECTION_LABEL: process.env.NEXT_PUBLIC_GOOGLE_ADS_SELECTION_LABEL,
    NEXT_PUBLIC_TRACKING_MODE: process.env.NEXT_PUBLIC_TRACKING_MODE,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS,
  });
  if (!parsed.success) {
    console.error("Invalid public environment variables", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid public environment configuration.");
  }
  return parsed.data;
}

export const serverEnv = loadServerEnv();
export const publicEnv = loadPublicEnv();

export function getEmbedAllowedOrigins(): string[] {
  return serverEnv.EMBED_ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getPublicEmbedAllowedOrigins(): string[] {
  return publicEnv.NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
