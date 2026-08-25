import { cardDisclaimer, mostPopularPlan, packages } from "@/config/estimator.config";
import type { PlanId, PublicPlanPricingResult } from "@/lib/pricing/types";
import { RangeBar } from "@/components/results/RangeBar";
import { IconCheck } from "@/components/estimator/icons";

export interface PricingCardProps {
  plan: PlanId;
  result: PublicPlanPricingResult;
  onSelect: (plan: PlanId) => void;
  selecting: boolean;
  disabled: boolean;
}

const ACCENT: Record<PlanId, string> = {
  silver: "border-[var(--ge-supporting-gray)]",
  gold: "border-[var(--ge-green)] ring-2 ring-[var(--ge-green)]",
  platinum: "border-[var(--ge-dark-gray)]",
};

export function PricingCard({ plan, result, onSelect, selecting, disabled }: PricingCardProps) {
  const content = packages[plan];
  const isMostPopular = plan === mostPopularPlan;

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border-2 bg-white p-6 shadow-sm ${ACCENT[plan]} ${
        isMostPopular ? "sm:-translate-y-2 sm:shadow-md" : ""
      }`}
    >
      {isMostPopular ? (
        <span className="mb-3 inline-block w-fit rounded-full bg-[var(--ge-green)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Most Popular
        </span>
      ) : null}

      <h3 className="font-[var(--font-heading)] text-xl font-bold text-[var(--ge-dark-gray)]">
        {content.name}
      </h3>
      <p className="mt-1 text-sm text-[var(--ge-supporting-gray)]">{content.positioningLine}</p>

      <div className="mt-5">
        <p className="text-2xl font-bold text-[var(--ge-dark-gray)]">{result.formattedRange}</p>
        {result.displayMode === "range" ? (
          <p className="text-sm text-[var(--ge-supporting-gray)]">
            Your estimate: <span className="font-semibold text-[var(--ge-dark-gray)]">{result.formattedEstimatedTotal}</span>
          </p>
        ) : null}
        <div className="mt-3">
          <RangeBar plan={result} />
        </div>
      </div>

      <ul className="mt-5 flex-1 space-y-2">
        {content.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[var(--ge-dark-gray)]">
            <span className="mt-0.5 shrink-0 text-[var(--ge-green)]">
              <IconCheck />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(plan)}
        disabled={disabled}
        className="mt-6 min-h-[44px] w-full rounded-full bg-[var(--ge-black)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--ge-dark-gray)] disabled:opacity-60 motion-reduce:transition-none"
      >
        {selecting ? "Selecting…" : content.buttonLabel}
      </button>

      <p className="mt-4 text-xs text-[var(--ge-supporting-gray)]">{cardDisclaimer}</p>
    </div>
  );
}
