"use client";

import { useEffect, useRef } from "react";

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--mx", `50%`);
      el.style.setProperty("--my", `40%`);
    };

    onLeave();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        // CSS variables read by the spotlight layer
        // @ts-expect-error custom property
        "--mx": "50%",
        "--my": "40%",
      }}
    >
      <div className="absolute inset-0 bg-[var(--color-paper)]" />

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-luminosity"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster=""
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Paper tint to keep dark hero text legible over the video */}
      <div className="absolute inset-0 bg-[var(--color-paper)] opacity-50" />

      {/* Drifting blobs */}
      <div className="absolute inset-0 mix-blend-multiply">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
      </div>

      {/* Cursor-following spotlight — soft warm halo */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at var(--mx) var(--my), color-mix(in srgb, var(--color-flame) 25%, transparent) 0%, transparent 28%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* SVG grain — subtle filmic texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="hero-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>

      {/* Edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,color-mix(in_srgb,var(--color-ink)_18%,transparent)_100%)]" />
    </div>
  );
}
