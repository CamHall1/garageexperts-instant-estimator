import { assets, business } from "@/config/estimator.config";

export interface IntroStepProps {
  onStart: () => void;
}

export function IntroStep({ onStart }: IntroStepProps) {
  return (
    <div className="text-center">
      <h1 className="font-[var(--font-heading)] text-3xl font-bold tracking-tight text-[var(--ge-dark-gray)] sm:text-4xl">
        Get an Instant Garage Floor Estimate
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-[var(--ge-supporting-gray)] sm:text-lg">
        Answer a few quick questions to compare three Garage FX® flooring options for your
        garage. An approximate square footage is all you need.
      </p>
      <p className="mt-4 text-sm font-medium text-[var(--ge-dark-gray)]">
        Free estimate &bull; No obligation &bull; Final pricing confirmed on site
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ge-green)] px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--ge-green-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)] motion-reduce:transition-none"
      >
        Start My Estimate
      </button>
      <div className="mx-auto mt-10 overflow-hidden rounded-2xl border-2 border-[var(--ge-light-gray)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static photo, no optimization needed */}
        <img
          src={assets.introHero}
          alt={`Garage transformation by ${business.name}`}
          className="aspect-video w-full object-cover"
        />
      </div>
    </div>
  );
}
