import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Optional Postgres schema, used only when ESTIMATE_STORAGE_PROVIDER=postgres.
 * Contact/address fields hold PII -- see docs/PRICING_AND_RULES.md and
 * README.md for retention guidance. Deploying this table is the operator's
 * choice; nothing in the app requires it to exist.
 */
export const estimates = pgTable("estimates", {
  estimateId: text("estimate_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  pricingConfigVersion: text("pricing_config_version").notNull(),

  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phoneE164: text("phone_e164").notNull(),

  formattedAddress: text("formatted_address").notNull(),
  squareFeet: integer("square_feet").notNull(),
  concreteCondition: text("concrete_condition").notNull(),
  stepsPresent: boolean("steps_present").notNull(),
  stemWall: text("stem_wall").notNull(),

  pricingSnapshot: jsonb("pricing_snapshot").notNull(),
  attribution: jsonb("attribution").notNull(),

  consentDisclosureVersion: text("consent_disclosure_version").notNull(),
  smsConsentTimestamp: timestamp("sms_consent_timestamp", { withTimezone: true }),

  estimateCreatedDelivery: jsonb("estimate_created_delivery").notNull(),

  selectedPlan: text("selected_plan"),
  selectedAt: timestamp("selected_at", { withTimezone: true }),
  optionSelectedDelivery: jsonb("option_selected_delivery"),
});

/** Enforces one selection event per (estimate, plan) pair at the DB layer. */
export const estimateSelections = pgTable("estimate_selections", {
  selectionKey: text("selection_key").primaryKey(), // `${estimateId}:${selectedPlan}`
  estimateId: text("estimate_id").notNull(),
  selectedPlan: text("selected_plan").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
