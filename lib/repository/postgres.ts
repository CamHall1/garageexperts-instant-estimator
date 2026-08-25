import "server-only";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { estimateSelections, estimates } from "@/lib/repository/schema";
import type { EstimateRepository, StoredEstimate, WebhookDeliveryStatus } from "@/lib/repository/types";
import type { SelectedPlan } from "@/lib/pricing/types";

type Db = ReturnType<typeof drizzle>;

/**
 * Optional Postgres-backed repository. The connection is created lazily on
 * first use so importing this module never requires DATABASE_URL to be set.
 */
export class PostgresEstimateRepository implements EstimateRepository {
  readonly enabled = true;
  private db: Db | null = null;

  constructor(private readonly connectionString: string) {}

  private getDb(): Db {
    if (!this.db) {
      const client = postgres(this.connectionString, { max: 5 });
      this.db = drizzle(client);
    }
    return this.db;
  }

  async createEstimate(estimate: StoredEstimate): Promise<void> {
    const db = this.getDb();
    await db.insert(estimates).values({
      estimateId: estimate.estimateId,
      createdAt: new Date(estimate.createdAt),
      updatedAt: new Date(estimate.updatedAt),
      pricingConfigVersion: estimate.pricingConfigVersion,
      fullName: estimate.contact.fullName,
      email: estimate.contact.email,
      phoneE164: estimate.contact.phone,
      formattedAddress: estimate.address.formattedAddress,
      squareFeet: estimate.squareFeet,
      concreteCondition: estimate.concreteCondition,
      stepsPresent: estimate.stepsPresent,
      stemWall: estimate.stemWall,
      pricingSnapshot: estimate.pricing,
      attribution: estimate.attribution,
      consentDisclosureVersion: estimate.consentDisclosureVersion,
      smsConsentTimestamp: estimate.smsConsentTimestamp
        ? new Date(estimate.smsConsentTimestamp)
        : null,
      estimateCreatedDelivery: estimate.estimateCreatedDelivery,
      selectedPlan: estimate.selectedPlan,
      selectedAt: estimate.selectedAt ? new Date(estimate.selectedAt) : null,
      optionSelectedDelivery: estimate.optionSelectedDelivery,
    });
  }

  async recordEstimateCreatedDelivery(
    estimateId: string,
    status: WebhookDeliveryStatus,
  ): Promise<void> {
    const db = this.getDb();
    await db
      .update(estimates)
      .set({ estimateCreatedDelivery: status, updatedAt: new Date() })
      .where(eq(estimates.estimateId, estimateId));
  }

  async getEstimate(estimateId: string): Promise<StoredEstimate | null> {
    const db = this.getDb();
    const rows = await db.select().from(estimates).where(eq(estimates.estimateId, estimateId));
    const row = rows[0];
    if (!row) return null;

    return {
      estimateId: row.estimateId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      pricingConfigVersion: row.pricingConfigVersion,
      contact: { fullName: row.fullName, email: row.email, phone: row.phoneE164, smsConsent: Boolean(row.smsConsentTimestamp) },
      address: { formattedAddress: row.formattedAddress } as StoredEstimate["address"],
      squareFeet: row.squareFeet,
      concreteCondition: row.concreteCondition,
      stepsPresent: row.stepsPresent,
      stemWall: row.stemWall,
      pricing: row.pricingSnapshot as StoredEstimate["pricing"],
      attribution: row.attribution as StoredEstimate["attribution"],
      consentDisclosureVersion: row.consentDisclosureVersion,
      smsConsentTimestamp: row.smsConsentTimestamp?.toISOString() ?? null,
      estimateCreatedDelivery: row.estimateCreatedDelivery as WebhookDeliveryStatus,
      selectedPlan: row.selectedPlan as SelectedPlan | null,
      selectedAt: row.selectedAt?.toISOString() ?? null,
      optionSelectedDelivery: row.optionSelectedDelivery as WebhookDeliveryStatus | null,
    };
  }

  /** Enforces one selection event per (estimate, plan) via a unique key row. */
  async recordSelection(
    estimateId: string,
    selectedPlan: SelectedPlan,
    selectedAt: string,
    delivery: WebhookDeliveryStatus,
  ): Promise<boolean> {
    const db = this.getDb();
    const selectionKey = `${estimateId}:${selectedPlan}`;

    try {
      await db.insert(estimateSelections).values({
        selectionKey,
        estimateId,
        selectedPlan,
        createdAt: new Date(selectedAt),
      });
    } catch {
      // Unique-constraint violation: this exact plan was already selected.
      return false;
    }

    await db
      .update(estimates)
      .set({
        selectedPlan,
        selectedAt: new Date(selectedAt),
        optionSelectedDelivery: delivery,
        updatedAt: new Date(),
      })
      .where(eq(estimates.estimateId, estimateId));

    return true;
  }
}
