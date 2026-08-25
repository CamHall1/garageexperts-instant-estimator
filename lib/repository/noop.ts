import type { EstimateRepository, StoredEstimate, WebhookDeliveryStatus } from "@/lib/repository/types";
import type { SelectedPlan } from "@/lib/pricing/types";

/**
 * Default repository. GHL is the permanent system of record; the signed
 * estimate token (see lib/security/token.ts) carries enough state for a
 * later selection request to be verified without any local storage.
 */
export class NoopEstimateRepository implements EstimateRepository {
  readonly enabled = false;

  async createEstimate(_estimate: StoredEstimate): Promise<void> {
    // Intentionally a no-op.
  }

  async recordEstimateCreatedDelivery(
    _estimateId: string,
    _status: WebhookDeliveryStatus,
  ): Promise<void> {
    // Intentionally a no-op.
  }

  async getEstimate(_estimateId: string): Promise<StoredEstimate | null> {
    return null;
  }

  async recordSelection(
    _estimateId: string,
    _selectedPlan: SelectedPlan,
    _selectedAt: string,
    _delivery: WebhookDeliveryStatus,
  ): Promise<boolean> {
    return true;
  }
}
