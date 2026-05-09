"use client";

/**
 * Splits a string into individual <span> letters that animate up + fade in
 * with a staggered delay. Used on the hero headline for an editorial reveal.
 * Server-safe (no useEffect needed) — animation runs purely from CSS keyframes.
 */
export function LetterRise({
  text,
  stagger = 35,
  delay = 0,
}: {
  text: string;
  /** ms between each letter */
  stagger?: number;
  /** initial delay before the first letter */
  delay?: number;
}) {
  return (
    <span className="letter-rise" aria-label={text}>
      {Array.from(text).map((ch, i) => {
        if (ch === " ")
          return (
            <span key={i} className="space" aria-hidden>
              &nbsp;
            </span>
          );
        return (
          <span
            key={i}
            aria-hidden
            style={{ animationDelay: `${delay + i * stagger}ms` }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
