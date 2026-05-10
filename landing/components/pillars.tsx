import type { ReactNode } from "react";
import { Eyebrow } from "./primitives";
import { Reveal } from "./reveal";
import { Tilt } from "./interactions";

export function Pillars() {
  const pillars: {
    n: string;
    h: ReactNode;
    b: string;
  }[] = [
    {
      n: "i",
      h: (
        <>
          Coaching that
          <br />
          <span className="display-italic text-[var(--color-flame)]">
            converses.
          </span>
        </>
      ),
      b: "Streaming AI replies, voice or text. The only personal trainer that answers at 2am when your member is doubting their squat depth.",
    },
    {
      n: "ii",
      h: (
        <>
          Routines that
          <br />
          <span className="display-italic text-[var(--color-flame)]">
            rewrite themselves.
          </span>
        </>
      ),
      b: "Members ask. The plan changes. The app updates live. Conversation maps to structured database mutations through Claude tool use.",
    },
    {
      n: "iii",
      h: (
        <>
          Drops into
          <br />
          <span className="display-italic text-[var(--color-flame)]">
            any app.
          </span>
        </>
      ),
      b: "We ship as a module + MCP server. Your engineers wire it into your existing app in an afternoon. Your brand. Your members. Our brain.",
    },
  ];
  return (
    <section className="relative py-32 md:py-44 bg-[var(--color-ink)] text-[var(--color-paper)] overflow-hidden">
      <div className="grain-overlay grain-overlay-light" />
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 relative">
        <Reveal>
          <Eyebrow number="04" variant="invert">
            Three pillars
          </Eyebrow>
        </Reveal>
        <div className="mt-20 grid md:grid-cols-3 gap-px bg-[var(--color-paper)]/15">
          {pillars.map((p, i) => (
            <Reveal key={p.n} delay={i * 120}>
              <Tilt max={4}>
                <article className="bg-[var(--color-ink)] p-10 md:p-12 min-h-[420px] flex flex-col justify-between hover:bg-[color-mix(in_srgb,var(--color-ink)_92%,var(--color-flame))] transition-colors duration-500">
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--color-flame)] font-mono text-sm tracking-[0.2em]">
                      {p.n.toUpperCase()}.
                    </div>
                    <span className="h-px flex-1 bg-[var(--color-paper)]/15 group-hover:bg-[var(--color-flame)]/40 transition-colors" />
                  </div>
                  <div>
                    <h3 className="display text-3xl md:text-5xl mb-8 leading-[0.96]">
                      {p.h}
                    </h3>
                    <p className="text-[var(--color-paper)]/65 text-base leading-relaxed max-w-sm">
                      {p.b}
                    </p>
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
