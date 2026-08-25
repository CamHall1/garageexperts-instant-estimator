"use client";

import { useState } from "react";
import { AnswerCard } from "@/components/estimator/AnswerCard";
import { StepHeading } from "@/components/estimator/StepHeading";
import { IconSlabClean, IconSlabHeavyCracks, IconSlabModerateCracks } from "@/components/estimator/icons";
import { useAutoAdvance } from "@/lib/estimator/useAutoAdvance";
import type { ConcreteCondition } from "@/lib/pricing/types";

const OPTIONS: Array<{
  value: ConcreteCondition;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "new_or_no_cracks",
    label: "New concrete / no visible cracks",
    description: "The slab appears newer or has little to no visible cracking.",
    icon: <IconSlabClean />,
  },
  {
    value: "average_cracking",
    label: "Average cracking",
    description: "A few typical hairline or moderate cracks are visible.",
    icon: <IconSlabModerateCracks />,
  },
  {
    value: "excessive_cracking",
    label: "Excessive cracking",
    description: "Numerous, wider, or more involved cracks are visible.",
    icon: <IconSlabHeavyCracks />,
  },
];

export interface ConcreteStepProps {
  initialValue: ConcreteCondition | null;
  onNext: (value: ConcreteCondition) => void;
  onBack: () => void;
}

export function ConcreteStep({ initialValue, onNext, onBack }: ConcreteStepProps) {
  const [selected, setSelected] = useState<ConcreteCondition | null>(initialValue);
  const advance = useAutoAdvance<ConcreteCondition>(onNext);

  function handleSelect(value: ConcreteCondition) {
    setSelected(value);
    advance(value);
  }

  return (
    <div>
      <StepHeading>How would you describe the concrete?</StepHeading>
      <fieldset className="space-y-3">
        <legend className="sr-only">How would you describe the concrete?</legend>
        {OPTIONS.map((option) => (
          <AnswerCard
            key={option.value}
            name="concrete-condition"
            value={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            checked={selected === option.value}
            onSelect={(value) => handleSelect(value as ConcreteCondition)}
          />
        ))}
      </fieldset>
      <div className="mt-8">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] rounded-full px-5 py-3 text-sm font-semibold text-[var(--ge-dark-gray)] transition-colors hover:bg-[var(--ge-light-gray)] motion-reduce:transition-none"
        >
          Back
        </button>
      </div>
    </div>
  );
}
