import "server-only";
import type { AddressInput } from "@/lib/validation/schemas";

/**
 * Property-data provider boundary. V1 ships only NoopPropertyDataProvider —
 * no ATTOM call is made and square footage is never inferred. This exists so
 * a future ATTOM integration can be added without touching the intake flow:
 * when enabled, returned facts must be offered to the homeowner as a
 * suggestion to confirm or correct, never silently substituted.
 */

export interface PropertyFacts {
  suggestedSquareFootage?: number;
  yearBuilt?: number;
  lotSizeSquareFeet?: number;
}

export type ProviderStatus = "disabled" | "available" | "unavailable";

export interface PropertyDataProvider {
  readonly name: string;
  status(): ProviderStatus;
  lookupByAddress(address: AddressInput): Promise<PropertyFacts | null>;
}

export class NoopPropertyDataProvider implements PropertyDataProvider {
  readonly name = "noop";
  status(): ProviderStatus {
    return "disabled";
  }
  async lookupByAddress(): Promise<PropertyFacts | null> {
    return null;
  }
}

/**
 * Documented boundary for a future integration. Intentionally unimplemented
 * in V1 -- see docs/ATTOM_FUTURE_INTEGRATION.md. Do not call the live ATTOM
 * API or fabricate responses here.
 */
export class AttomPropertyDataProvider implements PropertyDataProvider {
  readonly name = "attom";
  constructor(private readonly apiKey: string) {}

  status(): ProviderStatus {
    return this.apiKey ? "available" : "unavailable";
  }

  async lookupByAddress(_address: AddressInput): Promise<PropertyFacts | null> {
    throw new Error(
      "AttomPropertyDataProvider is not yet implemented. See docs/ATTOM_FUTURE_INTEGRATION.md.",
    );
  }
}

export function getPropertyDataProvider(): PropertyDataProvider {
  const enabled = process.env.ATTOM_ENABLED === "true";
  if (!enabled) return new NoopPropertyDataProvider();
  return new AttomPropertyDataProvider(process.env.ATTOM_API_KEY ?? "");
}
