import type { PublicPlanPricingResult } from "@/lib/pricing/types";

export function RangeBar({ plan }: { plan: PublicPlanPricingResult }) {
  if (plan.displayMode === "starting_at" || plan.visualMarkerPosition === null) {
    return (
      <div>
        <div className="h-2 w-full rounded-full bg-[var(--ge-light-gray)]" aria-hidden="true" />
        <p className="sr-only">Estimated project total: {plan.formattedRange}.</p>
      </div>
    );
  }

  const markerPercent = plan.visualMarkerPosition * 100;

  return (
    <div>
      <div className="relative h-2 w-full rounded-full bg-[var(--ge-light-gray)]" aria-hidden="true">
        <div
          className="absolute h-2 rounded-full bg-[var(--ge-green)]"
          style={{ width: "100%" }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--ge-dark-gray)] shadow"
          style={{ left: `${markerPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-[var(--ge-supporting-gray)]" aria-hidden="true">
        <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(plan.displayedRangeLow)}</span>
        <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(plan.displayedRangeHigh)}</span>
      </div>
      <p className="sr-only">
        Estimated project range: {plan.formattedRange}. Your personalized estimate:{" "}
        {plan.formattedEstimatedTotal}.
      </p>
    </div>
  );
}
