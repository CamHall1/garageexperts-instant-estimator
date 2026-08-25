import { EstimatorFlow } from "@/components/estimator/EstimatorFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-white">
        <EstimatorFlow />
      </main>
      <SiteFooter />
    </>
  );
}
