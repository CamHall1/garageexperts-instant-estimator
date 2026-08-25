import { assets, cabinetsCrossSell } from "@/config/estimator.config";
import { IconCheck } from "@/components/estimator/icons";

export interface CabinetsCrossSellProps {
  onLearnMoreClick?: () => void;
}

/** Upsell shown at the end of the results page -- see docs/ASSET_REPLACEMENT.md. */
export function CabinetsCrossSell({ onLearnMoreClick }: CabinetsCrossSellProps) {
  return (
    <section aria-labelledby="cabinets-heading" className="mt-16 overflow-hidden rounded-2xl border-2 border-[var(--ge-light-gray)]">
      <div className="grid gap-0 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- static photo, no optimization needed */}
        <img
          src={assets.cabinetsHero}
          alt="Custom GarageExperts cabinet and storage system"
          className="h-64 w-full object-cover sm:h-full"
        />
        <div className="p-6 sm:p-8">
          <h2 id="cabinets-heading" className="font-[var(--font-heading)] text-2xl font-bold text-[var(--ge-dark-gray)]">
            {cabinetsCrossSell.heading}
          </h2>
          <p className="mt-3 text-sm text-[var(--ge-supporting-gray)]">{cabinetsCrossSell.body}</p>
          <ul className="mt-4 space-y-2">
            {cabinetsCrossSell.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm text-[var(--ge-dark-gray)]">
                <span className="mt-0.5 shrink-0 text-[var(--ge-green)]">
                  <IconCheck />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <a
            href={cabinetsCrossSell.ctaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onLearnMoreClick}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ge-black)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--ge-dark-gray)] motion-reduce:transition-none"
          >
            {cabinetsCrossSell.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
