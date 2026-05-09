import { Arrow, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";
import { Magnetic } from "./interactions";

export function CallToAction() {
  return (
    <section
      id="contact"
      className="relative py-32 md:py-44 bg-[var(--color-flame)] text-[var(--color-ink)] overflow-hidden"
    >
      <div className="grain-overlay" />
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 relative">
        <Reveal>
          <Eyebrow number="09" variant="flame">Talk to us</Eyebrow>
        </Reveal>
        <Reveal delay={160}>
          <h2 className="display mt-10 text-[3.5rem] md:text-[7rem] lg:text-[10rem] leading-[0.92] mb-14 max-w-6xl">
            Your members are
            <br />
            already chatting
            <br />
            with an AI.
            <br />
            <span className="display-italic">Make it yours.</span>
          </h2>
        </Reveal>
        <Reveal delay={320}>
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
            <Magnetic strength={8} className="flex-1">
              <a
                href="mailto:hello@gohan.ai?subject=Gohan%20AI%20%E2%80%94%20I%20want%20to%20integrate"
                className="btn-shine w-full inline-flex items-center justify-between px-8 py-5 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] transition-colors group"
              >
                <span className="font-medium text-lg">
                  Start the conversation
                </span>
                <Arrow className="ml-4" />
              </a>
            </Magnetic>
            <Magnetic strength={8}>
              <a
                href="https://github.com/platanus-hack/platanus-hack-26-ar-team-16"
                target="_blank"
                rel="noreferrer"
                className="btn-shine inline-flex items-center justify-between px-8 py-5 rounded-full border border-[var(--color-ink)]/30 hover:border-[var(--color-ink)] transition-colors group"
              >
                <span className="font-medium text-lg">See the code</span>
                <Arrow className="ml-4" />
              </a>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
