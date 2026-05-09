"use client";

import { useEffect, useState } from "react";

/**
 * 2px flame bar at the very top tracking page scroll progress.
 * Sits above the nav so it's always visible. Uses rAF for smoothness.
 */
export function ScrollProgress() {
  const [w, setW] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? (window.scrollY / max) * 100 : 0;
        setW(Math.max(0, Math.min(100, p)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="scroll-progress fixed top-0 inset-x-0 z-[60] h-[2px] pointer-events-none">
      <div
        className="h-full bg-[var(--color-flame)] transition-[width] duration-100 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}
