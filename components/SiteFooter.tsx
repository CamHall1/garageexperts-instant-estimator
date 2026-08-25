import { business } from "@/config/estimator.config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--ge-light-gray)] bg-white py-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 text-center text-xs text-[var(--ge-supporting-gray)]">
        <p>
          &copy; {new Date().getFullYear()} {business.name}. This is an instant estimate, not a
          final quote, contract, or offer.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-3">
          <a href={business.websiteUrl} target="_blank" rel="noreferrer" className="underline">
            Website
          </a>
          <a href={business.privacyUrl} target="_blank" rel="noreferrer" className="underline">
            Privacy Policy
          </a>
          <a href={business.termsUrl} target="_blank" rel="noreferrer" className="underline">
            Terms
          </a>
          <a href={business.warrantyUrl} target="_blank" rel="noreferrer" className="underline">
            Warranty
          </a>
        </p>
      </div>
    </footer>
  );
}
