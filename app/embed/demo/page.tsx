import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Embed demo | GarageExperts Instant Estimator",
  robots: { index: false, follow: false },
};

/**
 * Local demonstration of a landing page embedding /embed via the public
 * embed.js helper. Mirrors the copy-paste snippet in docs/IFRAME_EMBED.md.
 */
export default function EmbedDemoPage() {
  return (
    <main className="min-h-screen bg-[var(--ge-light-gray)] p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-[var(--ge-dark-gray)]">
          Sample Landing Page
        </h1>
        <p className="mb-6 text-sm text-[var(--ge-supporting-gray)]">
          This page demonstrates the cross-domain iframe embed exactly as a Meta/Google landing
          page would use it. The iframe below resizes itself automatically as the estimator
          progresses.
        </p>
        <div className="rounded-2xl border-2 border-[var(--ge-light-gray)] bg-white p-2">
          <iframe
            id="garageexperts-estimator"
            src="/embed"
            title="GarageExperts instant garage floor estimator"
            width="100%"
            height="760"
            loading="eager"
            style={{ display: "block", width: "100%", border: 0, overflow: "hidden" }}
            allow="clipboard-write"
          />
        </div>
      </div>
      <Script src="/embed.js" strategy="afterInteractive" />
    </main>
  );
}
