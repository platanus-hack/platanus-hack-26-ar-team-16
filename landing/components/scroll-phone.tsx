"use client";

import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "./primitives";

// `?autoLogin=demo` makes the embedded app sign in as the seeded demo
// account on first paint, so iframe visitors skip the login screen.
const APP_URL = "https://gohan-app-theta.vercel.app/?autoLogin=demo";

// iPhone 13 logical viewport — 390 × 844 CSS pixels. We lock the desktop
// stage to these exact dimensions so the demo feels like a real device on
// the page; mobile keeps its full-bleed behavior so phone visitors get the
// app at native viewport size.
const IPHONE_W = 390;
const IPHONE_H = 844;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function ScrollPhone() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [interactive, setInteractive] = useState(false);
  const isMobile = useIsMobile();

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
  // the megatlon header. Only kicks in on mobile now — on desktop the phone
  // is locked to iPhone 13 size, so the nav can keep its place beside it.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.phoneFullscreen =
      isMobile && progress > 0.72 ? "1" : "0";
    return () => {
      delete document.documentElement.dataset.phoneFullscreen;
    };
  }, [progress, isMobile]);

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
            Below is the real product, not a video. The demo account is already
            signed in — tap inside, chat with the coach, watch the routine
            rewrite itself in real-time.
          </p>
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
          {/* Phone frame.
              Desktop: locked to iPhone 13 logical 390x844, regardless of
              expansion. The scale 0.7→1.0 animation still runs but the
              underlying box never leaves iPhone proportions, so it always
              looks like a real device on the page.
              Mobile: at full bleed (scale > 0.95) the frame jumps to
              100vw/100vh so phone visitors see the app at native size. */}
          <div
            ref={stageRef}
            className="phone-stage relative origin-center transition-[box-shadow] duration-300"
            style={{
              transform: `scale(${scale})`,
              borderRadius: `${radius}rem`,
              width: isMobile && scale > 0.95 ? "100vw" : `${IPHONE_W}px`,
              height: isMobile && scale > 0.95 ? "100vh" : `${IPHONE_H}px`,
              background:
                isMobile && scale > 0.95
                  ? "var(--color-ink)"
                  : "linear-gradient(155deg, #1c1c1e 0%, #050505 50%, #1c1c1e 100%)",
              padding: isMobile && scale > 0.95 ? "0" : "12px",
              boxShadow:
                isMobile && scale > 0.95
                  ? "0 0 0 0 transparent"
                  : "0 0 0 1.5px #2a2a2a, inset 0 0 0 0.5px rgba(255,255,255,0.04), 0 30px 80px -20px rgba(0,0,0,0.45), 0 10px 30px -10px rgba(0,0,0,0.25)",
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

            {/* Dynamic-Island-style notch. Centered, slightly below the
                top edge, with a subtle camera dot. Hidden in full-bleed
                mobile mode (we're already inside a real device). */}
            {!(isMobile && scale > 0.95) && (
              <div
                aria-hidden
                className="absolute top-[10px] left-1/2 -translate-x-1/2 z-10 h-[26px] w-[110px] rounded-full bg-black flex items-center justify-end pr-2 transition-opacity duration-300"
                style={{ opacity: scale < 0.95 ? 1 : 0.92 }}
              >
                <span className="w-[7px] h-[7px] rounded-full bg-[#0c0c0c] ring-1 ring-[#1d1d1f]" />
              </div>
            )}

            {/* Side buttons. Thin metallic strips that protrude a hair from
                the frame — cheap detail that reads as iPhone instantly.
                Hidden in mobile full-bleed since there's no frame anymore. */}
            {!(isMobile && scale > 0.95) && (
              <>
                {/* silent / mute switch (top-left) */}
                <span
                  aria-hidden
                  className="absolute -left-[2px] top-[100px] w-[2px] h-[28px] rounded-l-md bg-gradient-to-b from-[#2a2a2a] to-[#0e0e0e]"
                />
                {/* volume up */}
                <span
                  aria-hidden
                  className="absolute -left-[2px] top-[150px] w-[2px] h-[52px] rounded-l-md bg-gradient-to-b from-[#2a2a2a] to-[#0e0e0e]"
                />
                {/* volume down */}
                <span
                  aria-hidden
                  className="absolute -left-[2px] top-[212px] w-[2px] h-[52px] rounded-l-md bg-gradient-to-b from-[#2a2a2a] to-[#0e0e0e]"
                />
                {/* power / wake (right side) */}
                <span
                  aria-hidden
                  className="absolute -right-[2px] top-[140px] w-[2px] h-[80px] rounded-r-md bg-gradient-to-b from-[#2a2a2a] to-[#0e0e0e]"
                />
              </>
            )}
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
    { at: 0.1, label: "Auto sign-in", text: "Demo account loads. No login form to fill in." },
    { at: 0.35, label: "Home dashboard", text: "Today's workout, weekly streak, branded by tenant." },
    { at: 0.6, label: "Routine view", text: "Day-by-day breakdown. Updates in real time." },
    { at: 0.85, label: "Coach chat", text: "Ask. Watch the routine rewrite itself." },
  ];
  // Fade the whole group out as the phone approaches full bleed (scale > 0.95
  // happens around progress 0.63). By 0.62 they're fully gone so they never
  // sit on top of the live iframe.
  const groupOpacity = progress < 0.5 ? 1 : Math.max(0, 1 - (progress - 0.5) / 0.12);
  return (
    <div
      className="hidden md:block absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 w-64 lg:w-72 space-y-6 transition-opacity duration-300"
      style={{
        opacity: groupOpacity,
        pointerEvents: groupOpacity < 0.05 ? "none" : "auto",
      }}
      aria-hidden={groupOpacity < 0.05}
    >
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
