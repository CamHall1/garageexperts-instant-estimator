import { assets, business } from "@/config/estimator.config";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--ge-light-gray)] bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <a href={business.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo, no optimization needed */}
          <img src={assets.logoMark} alt={business.name} className="h-8 w-auto sm:h-9" />
        </a>
        <a
          href={`tel:${business.phoneE164}`}
          className="text-sm font-semibold text-[var(--ge-dark-gray)]"
        >
          {business.phoneDisplay}
        </a>
      </div>
    </header>
  );
}
