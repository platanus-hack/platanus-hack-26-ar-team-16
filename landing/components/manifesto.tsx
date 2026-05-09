import { Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

export function Manifesto() {
  return (
    <section id="manifesto" className="py-32 md:py-48">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-3">
          <Reveal>
            <Eyebrow number="03">Manifesto</Eyebrow>
          </Reveal>
        </div>
        <div className="md:col-span-9">
          <Reveal delay={120}>
            <p className="display text-[2.5rem] md:text-[4.5rem] lg:text-[5.5rem] text-[var(--color-graphite)] max-w-5xl leading-[1]">
              Gym apps haven&rsquo;t kept up.
              <br />
              Routines stay frozen. Edits feel like
              <br />
              filing a tax form. Members close the
              <br />
              app and{" "}
              <span className="display-italic text-[var(--color-flame)]">
                open ChatGPT
              </span>{" "}
              instead.
            </p>
          </Reveal>
          <div className="mt-16 grid md:grid-cols-2 gap-10 max-w-4xl">
            <Reveal delay={300}>
              <p className="text-lg text-[var(--color-mute)] leading-relaxed">
                We close that gap. Gohan AI ships your members a coach that
                knows their level, their equipment, their injuries — and
                rewrites their programme as they live their week.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <p className="text-lg text-[var(--color-mute)] leading-relaxed">
                No new app. No new login. Inside the brand they trust. Your
                backend, your data, your members. Our intelligence.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
