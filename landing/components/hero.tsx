import { Arrow, Eyebrow } from "./primitives";
import { HeroBackdrop } from "./hero-backdrop";
import { Reveal } from "./reveal";
import { Magnetic } from "./interactions";
import { LetterRise } from "./letter-rise";

export function Hero() {
  return (
    <section className="relative pt-28 pb-24 md:pt-44 md:pb-40 overflow-hidden isolate">
      <HeroBackdrop />

      <div className="mx-auto max-w-[1440px] px-6 md:px-10 relative">
        <Reveal>
          <Eyebrow number="01">AI for fitness · Buenos Aires</Eyebrow>
        </Reveal>

        <h1 className="display mt-10 text-[19vw] md:text-[15vw] lg:text-[14rem] -tracking-[0.04em]">
          <LetterRise text="Make your gym" />
          <br />
          <span className="display-italic text-[var(--color-flame)]">
            <LetterRise text="think." stagger={45} delay={500} />
          </span>
        </h1>

        <div className="mt-14 grid md:grid-cols-12 gap-y-10 gap-x-8 max-w-6xl">
          <Reveal delay={700} className="md:col-span-7">
            <p className="text-xl md:text-2xl leading-[1.35] text-[var(--color-graphite)]">
              An AI personal trainer your gym&rsquo;s app can plug in.
              Conversational coaching, routines that rewrite themselves in
              real-time, integrable in any existing app via{" "}
              <span className="font-mono text-[0.92em] tracking-tight">MCP</span>.
            </p>
          </Reveal>
          <Reveal
            delay={820}
            className="md:col-span-5 md:col-start-9 self-end"
          >
            <div className="flex flex-col gap-3">
              <Magnetic>
                <a
                  href="#contact"
                  className="btn-shine inline-flex items-center justify-between w-full px-6 py-4 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-flame)] transition-colors group"
                >
                  <span className="font-medium text-[15px]">
                    Book a 15-min walkthrough
                  </span>
                  <Arrow className="ml-4" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#try"
                  className="btn-shine inline-flex items-center justify-between w-full px-6 py-4 rounded-full border border-[var(--color-ink)]/15 hover:border-[var(--color-ink)] transition-colors group"
                >
                  <span className="font-medium text-[15px]">
                    Try the live demo
                  </span>
                  <Arrow className="ml-4" />
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal
        delay={900}
        className="absolute right-6 md:right-10 top-32 md:top-44 hidden md:block"
      >
        <div className="text-right text-[10px] uppercase tracking-[0.22em] text-[var(--color-mute)] font-mono">
          <div className="flex items-center justify-end gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-flame)] pulse-ring" />
            <span>v0.1 · Live demo</span>
          </div>
          <div className="mt-1">Buenos Aires</div>
        </div>
      </Reveal>
    </section>
  );
}
