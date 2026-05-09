# Gohan AI — Landing

Marketing site at https://gohan-landing.vercel.app. Next.js 15 App Router + Tailwind v4 + Geist/Instrument-Serif.

## Run locally

```bash
cd landing
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000.

`--legacy-peer-deps` is needed because Next.js 15 + React 19 + Tailwind v4 still have a couple of peer warnings on npm 10.

## Stack

- Next.js 15.5 (App Router, static export)
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Inter (body) + Instrument Serif (display) + Geist Mono (code)
- `@react-three/fiber`-free — all motion is plain CSS animations + Intersection Observer

## Deploy

Vercel auto-deploys on push to `main` if you wire up the GitHub integration.
Manual deploy:

```bash
cd landing
npx vercel --prod --yes --scope <your-team> --name gohan-landing
```

## Content map

| File | Section |
|---|---|
| `components/hero.tsx` + `hero-backdrop.tsx` | Hero with animated mesh gradient + cursor spotlight |
| `components/marquee.tsx` | Auto-scrolling row of gym chain logos (Megatlon, SmartFit, etc.) |
| `components/manifesto.tsx` | Editorial pain statement |
| `components/pillars.tsx` | Three pillars on dark bg with tilt-on-hover |
| `components/scroll-phone.tsx` | The signature feature — phone mock that grows to fill the viewport while you scroll, then becomes interactive (iframes the live app) |
| `components/how-it-works.tsx` | Connect / Configure / Coach |
| `components/for-developers.tsx` | Code snippet + MCP tool list |
| `components/outcomes.tsx` | Big numbers with count-up tickers |
| `components/cta.tsx` | Final flame-orange CTA |
| `components/footer.tsx` | Team links |

## Reusable interaction primitives

- `Reveal` — scroll-into-view fade + translate, used everywhere
- `LetterRise` — per-letter reveal animation on the headline
- `Magnetic` — buttons drift toward cursor on hover
- `Tilt` — 3D card tilt on cursor position
- `NumberTicker` — count-up animation for outcome stats
- `ScrollProgress` — flame bar at the top of the page

## Linked pieces

- The hero backdrop reads `/videos/hero-bg.mp4` (committed in `public/videos/`)
- The scroll-phone iframes `https://gohan-app-theta.vercel.app` — that deploy needs `frame-ancestors *` headers (which it has, see `scripts/deploy-app-web.sh`)
- Gym logos live in `public/logos/` — replace with proper licensed assets before any external promotion
