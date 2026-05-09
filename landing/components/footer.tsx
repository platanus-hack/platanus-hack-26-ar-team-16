import type { ReactNode } from "react";
import { Logo } from "./primitives";

export function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-[var(--color-paper)] py-20">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2.5 mb-6">
            <Logo />
            <span className="text-[13px] tracking-[0.22em] uppercase font-medium">
              Gohan AI
            </span>
          </div>
          <p className="display text-2xl md:text-3xl text-[var(--color-paper)] max-w-md leading-tight">
            The AI personal trainer your gym&rsquo;s app can{" "}
            <span className="display-italic text-[var(--color-flame)]">
              plug in.
            </span>
          </p>
          <p className="mt-6 text-sm text-[var(--color-paper)]/55 max-w-sm leading-relaxed">
            Built during Platanus Hack 26 in Buenos Aires.
            Track: Vertical AI.
          </p>
        </div>
        <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <FooterCol
            title="Product"
            items={[
              ["Manifesto", "#manifesto"],
              ["Try it", "#try"],
              ["How it works", "#how"],
              ["Developers", "#developers"],
            ]}
          />
          <FooterCol
            title="Demo"
            items={[
              ["Live app", "https://gohan-app-theta.vercel.app"],
              ["GitHub", "https://github.com/platanus-hack/platanus-hack-26-ar-team-16"],
              ["Track", "https://hack.platan.us"],
            ]}
          />
          <FooterCol
            title="Team"
            items={[
              ["@DanteDia", "https://github.com/DanteDia"],
              ["@thblu", "https://github.com/thblu"],
              ["@alexndr-n", "https://github.com/alexndr-n"],
              ["@Juampiman", "https://github.com/Juampiman"],
            ]}
          />
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 mt-16 pt-8 border-t border-[var(--color-paper)]/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-[var(--color-paper)]/50">
        <div>© 2026 Gohan AI · team-16</div>
        <div className="font-mono tracking-[0.2em]">
          MAKE · YOUR · GYM · THINK
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}): ReactNode {
  return (
    <div>
      <div className="eyebrow text-[var(--color-paper)]/40 mb-4">{title}</div>
      <ul className="space-y-2.5">
        {items.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="link-under text-[var(--color-paper)]/80 hover:text-[var(--color-flame)] transition-colors"
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
