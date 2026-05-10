"use client";

/**
 * Splits a string into individual <span> letters that animate up + fade in
 * with a staggered delay. Used on the hero headline for an editorial reveal.
 *
 * Words are kept intact: each word gets its own inline-block wrapper with
 * white-space: nowrap so the browser can never break between letters of
 * the same word (which we briefly shipped — "Make your gym" became
 * "Make your gy" + "m" on iPhone). The animation still runs per-letter
 * via the inner spans + the .letter-rise CSS keyframe.
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
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <span className="letter-rise" aria-label={text}>
      {words.map((word, wi) => (
        <span key={`w-${wi}`}>
          <span
            className="inline-block whitespace-nowrap"
            aria-hidden
          >
            {Array.from(word).map((ch, i) => {
              const idx = charIndex++;
              return (
                <span
                  key={i}
                  style={{ animationDelay: `${delay + idx * stagger}ms` }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? (
            <span className="space" aria-hidden>
              &nbsp;
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
