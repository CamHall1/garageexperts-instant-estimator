import type { PricingCalculationResult, SelectedPlan } from "@/lib/pricing/types";
import type { AddressInput, AttributionInput, ContactInput } from "@/lib/validation/schemas";

export interface WebhookDeliveryStatus {
  attempted: boolean;
  delivered: boolean;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
}

export interface StoredEstimate {
  estimateId: string;
  createdAt: string;
  updatedAt: string;
  pricingConfigVersion: string;

  contact: ContactInput;
  address: AddressInput;
  squareFeet: number;
  concreteCondition: string;
  stepsPresent: boolean;
  stemWall: string;

  pricing: PricingCalculationResult;
  attribution: AttributionInput;

  consentDisclosureVersion: string;
  smsConsentTimestamp: string | null;

  estimateCreatedDelivery: WebhookDeliveryStatus;

  selectedPlan: SelectedPlan | null;
  selectedAt: string | null;
  optionSelectedDelivery: WebhookDeliveryStatus | null;
}

/**
 * Optional persistence boundary. The default (Noop) implementation makes GHL
 * the sole system of record and never writes PII to local storage. A
 * Postgres implementation is available behind ESTIMATE_STORAGE_PROVIDER but
 * is never required for the app to build or run.
 */
export interface EstimateRepository {
  readonly enabled: boolean;
  createEstimate(estimate: StoredEstimate): Promise<void>;
  recordEstimateCreatedDelivery(estimateId: string, status: WebhookDeliveryStatus): Promise<void>;
  getEstimate(estimateId: string): Promise<StoredEstimate | null>;
  recordSelection(
    estimateId: string,
    selectedPlan: SelectedPlan,
    selectedAt: string,
    delivery: WebhookDeliveryStatus,
  ): Promise<boolean>;
}
