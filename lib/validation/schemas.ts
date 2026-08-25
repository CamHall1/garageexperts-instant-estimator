import { z } from "zod";
import { squareFootage } from "@/config/estimator.config";

export const concreteConditionSchema = z.enum([
  "new_or_no_cracks",
  "average_cracking",
  "excessive_cracking",
]);

export const stemWallSchema = z.enum(["none", "up_to_6", "over_6_to_12", "not_sure"]);

export const selectedPlanSchema = z.enum(["silver", "gold", "platinum", "all_options"]);

export const addressSourceSchema = z.enum(["google_places", "manual"]);

export const addressSchema = z.object({
  formattedAddress: z.string().trim().min(1).max(300),
  addressLine1: z.string().trim().min(1).max(150),
  addressLine2: z.string().trim().max(150).optional().default(""),
  city: z.string().trim().max(150).optional().default(""),
  region: z.string().trim().max(150).optional().default(""),
  postalCode: z.string().trim().max(30).optional().default(""),
  country: z.string().trim().length(2).optional().default("US"),
  latitude: z.number().min(-90).max(90).nullable().optional().default(null),
  longitude: z.number().min(-180).max(180).nullable().optional().default(null),
  placeId: z.string().trim().max(300).optional().default(""),
  addressSource: addressSourceSchema,
});
export type AddressInput = z.infer<typeof addressSchema>;

/** Accepts "1,234" / " 500 " style input and normalizes to a whole number. */
export const squareFootageInputSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const normalized =
      typeof value === "number" ? value : Number(value.replace(/[,\s]/g, ""));
    if (!Number.isFinite(normalized)) {
      ctx.addIssue({ code: "custom", message: "Enter a valid number of square feet." });
      return z.NEVER;
    }
    return Math.round(normalized);
  })
  .pipe(
    z
      .number()
      .int()
      .min(squareFootage.min, `Enter at least ${squareFootage.min} square feet.`)
      .max(squareFootage.max, `Enter no more than ${squareFootage.max.toLocaleString()} square feet.`),
  );

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(150)
    .regex(/^[\p{L}\p{M}'.\- ]+$/u, "Use letters, spaces, hyphens, and apostrophes only."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  smsConsent: z.boolean(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const attributionSchema = z.object({
  utmSource: z.string().trim().max(200).optional().default(""),
  utmMedium: z.string().trim().max(200).optional().default(""),
  utmCampaign: z.string().trim().max(200).optional().default(""),
  utmContent: z.string().trim().max(200).optional().default(""),
  utmTerm: z.string().trim().max(200).optional().default(""),
  gclid: z.string().trim().max(300).optional().default(""),
  gbraid: z.string().trim().max(300).optional().default(""),
  wbraid: z.string().trim().max(300).optional().default(""),
  fbclid: z.string().trim().max(300).optional().default(""),
  landingPageUrl: z.string().trim().max(2000).optional().default(""),
  referrer: z.string().trim().max(2000).optional().default(""),
  embedMode: z.boolean().optional().default(false),
  parentOrigin: z.string().trim().max(300).optional().default(""),
});
export type AttributionInput = z.infer<typeof attributionSchema>;

/** POST /api/estimate request body. */
export const estimateRequestSchema = z.object({
  address: addressSchema,
  squareFeet: squareFootageInputSchema,
  concreteCondition: concreteConditionSchema,
  stepsPresent: z.boolean(),
  stemWall: stemWallSchema,
  contact: contactSchema,
  attribution: attributionSchema,
  consentDisclosureVersion: z.string().trim().min(1).max(100),
  // Anti-abuse signals -- validated server-side, never surfaced to the user.
  honeypot: z.string().max(0, "Bot detected.").optional().default(""),
  formStartedAtMs: z.number().int().nonnegative(),
  turnstileToken: z.string().max(4000).optional(),
});
export type EstimateRequest = z.infer<typeof estimateRequestSchema>;

/** POST /api/estimate/select request body. */
export const selectRequestSchema = z.object({
  estimateToken: z.string().min(1).max(4000),
  selectedPlan: selectedPlanSchema,
  selectionSource: z.enum(["results_card", "all_options_button"]),
  // The client resubmits its locally held snapshot; the server re-verifies
  // it against the signed token's hashes and recalculates pricing.
  contact: contactSchema,
  address: addressSchema,
  squareFeet: squareFootageInputSchema,
  concreteCondition: concreteConditionSchema,
  stepsPresent: z.boolean(),
  stemWall: stemWallSchema,
  attribution: attributionSchema,
});
export type SelectRequest = z.infer<typeof selectRequestSchema>;
