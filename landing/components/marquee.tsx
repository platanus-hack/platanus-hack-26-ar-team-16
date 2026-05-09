import { Eyebrow } from "./primitives";

export function Marquee() {
  const items = [
    { name: "Megatlon", src: "/logos/megatlon.svg" },
    { name: "SportClub", src: "/logos/sportclub.png" },
    { name: "Always", src: "/logos/always.png" },
    { name: "Smart Fit", src: "/logos/smartfit.svg" },
    { name: "Fiter", src: "/logos/fiter.svg" },
    { name: "Anytime Fitness", src: "/logos/anytimefitness.svg" },
    { name: "Crunch", src: "/logos/crunch.svg" },
  ];
  const sequence = [...items, ...items];
  return (
    <section className="border-y border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] py-10 overflow-hidden bg-[var(--color-cream)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 mb-8">
        <Eyebrow number="02">
          Built for the apps your members already open
        </Eyebrow>
      </div>
      <div className="flex marquee items-center whitespace-nowrap">
        {sequence.map((it, i) => (
          <div
            key={i}
            className="mx-10 md:mx-14 flex items-center justify-center h-10 md:h-12 shrink-0"
            aria-label={it.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.src}
              alt={it.name}
              className="h-full w-auto object-contain grayscale opacity-55 hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
