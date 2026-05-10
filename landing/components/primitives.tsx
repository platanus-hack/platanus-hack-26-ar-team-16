import type { ReactNode } from "react";
import Image from "next/image";

// PNG-based wordmark glyph (the hex-G with dumbbells). Two versions:
//   "dark"  - black logo with transparent background, for paper (light) surfaces
//   "light" - white logo with transparent background, for ink (dark) surfaces
// Both files live in /landing/public/ so they're served as static assets.
export function Logo({
  className = "",
  variant = "dark",
  size = 28,
}: {
  className?: string;
  variant?: "dark" | "light";
  size?: number;
}) {
  const src = variant === "light" ? "/logo-light.png" : "/logo.png";
  return (
    <Image
      src={src}
      alt="Gohan AI"
      width={size}
      height={size}
      className={className}
      priority
    />
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
