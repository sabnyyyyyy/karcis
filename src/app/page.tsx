import { Hero } from "@/components/landing/Hero";
import { About, Services, Events, Passport, Contact, LandingFooter } from "@/components/landing/Sections";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen font-[family-name:var(--font-outfit)] overflow-x-clip">
      <Hero />
      <About />
      <Services />
      <Events />
      <Passport />
      <Contact />
      <LandingFooter />
    </main>
  );
}
