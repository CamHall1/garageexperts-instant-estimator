import { packages } from "@/config/estimator.config";
import { splitFullName } from "@/lib/address/name";
import type { PlanId, PublicPricingResult, SelectedPlan } from "@/lib/pricing/types";
import type { ContactInput } from "@/lib/validation/schemas";
import { CallCta } from "@/components/results/CallCta";
import { ProcessSection } from "@/components/results/ProcessSection";
import { ProductShowcase } from "@/components/trust/ProductShowcase";
import { TrustSection } from "@/components/trust/TrustSection";
import { Disclaimer } from "@/components/trust/Disclaimer";
import { IconCheck } from "@/components/estimator/icons";
import { STEP_HEADING_ID } from "@/components/estimator/StepHeading";

export interface ThankYouViewProps {
  selectedPlan: SelectedPlan;
  publicResult: PublicPricingResult;
  contact: ContactInput;
  estimateId: string;
  onBackToResults: () => void;
  onCallClick: () => void;
}

export function ThankYouView({
  selectedPlan,
  publicResult,
  contact,
  estimateId,
  onBackToResults,
  onCallClick,
}: ThankYouViewProps) {
  const { firstName } = splitFullName(contact.fullName);
  const isSinglePlan = selectedPlan !== "all_options";
  const planContent = isSinglePlan ? packages[selectedPlan as PlanId] : null;
  const planResult = isSinglePlan ? publicResult.plans[selectedPlan as PlanId] : null;

  return (
    <div>
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ge-green)] text-white"
        >
          <IconCheck />
        </span>
        <h1
          id={STEP_HEADING_ID}
          tabIndex={-1}
          className="mt-4 font-[var(--font-heading)] text-2xl font-bold text-[var(--ge-dark-gray)] outline-none sm:text-3xl"
        >
          {isSinglePlan ? `Thanks, ${firstName}! Your ${planContent!.name} estimate is on its way.` : `Thanks, ${firstName}! Your three options are on their way.`}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-base text-[var(--ge-supporting-gray)]">
          {isSinglePlan
            ? `We highlighted ${planContent!.name} in the email we just sent, and kept Silver, Gold, and Platinum available so you can compare.`
            : "We've included Silver, Gold, and Platinum in the email we just sent so you can compare finish, durability, and estimated investment."}
        </p>
      </div>

      {planContent && planResult ? (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border-2 border-[var(--ge-green)] bg-[var(--ge-green)]/5 p-6 text-center">
          <p className="font-[var(--font-heading)] text-lg font-bold text-[var(--ge-dark-gray)]">
            {planContent.name} &mdash; {planResult.formattedRange}
          </p>
          <p className="text-sm text-[var(--ge-supporting-gray)]">
            Your estimate: <span className="font-semibold text-[var(--ge-dark-gray)]">{planResult.formattedEstimatedTotal}</span>
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <CallCta onCallClick={onCallClick} />
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onBackToResults}
          className="text-sm font-semibold text-[var(--ge-green-dark)] underline underline-offset-2"
        >
          Compare all three options again
        </button>
      </div>

      <ProductShowcase />
      <ProcessSection />
      <TrustSection />
      <Disclaimer />

      <p className="sr-only">Estimate reference: {estimateId}</p>
    </div>
  );
}
