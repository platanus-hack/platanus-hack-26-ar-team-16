import { Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

export function HowItWorks() {
  const steps = [
    {
      n: "01",
      h: "Connect",
      b: "Embed our React module in your app, or point your backend agent at our MCP server over HTTP. Both paths use the same nine-tool API.",
    },
    {
      n: "02",
      h: "Configure",
      b: "Issue a tenant API key. Pass logo, colors, and your user mapping. Tenant scoping is automatic from there — your members never leave your brand.",
    },
    {
      n: "03",
      h: "Coach",
      b: "Members chat naturally. Our AI calls structured tools to mutate plans. Realtime pushes the changes back to every screen.",
    },
  ];
  return (
    <section id="how" className="py-32 md:py-44">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-3">
            <Reveal>
              <Eyebrow number="06">How it works</Eyebrow>
            </Reveal>
          </div>
          <Reveal delay={120} className="md:col-span-9">
            <h2 className="display text-5xl md:text-7xl lg:text-[7.5rem] leading-[0.94]">
              Three steps.
              <br />
              <span className="display-italic text-[var(--color-flame)]">
                One afternoon.
              </span>
            </h2>
          </Reveal>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-[color-mix(in_srgb,var(--color-ink)_15%,transparent)]">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 130}>
              <article className="group relative bg-[var(--color-paper)] p-10 md:p-14 min-h-[360px] flex flex-col justify-between overflow-hidden cursor-default">
                <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--color-flame)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm text-[var(--color-flame)] tracking-wider">
                    {s.n}
                  </div>
                  <span className="h-px flex-1 bg-[var(--color-ink)]/10 group-hover:bg-[var(--color-flame)]/40 transition-colors duration-500" />
                </div>
                <div>
                  <h3 className="display text-4xl md:text-5xl mb-5 leading-[0.96] transition-transform duration-500 group-hover:-translate-y-1">
                    {s.h}
                  </h3>
                  <p className="text-[var(--color-mute)] leading-relaxed text-base">
                    {s.b}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
