import Navbar from "@/landpage/src/components/Navbar.tsx";
import Hero from "@/landpage/src/components/Hero.tsx";
import Features from "@/landpage/src/components/Features.tsx";
import Topics from "@/landpage/src/components/Topics.tsx";
import Stats from "@/landpage/src/components/Stats.tsx";
import CTA from "@/landpage/src/components/CTA.tsx";
import Footer from "@/landpage/src/components/Footer.tsx";
import Particles from "@/landpage/src/components/Particles.tsx";
import useCustomCursor from "@/landpage/src/hooks/useCustomCursor.ts";
import useRevealOnScroll from "@/landpage/src/hooks/useRevealOnScroll.ts";

export default function LandingPage() {
  const { dotRef, outlineRef } = useCustomCursor();
  useRevealOnScroll();

  return (
    <div className="landing-page">
      <div ref={dotRef} className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 -translate-1/2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] max-md:hidden" />
      <div ref={outlineRef} className="pointer-events-none fixed top-0 left-0 z-[9999] h-9 w-9 -translate-1/2 rounded-full border border-teal-300/60 shadow-[0_0_35px_rgba(56,189,248,0.45)] backdrop-blur-[4px] max-md:hidden" />
      <Particles />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Topics />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
