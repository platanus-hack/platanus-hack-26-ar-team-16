"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Final value to display once animation completes (string allowed for non-numeric like "<1d", "0ms", "∞") */
  value: string;
  /** Optional numeric target for the count-up; if omitted we just fade-in */
  to?: number;
  /** Format function to render the numeric value during count-up */
  format?: (n: number) => string;
  duration?: number;
}

export function NumberTicker({
  value,
  to,
  format = (n) => Math.round(n).toString(),
  duration = 1400,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(typeof to === "number" ? format(0) : value);

  // Keep the latest format/value/to/duration in refs so the effect can be a
  // stable mount-once IO. Otherwise the parent re-renders continuously
  // recreate the `format` arrow, the dep array changes every paint, the
  // effect tears down and remounts mid-animation, and the user sees the
  // counter flicker between its first two frames (0 and 1) forever.
  const fmtRef = useRef(format);
  const valRef = useRef(value);
  const toRef = useRef(to);
  const durRef = useRef(duration);
  fmtRef.current = format;
  valRef.current = value;
  toRef.current = to;
  durRef.current = duration;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(el);

        const target = toRef.current;
        if (typeof target !== "number") {
          setDisplay(valRef.current);
          return;
        }

        const start = performance.now();
        const dur = durRef.current;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(fmtRef.current(eased * target));
          if (t < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            setDisplay(valRef.current);
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return <span ref={ref}>{display}</span>;
}
