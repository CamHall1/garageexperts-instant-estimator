"use client";

import { useState, type FormEvent } from "react";
import { squareFootage } from "@/config/estimator.config";
import { squareFootageInputSchema } from "@/lib/validation/schemas";
import { StepHeading } from "@/components/estimator/StepHeading";

export interface SquareFootageStepProps {
  initialValue: number | null;
  onNext: (squareFeet: number) => void;
  onBack: () => void;
}

export function SquareFootageStep({ initialValue, onNext, onBack }: SquareFootageStepProps) {
  const [raw, setRaw] = useState(initialValue ? String(initialValue) : "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = squareFootageInputSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid number of square feet.");
      return;
    }
    setError(null);
    onNext(result.data);
  }

  return (
    <div>
      <StepHeading subtext="An approximate number is perfectly fine. If you are unsure, use your best estimate.">
        About how many square feet is the garage floor?
      </StepHeading>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="square-footage-input" className="sr-only">
          Garage square footage
        </label>
        <input
          id="square-footage-input"
          name="squareFootage"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "square-footage-error" : "square-footage-hint"}
          placeholder={`e.g. 500 (${squareFootage.min}–${squareFootage.max.toLocaleString()})`}
          className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-lg text-[var(--ge-dark-gray)] outline-none focus-visible:border-[var(--ge-green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)]"
        />
        <p id="square-footage-hint" className="mt-2 text-sm text-[var(--ge-supporting-gray)]">
          Accepted range: {squareFootage.min}&ndash;{squareFootage.max.toLocaleString()} sq. ft.
        </p>
        {error ? (
          <p id="square-footage-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] rounded-full px-5 py-3 text-sm font-semibold text-[var(--ge-dark-gray)] transition-colors hover:bg-[var(--ge-light-gray)] motion-reduce:transition-none"
          >
            Back
          </button>
          <button
            type="submit"
            className="min-h-[44px] flex-1 rounded-full bg-[var(--ge-green)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--ge-green-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)] motion-reduce:transition-none sm:flex-none"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
