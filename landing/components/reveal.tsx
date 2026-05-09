"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** vertical translate distance in px when hidden, default 16 */
  y?: number;
  /** trigger when this fraction of element is visible, default 0.18 */
  threshold?: number;
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  y = 18,
  threshold = 0.18,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Two-pass strategy:
    //   1) After first paint, if the element is already in view, reveal it
    //      synchronously so above-the-fold content is never stuck at opacity 0.
    //      A double rAF guarantees layout has settled.
    //   2) For elements below the fold, wire an IntersectionObserver.
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          setShown(true);
          obs.unobserve(el);
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      obs.disconnect();
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0)`,
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: shown ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
