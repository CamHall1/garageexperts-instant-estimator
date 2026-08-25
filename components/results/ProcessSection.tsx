import { processSteps } from "@/config/estimator.config";

export function ProcessSection() {
  return (
    <section aria-labelledby="process-heading" className="mt-16">
      <h2 id="process-heading" className="font-[var(--font-heading)] text-2xl font-bold text-[var(--ge-dark-gray)]">
        How it works
      </h2>
      <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border-2 border-[var(--ge-light-gray)] p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ge-black)] text-sm font-bold text-white">
              {index + 1}
            </span>
            <h3 className="mt-3 font-[var(--font-heading)] text-base font-bold text-[var(--ge-dark-gray)]">
              {step.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--ge-supporting-gray)]">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
