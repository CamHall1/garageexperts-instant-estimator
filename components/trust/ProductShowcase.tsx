import { assets } from "@/config/estimator.config";

const SHOWCASE_ITEMS = [
  {
    src: assets.heroFinishedFloor,
    alt: "Finished Garage FX floor with full-broadcast flake",
    caption: "Finished Garage FX® floor",
  },
  {
    src: assets.standardFlake,
    alt: "Standard chip flake blend close-up",
    caption: "Standard chip flake",
  },
  {
    src: assets.doubleTopcoat,
    alt: "Double polyaspartic topcoat cross-section",
    caption: "Double polyaspartic topcoat",
  },
  {
    src: assets.brindleFlake,
    alt: "Premium Brindle flake close-up",
    caption: "Premium Brindle flake",
  },
] as const;

/**
 * Branded placeholder photography -- see docs/ASSET_REPLACEMENT.md to swap
 * these for real project photos without touching this component.
 */
export function ProductShowcase() {
  return (
    <section aria-labelledby="showcase-heading" className="mt-16">
      <h2 id="showcase-heading" className="font-[var(--font-heading)] text-2xl font-bold text-[var(--ge-dark-gray)]">
        See the finish
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SHOWCASE_ITEMS.map((item) => (
          <figure key={item.caption} className="overflow-hidden rounded-2xl border-2 border-[var(--ge-light-gray)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- local SVG placeholders, no optimization needed */}
            <img src={item.src} alt={item.alt} className="aspect-square w-full object-cover" />
            <figcaption className="p-2 text-center text-xs font-medium text-[var(--ge-supporting-gray)]">
              {item.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
