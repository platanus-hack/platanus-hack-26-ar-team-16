import type { ReactNode } from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.5 11h11M11 5.5v11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={`transition-transform group-hover:translate-x-1 ${className}`}
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Eyebrow({
  number,
  children,
  variant = "default",
}: {
  number: string;
  children: ReactNode;
  /** "default" = paper bg, "invert" = ink bg, "flame" = flame bg (forces ink so it stays readable) */
  variant?: "default" | "invert" | "flame";
}) {
  const baseColor =
    variant === "invert"
      ? "text-[var(--color-paper)]/55"
      : variant === "flame"
      ? "text-[var(--color-ink)]/65"
      : "text-[var(--color-mute)]";
  const numberColor =
    variant === "flame" ? "text-[var(--color-ink)]" : "text-[var(--color-flame)]";

  return (
    <p className={`eyebrow ${baseColor}`}>
      <span className={numberColor}>{number}</span>
      <span className="mx-3 opacity-40">/</span>
      {children}
    </p>
  );
}
