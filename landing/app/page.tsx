import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Manifesto } from "@/components/manifesto";
import { Pillars } from "@/components/pillars";
import { ScrollPhone } from "@/components/scroll-phone";
import { HowItWorks } from "@/components/how-it-works";
import { ForDevelopers } from "@/components/for-developers";
import { Outcomes } from "@/components/outcomes";
import { CallToAction } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Marquee />
      <Manifesto />
      <Pillars />
      <ScrollPhone />
      <HowItWorks />
      <ForDevelopers />
      <Outcomes />
      <CallToAction />
      <Footer />
    </main>
  );
}
