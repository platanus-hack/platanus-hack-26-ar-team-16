"use client";

import { Eyebrow } from "./primitives";
import { Reveal } from "./reveal";
import { NumberTicker } from "./number-ticker";

export function Outcomes() {
  const stats: {
    v: string;
    to?: number;
    format?: (n: number) => string;
    l: string;
    note: string;
  }[] = [
    {
      v: "<1d",
      l: "Time to integrate the SDK",
      note: "drop-in component",
    },
    {
      v: "5",
      to: 5,
      l: "Tools the AI calls to mutate plans",
      note: "multi-step loop",
    },
    {
      v: "0ms",
      to: 0,
      format: (n) => `${Math.round(n)}ms`,
      l: "From AI edit to routine on screen",
      note: "supabase realtime",
    },
    {
      v: "∞",
      l: "Tenants per deployment",
      note: "RLS-scoped, multi-brand",
    },
  ];
  return (
    <section className="py-32 md:py-40 border-y border-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Reveal>
          <Eyebrow number="08">Numbers we obsess over</Eyebrow>
        </Reveal>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={i * 90}>
              <div className="display tabular text-6xl md:text-8xl lg:text-[8.5rem] mb-4 text-[var(--color-ink)] leading-none">
                <NumberTicker value={s.v} to={s.to} format={s.format} />
              </div>
              <div className="text-base text-[var(--color-graphite)] leading-snug max-w-[220px] mb-2 font-medium">
                {s.l}
              </div>
              <div className="text-sm font-mono text-[var(--color-fade)] uppercase tracking-wider">
                {s.note}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
