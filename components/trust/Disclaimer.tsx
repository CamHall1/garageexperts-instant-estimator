import { fullResultDisclaimer } from "@/config/estimator.config";

export function Disclaimer() {
  return (
    <p className="mt-12 border-t border-[var(--ge-light-gray)] pt-6 text-xs leading-relaxed text-[var(--ge-supporting-gray)]">
      {fullResultDisclaimer}
    </p>
  );
}
