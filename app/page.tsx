import { LandingNavbar } from "@/features/landing/navbar";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { BusinessTypesStrip } from "@/features/landing/business-types-strip";
import { FinalCta } from "@/features/landing/final-cta";
import { LandingFooter } from "@/features/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <Hero />
        <BusinessTypesStrip />
        <HowItWorks />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
