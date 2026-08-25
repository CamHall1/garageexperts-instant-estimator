import { business } from "@/config/estimator.config";

export interface CallCtaProps {
  onCallClick: () => void;
}

export function CallCta({ onCallClick }: CallCtaProps) {
  return (
    <a
      href={`tel:${business.phoneE164}`}
      onClick={onCallClick}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--ge-green)] px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--ge-green-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)] motion-reduce:transition-none"
    >
      Call GarageExperts Now — {business.phoneDisplay}
    </a>
  );
}
