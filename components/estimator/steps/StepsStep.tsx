"use client";

import { useState } from "react";
import { AnswerCard } from "@/components/estimator/AnswerCard";
import { StepHeading } from "@/components/estimator/StepHeading";
import { IconCheck, IconClose } from "@/components/estimator/icons";
import { useAutoAdvance } from "@/lib/estimator/useAutoAdvance";

export interface StepsStepProps {
  initialValue: boolean | null;
  onNext: (value: boolean) => void;
  onBack: () => void;
}

export function StepsStep({ initialValue, onNext, onBack }: StepsStepProps) {
  const [selected, setSelected] = useState<boolean | null>(initialValue);
  const advance = useAutoAdvance<boolean>(onNext);

  function handleSelect(value: boolean) {
    setSelected(value);
    advance(value);
  }

  return (
    <div>
      <StepHeading subtext="This helps our team understand the project before the on-site inspection.">
        Are there concrete steps that would also be coated?
      </StepHeading>
      <fieldset className="space-y-3">
        <legend className="sr-only">Are there concrete steps that would also be coated?</legend>
        <AnswerCard
          name="steps-present"
          value="yes"
          label="Yes"
          icon={<IconCheck />}
          checked={selected === true}
          onSelect={() => handleSelect(true)}
        />
        <AnswerCard
          name="steps-present"
          value="no"
          label="No"
          icon={<IconClose />}
          checked={selected === false}
          onSelect={() => handleSelect(false)}
        />
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
