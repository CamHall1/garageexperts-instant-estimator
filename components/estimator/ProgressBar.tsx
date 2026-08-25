import { PROJECT_QUESTION_STEPS, type StepId } from "@/lib/estimator/state";

interface ProgressBarProps {
  currentStep: StepId;
}

const LABELS: Record<StepId, string> = {
  intro: "Start",
  address: "Address",
  square_footage: "Square footage",
  concrete: "Concrete",
  steps: "Steps",
  stem_wall: "Stem wall",
  contact: "Your estimate is ready",
  results: "Results",
  confirmation: "Confirmation",
};

export function ProgressBar({ currentStep }: ProgressBarProps) {
  if (currentStep === "intro" || currentStep === "results" || currentStep === "confirmation") return null;

  const isContact = currentStep === "contact";
  const stepIndex = isContact
    ? PROJECT_QUESTION_STEPS.length
    : PROJECT_QUESTION_STEPS.indexOf(currentStep);
  const total = PROJECT_QUESTION_STEPS.length;
  const current = Math.max(1, stepIndex + 1);

  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-medium text-[var(--ge-supporting-gray)]">
        {isContact ? LABELS.contact : `Question ${current} of ${total}: ${LABELS[currentStep]}`}
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--ge-light-gray)]"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Estimate progress: question ${current} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-[var(--ge-green)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
