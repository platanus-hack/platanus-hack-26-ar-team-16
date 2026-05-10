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
  // fitScale shrinks the *layout box* of the phone so it never overflows
  // the viewport — even on a 13" MBP at fullscreen. We scale dimensions and
  // chrome (bezel, notch, side buttons) by this factor; transform: scale()
  // alone wasn't enough because it doesn't change the layout box, so the
  // 844px-tall iPhone kept eating into the nav and below the fold.
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const compute = () => {
      if (isMobile) {
        setFitScale(1);
        return;
      }
      const navHeight = 56; // h-14 fixed nav
      // 16px above + 16px below the phone — phone sits right under the nav
      // banner with a thin breathing band on each side. Anything more makes
      // the phone feel small on a 13" MBP at fullscreen.
      const breathingRoom = 32;
      const fit = (window.innerHeight - navHeight - breathingRoom) / IPHONE_H;
      // No floor: on very short viewports the phone shrinks but always fits.
      setFitScale(Math.min(1, fit));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isMobile]);

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

  // Animation: 0.7 → 1.0 of the *fitted* size (so on small viewports the
  // phone still grows from a smaller starting point but never exceeds the
  // safe area). Layout box dimensions further down use fitScale directly,
  // not animScale, so the box always fits regardless of expansion.
  const expansion = Math.min(1, Math.max(0, (progress - 0.05) / 0.7));
  const animScale = 0.7 + expansion * 0.3;
  const radius = 2.75 - expansion * 2.4;
  const isFullBleed = isMobile && animScale > 0.95;
  // Helper: scale a native iPhone-13 pixel value down to fit-size pixels.
  // Returns null when full-bleed mobile (no chrome rendered there).
  const fp = (n: number) => `${Math.round(n * fitScale)}px`;

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
          className={`sticky top-0 h-screen md:pt-14 flex items-center justify-center overflow-hidden ${
            interactive ? "iframe-locked" : ""
          }`}
        >
          {/* Phone frame. Layout dimensions are fit-scaled so the box
              never overflows the viewport. Chrome (bezel, notch, side
              buttons) is fit-scaled too so proportions stay iPhone-13.
              The 0.7→1.0 anim transform sits on top for the open effect.
              Mobile at scroll-end jumps to 100vw/100vh full-bleed. */}
          <div
            ref={stageRef}
            className="phone-stage relative origin-center transition-[box-shadow] duration-300"
            style={{
              transform: `scale(${animScale})`,
              borderRadius: `${radius}rem`,
              width: isFullBleed ? "100vw" : fp(IPHONE_W),
              height: isFullBleed ? "100vh" : fp(IPHONE_H),
              background: isFullBleed
                ? "var(--color-ink)"
                : "linear-gradient(155deg, #1f1f21 0%, #050505 50%, #1f1f21 100%)",
              padding: isFullBleed ? "0" : fp(14),
              boxShadow: isFullBleed
                ? "0 0 0 0 transparent"
                : `0 0 0 ${fp(2)} #2a2a2a, inset 0 0 0 0.5px rgba(255,255,255,0.05), 0 30px 80px -20px rgba(0,0,0,0.45), 0 10px 30px -10px rgba(0,0,0,0.25)`,
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

            {/* iPhone 13 notch. Anchored to the very top of the chassis
                so it reads as a real cutout (not a floating Dynamic
                Island pill). Camera + speaker grille inside. */}
            {!isFullBleed && (
              <div
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 z-10 bg-black flex items-center justify-center"
                style={{
                  top: fp(12),
                  height: fp(34),
                  width: fp(160),
                  borderBottomLeftRadius: fp(20),
                  borderBottomRightRadius: fp(20),
                  borderTopLeftRadius: fp(8),
                  borderTopRightRadius: fp(8),
                  gap: fp(10),
                }}
              >
                {/* speaker grille */}
                <span
                  className="bg-[#1d1d1f]"
                  style={{
                    width: fp(50),
                    height: fp(5),
                    borderRadius: fp(3),
                  }}
                />
                {/* camera */}
                <span
                  className="bg-[#0c0c0c] ring-1 ring-[#1d1d1f]"
                  style={{
                    width: fp(11),
                    height: fp(11),
                    borderRadius: fp(11),
                  }}
                />
              </div>
            )}

            {/* Side buttons. Slightly thicker strips so they actually
                read as iPhone hardware at the fitted scale. */}
            {!isFullBleed && (
              <>
                {/* silent / mute switch (top-left) */}
                <span
                  aria-hidden
                  className="absolute rounded-l-md bg-gradient-to-b from-[#3a3a3a] to-[#0e0e0e]"
                  style={{
                    left: fp(-3),
                    top: fp(108),
                    width: fp(4),
                    height: fp(34),
                  }}
                />
                {/* volume up */}
                <span
                  aria-hidden
                  className="absolute rounded-l-md bg-gradient-to-b from-[#3a3a3a] to-[#0e0e0e]"
                  style={{
                    left: fp(-3),
                    top: fp(170),
                    width: fp(4),
                    height: fp(60),
                  }}
                />
                {/* volume down */}
                <span
                  aria-hidden
                  className="absolute rounded-l-md bg-gradient-to-b from-[#3a3a3a] to-[#0e0e0e]"
                  style={{
                    left: fp(-3),
                    top: fp(240),
                    width: fp(4),
                    height: fp(60),
                  }}
                />
                {/* power / wake (right side) */}
                <span
                  aria-hidden
                  className="absolute rounded-r-md bg-gradient-to-b from-[#3a3a3a] to-[#0e0e0e]"
                  style={{
                    right: fp(-3),
                    top: fp(160),
                    width: fp(4),
                    height: fp(96),
                  }}
                />
              </>
            )}
          </div>

          {/* Caption tracking the expansion progress */}
          <div className="pointer-events-none absolute inset-x-0 bottom-8 md:bottom-10 flex items-center justify-center px-6">
            <div
              className="px-5 py-2.5 rounded-full bg-[var(--color-ink)]/85 text-[var(--color-paper)] text-sm font-mono uppercase tracking-[0.2em] backdrop-blur-md transition-opacity duration-300"
              style={{ opacity: interactive ? 0 : 1 }}
            >
              {progress < 0.05
                ? "Scroll to open the app"
                : progress < 0.78
                ? `Opening · ${Math.round(expansion * 100)}%`
                : "Tap inside to use the live app"}
            </div>
          </div>

          {/* QR to open the live demo on a phone — desktop only.
              Sits opposite the side captions so the locked iPhone frame
              has a card on each flank. */}
          <DemoQr />

          {/* Editorial side captions — desktop only */}
          <SideCaptions progress={progress} isMobile={isMobile} />
        </div>
      </div>
    </section>
  );
}

function SideCaptions({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const captions = [
    { at: 0.1, label: "Auto sign-in", text: "Demo account loads. No login form to fill in." },
    { at: 0.35, label: "Home dashboard", text: "Today's workout, weekly streak, branded by tenant." },
    { at: 0.6, label: "Routine view", text: "Day-by-day breakdown. Updates in real time." },
    { at: 0.85, label: "Coach chat", text: "Ask. Watch the routine rewrite itself." },
  ];
  // Mobile: fade out before the phone reaches full bleed so captions don't
  // sit on top of the live iframe. Desktop: phone is locked to iPhone 13
  // and never expands past the column, so we keep them up the whole time.
  const groupOpacity = !isMobile
    ? 1
    : progress < 0.5
      ? 1
      : Math.max(0, 1 - (progress - 0.5) / 0.12);
  return (
    <div
      className="hidden md:block absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 w-72 lg:w-80 space-y-7 transition-opacity duration-300"
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
            <div className="eyebrow text-[var(--color-flame)] mb-2">
              {c.label}
            </div>
            <div className="text-[var(--color-graphite)] text-base leading-snug">
              {c.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DemoQr() {
  // Encoded as ink-on-paper so the QR scans well on any phone camera.
  // We hit qrserver.com because adding a runtime dep for one image
  // isn't worth it — the URL is stable and the SVG response is tiny.
  const target = APP_URL;
  const params = new URLSearchParams({
    size: "320x320",
    data: target,
    color: "0a0a0a", // ink
    bgcolor: "f6f3ee", // paper
    margin: "0",
    qzone: "1",
    format: "svg",
  });
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  return (
    // Horizontally centered in the gap between the viewport edge and the
    // phone's left bezel: left = (viewport - phone width) / 4. The
    // translate(-50%) anchors the QR's center on that midpoint, so it
    // breathes evenly on either side regardless of screen width.
    <div
      className="hidden md:block absolute w-44 lg:w-48"
      style={{
        left: `calc((100vw - ${IPHONE_W}px) / 4)`,
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="eyebrow text-[var(--color-flame)] mb-3">
        Try it on your phone
      </div>
      <div
        className="relative bg-[var(--color-paper)] rounded-2xl p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45),_0_10px_30px_-10px_rgba(0,0,0,0.25)]"
        style={{
          border: "1px solid color-mix(in srgb, var(--color-ink) 12%, transparent)",
        }}
      >
        {/* Subtle flame corner tab — same accent the eyebrow uses, ties
            the QR card visually to the brand without bleeding into the
            QR pixels themselves. */}
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[var(--color-flame)]"
        />
        <img
          src={qrSrc}
          alt="QR code linking to the live Gohan AI demo"
          className="block w-full h-auto"
          loading="lazy"
        />
      </div>
      <p className="mt-4 text-sm text-[var(--color-mute)] leading-relaxed">
        Same demo, in your hand. Camera + voice prompts work natively
        from the browser.
      </p>
    </div>
  );
}
