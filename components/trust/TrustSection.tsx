import { business, trustProofPoints } from "@/config/estimator.config";
import { IconCheck } from "@/components/estimator/icons";

export function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="mt-16 rounded-2xl bg-[var(--ge-black)] p-6 text-white sm:p-8">
      <h2 id="trust-heading" className="font-[var(--font-heading)] text-2xl font-bold">
        Warranty &amp; trust
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {trustProofPoints.map((point) => (
          <li key={point} className="flex items-start gap-3 text-sm text-white/90">
            <span className="mt-0.5 shrink-0 text-[var(--ge-green)]">
              <IconCheck />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <a
        href={business.warrantyUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block text-sm font-semibold text-[var(--ge-green)] underline underline-offset-2"
      >
        Read the official warranty terms
      </a>
    </section>
  );
}
