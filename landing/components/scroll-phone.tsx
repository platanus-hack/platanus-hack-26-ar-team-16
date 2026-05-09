"use client";

import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "./primitives";

const APP_URL = "https://gohan-app-theta.vercel.app";

export function ScrollPhone() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [interactive, setInteractive] = useState(false);

  // Scroll-driven progress with rAF — this is the cross-browser path.
  // Modern browsers ALSO get the CSS animation-timeline declared in globals.css,
  // which the JS overrides via inline style here for a single source of truth.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = track.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) {
          setProgress(0);
          return;
        }
        // 0 when the track top hits the viewport top, 1 when its bottom does
        const raw = (-rect.top) / total;
        const clamped = Math.max(0, Math.min(1, raw));
        setProgress(clamped);
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

  // Phone reaches "fully expanded" between 0.55 and 0.85 of the track.
  // Once fully expanded we let the iframe receive pointer events so the user
  // can interact with the live app inside the page.
  useEffect(() => {
    setInteractive(progress > 0.78);
  }, [progress]);

  // Tell the rest of the chrome (Nav, ScrollProgress) when the phone fully
  // owns the viewport. They fade out via [data-phone-fullscreen] selector
  // so the user sees the live app without a translucent nav strip eating
  // the megatlon header.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.phoneFullscreen =
      progress > 0.72 ? "1" : "0";
    return () => {
      delete document.documentElement.dataset.phoneFullscreen;
    };
  }, [progress]);

  // Map progress 0..1 into a phone scale 0.7 .. 1 and a corner radius
  // 2.75rem .. 0.4rem (some rounding stays even at full-bleed for charm).
  // Starts larger so the phone feels present from the moment the section enters.
  const expansion = Math.min(1, Math.max(0, (progress - 0.05) / 0.7));
  const scale = 0.7 + expansion * 0.3;
  const radius = 2.75 - expansion * 2.4;

  return (
    <section id="try" className="bg-[var(--color-cream)]">
      {/* Intro caption — visible before the scroll-lock starts */}
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 pt-32 md:pt-40 pb-16 md:pb-24 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <Eyebrow number="05">Try it · in the page</Eyebrow>
        </div>
        <div className="md:col-span-8">
          <h2 className="display text-4xl md:text-6xl lg:text-7xl text-[var(--color-graphite)] leading-[0.96]">
            Scroll. The app
            <br />
            <span className="display-italic text-[var(--color-flame)]">
              opens in front of you.
            </span>
          </h2>
          <p className="mt-8 text-lg text-[var(--color-mute)] max-w-xl leading-relaxed">
            Below is the real product, not a video. Sign in with the demo
            account and chat with the coach. The routine you see updates in
            real-time as the AI rewrites it.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--color-mute)]">
            <span className="px-3 py-1.5 rounded-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10">
              demo@gohan.ai
            </span>
            <span className="opacity-50">·</span>
            <span className="px-3 py-1.5 rounded-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10">
              GohanDemo2026!
            </span>
          </div>
        </div>
      </div>

      {/* Scroll track. Tall enough that the user has time to feel the
          expansion. The phone is sticky inside, the iframe is the payload. */}
      <div
        ref={trackRef}
        className="phone-track relative h-[260vh] md:h-[280vh]"
      >
        <div
          className={`sticky top-0 h-screen flex items-center justify-center overflow-hidden ${
            interactive ? "iframe-locked" : ""
          }`}
        >
          {/* Phone frame */}
          <div
            ref={stageRef}
            className="phone-stage relative origin-center transition-[box-shadow] duration-300"
            style={{
              transform: `scale(${scale})`,
              borderRadius: `${radius}rem`,
              width: "min(380px, 92vw)",
              height: "min(820px, 92vh)",
              background: "var(--color-ink)",
              padding: scale > 0.95 ? "0" : "0.6rem",
              boxShadow:
                scale > 0.95
                  ? "0 0 0 0 transparent"
                  : "0 30px 80px -20px rgba(0,0,0,0.45), 0 10px 30px -10px rgba(0,0,0,0.25)",
            }}
          >
            {/* iframe = the real app */}
            <iframe
              src={APP_URL}
              title="Gohan AI live app"
              className="block w-full h-full bg-[var(--color-paper)]"
              style={{
                borderRadius: `${Math.max(0, radius - 0.4)}rem`,
                pointerEvents: interactive ? "auto" : "none",
              }}
              allow="microphone"
            />

            {/* Phone notch — fades out as the phone fills the viewport */}
            <div
              aria-hidden
              className="absolute top-2 left-1/2 -translate-x-1/2 h-6 rounded-b-2xl bg-[var(--color-ink)] transition-opacity duration-300"
              style={{
                width: scale < 0.95 ? "5.5rem" : "0",
                opacity: scale < 0.95 ? 1 : 0,
              }}
            />
          </div>

          {/* Caption tracking the expansion progress */}
          <div className="pointer-events-none absolute inset-x-0 bottom-8 md:bottom-10 flex items-center justify-center px-6">
            <div
              className="px-4 py-2 rounded-full bg-[var(--color-ink)]/85 text-[var(--color-paper)] text-[11px] font-mono uppercase tracking-[0.2em] backdrop-blur-md transition-opacity duration-300"
              style={{ opacity: interactive ? 0 : 1 }}
            >
              {progress < 0.05
                ? "Scroll to open the app"
                : progress < 0.78
                ? `Opening · ${Math.round(expansion * 100)}%`
                : "Tap inside to use the live app"}
            </div>
          </div>

          {/* Editorial side captions — desktop only */}
          <SideCaptions progress={progress} />
        </div>
      </div>
    </section>
  );
}

function SideCaptions({ progress }: { progress: number }) {
  const captions = [
    { at: 0.1, label: "Login screen", text: "Email + password. Demo creds shown above." },
    { at: 0.35, label: "Home dashboard", text: "Today's workout, weekly streak, branded by tenant." },
    { at: 0.6, label: "Routine view", text: "Day-by-day breakdown. Updates in real time." },
    { at: 0.85, label: "Coach chat", text: "Ask. Watch the routine rewrite itself." },
  ];
  return (
    <div className="hidden md:block absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 w-64 lg:w-72 space-y-6">
      {captions.map((c) => {
        const active = progress >= c.at - 0.08 && progress <= c.at + 0.18;
        return (
          <div
            key={c.label}
            className="transition-all duration-500"
            style={{
              opacity: active ? 1 : 0.18,
              transform: `translateX(${active ? 0 : 12}px)`,
            }}
          >
            <div className="eyebrow text-[var(--color-flame)] mb-1.5">
              {c.label}
            </div>
            <div className="text-[var(--color-graphite)] text-sm leading-snug">
              {c.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
