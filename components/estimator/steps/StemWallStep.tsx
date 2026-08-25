"use client";

import { useState } from "react";
import { AnswerCard } from "@/components/estimator/AnswerCard";
import { StepHeading } from "@/components/estimator/StepHeading";
import { IconHelp, IconWallHigh, IconWallLow, IconWallNone } from "@/components/estimator/icons";
import { useAutoAdvance } from "@/lib/estimator/useAutoAdvance";
import type { StemWall } from "@/lib/pricing/types";

const OPTIONS: Array<{ value: StemWall; label: string; icon: React.ReactNode }> = [
  { value: "none", label: "None", icon: <IconWallNone /> },
  { value: "up_to_6", label: "Up to 6 in.", icon: <IconWallLow /> },
  { value: "over_6_to_12", label: "More than 6–12 in.", icon: <IconWallHigh /> },
  { value: "not_sure", label: "Not sure", icon: <IconHelp /> },
];

export interface StemWallStepProps {
  initialValue: StemWall | null;
  onNext: (value: StemWall) => void;
  onBack: () => void;
}

export function StemWallStep({ initialValue, onNext, onBack }: StemWallStepProps) {
  const [selected, setSelected] = useState<StemWall | null>(initialValue);
  const advance = useAutoAdvance<StemWall>(onNext);

  function handleSelect(value: StemWall) {
    setSelected(value);
    advance(value);
  }

  return (
    <div>
      <StepHeading subtext="A stem wall is the short raised section of concrete around the bottom edge of a garage wall, where the framed wall sits above the floor. If you are unsure, select Not sure.">
        Does the garage have an exposed concrete stem wall?
      </StepHeading>
      <fieldset className="space-y-3">
        <legend className="sr-only">Does the garage have an exposed concrete stem wall?</legend>
        {OPTIONS.map((option) => (
          <AnswerCard
            key={option.value}
            name="stem-wall"
            value={option.value}
            label={option.label}
            icon={option.icon}
            checked={selected === option.value}
            onSelect={(value) => handleSelect(value as StemWall)}
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
