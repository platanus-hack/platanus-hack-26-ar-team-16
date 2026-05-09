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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(el);
        if (typeof to !== "number") {
          // Non-numeric — just reveal once
          setDisplay(value);
          return;
        }
        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(format(eased * to));
          if (t < 1) raf = requestAnimationFrame(tick);
          else setDisplay(value);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, to, duration, format]);

  return <span ref={ref}>{display}</span>;
}
