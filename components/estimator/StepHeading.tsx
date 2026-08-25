import type { ReactNode } from "react";

export const STEP_HEADING_ID = "estimator-step-heading";

interface StepHeadingProps {
  children: ReactNode;
  subtext?: ReactNode;
}

/**
 * Rendered fresh for every step at a stable id/tabIndex so the flow
 * orchestrator can move focus here after each transition -- the browser's
 * focus announcement is what satisfies "announce the transition accessibly"
 * without a separate aria-live region duplicating the same text.
 */
export function StepHeading({ children, subtext }: StepHeadingProps) {
  return (
    <div className="mb-6">
      <h2
        id={STEP_HEADING_ID}
        tabIndex={-1}
        className="font-[var(--font-heading)] text-2xl font-bold tracking-tight text-[var(--ge-dark-gray)] outline-none sm:text-3xl"
      >
        {children}
      </h2>
      {subtext ? <p className="mt-2 text-base text-[var(--ge-supporting-gray)]">{subtext}</p> : null}
    </div>
  );
}
