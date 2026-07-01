import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/server";
import AboutHeroSection from "@/components/about/AboutHeroSection";
import FeaturesSection from "@/components/about/FeaturesSection";
import HowItWorksSection from "@/components/about/HowItWorksSection";
import FaqSection from "@/components/about/FaqSection";
import CtaSection from "@/components/about/CtaSection";

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <>
      <Header />

      <main className="flex-1">
        <AboutHeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
        <CtaSection isLoggedIn={isLoggedIn} />
      </main>

      <Footer />
    </>
  );
}
