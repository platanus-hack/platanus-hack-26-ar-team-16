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
  // Cap the phone scale so the iPhone always fits in the viewport with
  // generous margins for the nav (top) and tab bar inside the iframe (bottom).
  // Without this, on shorter desktop viewports the 844px-tall phone clips
  // under the nav and below the fold, eating the bottom buttons of the app.
  const [maxScale, setMaxScale] = useState(1);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const compute = () => {
      if (isMobile) {
        setMaxScale(1);
        return;
      }
      const navHeight = 56; // h-14 fixed nav
      // ~80px above and below the phone so the iframe's header (Megatlon
      // brand bar, bell, search) and bottom tab bar are clearly visible
      // and clickable, not eaten by the page chrome.
      const breathingRoom = 160;
      const fit = (window.innerHeight - navHeight - breathingRoom) / IPHONE_H;
      setMaxScale(Math.min(1, Math.max(0.6, fit)));
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

  // Map progress 0..1 into a phone scale 0.7 .. maxScale and a corner radius
  // 2.75rem .. 0.4rem (some rounding stays even at full-bleed for charm).
  // Starts larger so the phone feels present from the moment the section enters.
  const expansion = Math.min(1, Math.max(0, (progress - 0.05) / 0.7));
  const scale = 0.7 + expansion * (maxScale - 0.7);
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
          className={`sticky top-0 h-screen md:pt-14 flex items-center justify-center overflow-hidden ${
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
      <p className="mt-3 text-[12px] text-[var(--color-mute)] leading-relaxed">
        Same demo, in your hand. Camera + voice prompts work natively
        from the browser.
      </p>
    </div>
  );
}
