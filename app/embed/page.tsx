import type { Metadata } from "next";
import { EmbedShell } from "@/components/embed/EmbedShell";

export const metadata: Metadata = {
  title: "GarageExperts instant garage floor estimator",
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  return (
    <main id="main-content" className="bg-white">
      <EmbedShell />
    </main>
  );
}
