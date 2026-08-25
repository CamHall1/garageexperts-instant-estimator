"use client";

import { useState } from "react";
import { selectionDisclaimer } from "@/config/estimator.config";
import { analytics } from "@/lib/analytics/adapter";
import { captureAndPersistAttribution } from "@/lib/analytics/attribution";
import type {
  ConcreteCondition,
  PlanId,
  PublicPricingResult,
  SelectedPlan,
  StemWall,
} from "@/lib/pricing/types";
import type { AddressInput, ContactInput } from "@/lib/validation/schemas";
import { STEP_HEADING_ID } from "@/components/estimator/StepHeading";
import { PricingCard } from "@/components/results/PricingCard";
import { ComparisonSection } from "@/components/results/ComparisonSection";
import { ProcessSection } from "@/components/results/ProcessSection";
import { CabinetsCrossSell } from "@/components/results/CabinetsCrossSell";
import { ProductShowcase } from "@/components/trust/ProductShowcase";
import { TrustSection } from "@/components/trust/TrustSection";
import { Disclaimer } from "@/components/trust/Disclaimer";

export interface ResultsViewProps {
  publicResult: PublicPricingResult;
  estimateId: string;
  estimateToken: string;
  address: AddressInput;
  squareFeet: number;
  concreteCondition: ConcreteCondition;
  stepsPresent: boolean;
  stemWall: StemWall;
  contact: ContactInput;
  onEditAnswers: () => void;
  /** Called after the selection API call succeeds; the parent flow
   * navigates to the confirmation/thank-you step. */
  onSelected: (plan: SelectedPlan) => void;
}

const PLAN_IDS: PlanId[] = ["silver", "gold", "platinum"];

export function ResultsView({
  publicResult,
  estimateId,
  estimateToken,
  address,
  squareFeet,
  concreteCondition,
  stepsPresent,
  stemWall,
  contact,
  onEditAnswers,
  onSelected,
}: ResultsViewProps) {
  const [selecting, setSelecting] = useState<SelectedPlan | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  async function submitSelection(plan: SelectedPlan, source: "results_card" | "all_options_button") {
    if (selecting) return;
    setSelecting(plan);
    setSelectError(null);

    try {
      const attribution = captureAndPersistAttribution();
      const res = await fetch("/api/estimate/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateToken,
          selectedPlan: plan,
          selectionSource: source,
          contact,
          address,
          squareFeet,
          concreteCondition,
          stepsPresent,
          stemWall,
          attribution,
        }),
      });

      if (!res.ok) {
        setSelectError("We couldn't record your selection. Please try again or call us directly.");
        setSelecting(null);
        return;
      }

      if (plan === "all_options") {
        analytics.allOptionsRequested(estimateId);
      } else {
        analytics.planSelected(plan, estimateId, crypto.randomUUID());
      }
      onSelected(plan);
    } catch {
      setSelectError("Something went wrong. Please try again or call us directly.");
      setSelecting(null);
    }
  }

  return (
    <div>
      <h1
        id={STEP_HEADING_ID}
        tabIndex={-1}
        className="font-[var(--font-heading)] text-2xl font-bold text-[var(--ge-dark-gray)] outline-none sm:text-3xl"
      >
        Your Garage Floor Estimate
      </h1>
      <p className="mt-2 text-base text-[var(--ge-supporting-gray)]">
        Based on the details you shared, here are three ways to build your Garage FX® floor.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--ge-light-gray)] p-4 text-sm">
        <div>
          <p className="font-semibold text-[var(--ge-dark-gray)]">{address.formattedAddress}</p>
          <p className="text-[var(--ge-supporting-gray)]">{squareFeet.toLocaleString()} sq. ft. garage floor</p>
        </div>
        <button
          type="button"
          onClick={onEditAnswers}
          className="font-semibold text-[var(--ge-green-dark)] underline underline-offset-2"
        >
          Edit answers
        </button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {PLAN_IDS.map((plan) => (
          <PricingCard
            key={plan}
            plan={plan}
            result={publicResult.plans[plan]}
            onSelect={(p) => submitSelection(p, "results_card")}
            selecting={selecting === plan}
            disabled={Boolean(selecting)}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => submitSelection("all_options", "all_options_button")}
          disabled={Boolean(selecting)}
          className="min-h-[44px] rounded-full border-2 border-[var(--ge-dark-gray)] px-6 py-3 text-sm font-semibold text-[var(--ge-dark-gray)] transition-colors hover:bg-[var(--ge-light-gray)] disabled:opacity-60 motion-reduce:transition-none"
        >
          {selecting === "all_options" ? "Sending…" : "Send Me All Three Options"}
        </button>
      </div>

      {selectError ? (
        <p role="alert" className="mt-4 text-center text-sm font-medium text-red-700">
          {selectError}
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs text-[var(--ge-supporting-gray)]">{selectionDisclaimer}</p>

      <ComparisonSection />
      <ProductShowcase />
      <ProcessSection />
      <TrustSection />
      <CabinetsCrossSell />
      <Disclaimer />
    </div>
  );
}
