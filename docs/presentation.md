# Demo presentation — 3 minutes hard-capped

Platanus Hack 26 · Track Vertical AI · team-16

This is the script + demo choreography for the live pitch. **Hard cap: 180 seconds.**
Three blocks: Problem (20s) → Solution (25s) → Live demo (130s) → optional close (5s).
One speaker recommended for cohesion; a second person can drive the laptop if you want.

---

## Block 1 — Problem · 20s

Open with the user behavior, not with us.

> _Hicimos research con socios de gimnasios — Megatlon, SmartFit, SportClub. Todos repiten el mismo patrón: abren la app del gym para ver su rutina, y cuando algo cambia — un dolor, un viaje, un día sin tiempo — abren ChatGPT para pedirle que les arme una rutina nueva._
>
> **_El problema no es que falte AI en fitness — el problema es que ninguna app de gym tiene un chat AI integrado, conectado a la rutina del usuario, capaz de modificarla en tiempo real._**

≈ 50 words. Speak it once before stage; if you go over 22 s, drop the third sentence.

---

## Block 2 — Solution / Ambition · 25s

Frame B2B from the first sentence so they don't think we're building yet another fitness consumer app.

> _Gohan AI no es otra app de fitness. Es la capa de inteligencia que se integra a la app que tu gym ya tiene._
>
> _Lo que aportamos:_
>
> - _Un módulo de chat que conoce al usuario, su rutina y su equipamiento_
> - _Un servidor MCP que cualquier app o agente puede consumir_
> - _Conexión directa al backend del gym, multi-tenant desde el día cero_
>
> **_Megatlon, SmartFit, cualquier cadena: misma intelligence, su marca, sus datos._**
>
> _Eso es lo nuevo. Ahora les muestro._

≈ 75 words. Tap each bullet on a deck slide if you have one; otherwise just narrate.

---

## Block 3 — Live demo · 130s

Pre-flight: demo user logged in, on the **Inicio** tab, **Megatlon** tenant. Routine seeded. See checklist below.

### Beat 1 — "this isn't our app" · 15 s

- Show the Megatlon home — `CANALES DE ATENCIÓN`, `NOVEDADES`, sedes.
- _"Esto es la app de Megatlon. Misma estética, mismas sedes, novedades. La diferencia es este botón."_
- **Tap** the `GOHAN` tab.

### Beat 2 — context · 10 s

- Greeting from Gohan with user-specific copy ("Hola Juan, veo tu rutina Push/Pull/Legs…").
- _"El chat conoce a Juan: su nivel, equipo, lesiones, rutina actual. Todo desde el backend del gym."_

### Beat 3 — first prompt, in person · 25 s

- Type or speak:
  > **"Mañana entreno en el gym de un amigo. Solo tiene mancuernas livianas y bandas elásticas. Acomodá la rutina del lunes."**
- While streaming, point at the orange chips: `replace_exercise · success`, `update_exercise · success`.
- _"Esto es Claude Sonnet 4.5 con tool_use — está modificando la rutina en Supabase mientras habla."_

### Beat 4 — realtime payoff · 15 s

- **Tap** the `RUTINAS` tab.
- The Lunes day already has the new exercises (búlgaras, hip thrust con mancuerna, banda).
- _"Lo que ven es realtime — Supabase emitió el cambio, la pantalla se actualizó sin refresh."_

### Beat 5 — voice prompt, lesión inesperada · 20 s

- Back to `GOHAN`, **press the mic**:
  > **"Hoy me molesta el hombro derecho, podés cambiarme algo del próximo Push?"**
- Live transcript visible.
- Streaming response replaces press militar with a shoulder-friendly alternative.
- _"Speech-to-text + el mismo pipeline. Sin formularios, sin selectores."_

### Beat 6 — the B2B differentiator: MCP · 25 s

- Switch to the `/mcp` page on the landing (or the `MÁS` tab if you'd rather stay in-app).
- _"Pero la app es solo una capa. Lo importante es esto: nueve herramientas vía Model Context Protocol. Cualquier agente AI del gym — el chatbot del personal trainer humano, la app de turnos, el sistema de check-in — puede leer y modificar la rutina del usuario con un solo import."_
- Briefly show the 9 tool cards.

### Beat 7 — multi-tenant flip · 15 s

- Switch to a second tab (pre-loaded SmartFit user).
- Same Inicio screen, **different brand**: orange SmartFit, distinct sedes, distinct novedades.
- _"Misma intelligence, otro tenant. Una infrastructura, infinitos gimnasios."_

### Beat 8 — close · 5 s

- Land on the landing hero (animated `Make your gym think.`).
- _"Make your gym think. Gohan AI."_

---

## Pre-flight checklist (5 minutes before stage)

1. **Demo user pre-loaded**: `demo@gohan.ai` already signed in, on `Inicio`, `megatlon` tenant.
2. **Routine reset**: re-run `scripts/seed-demo.sql` in the Supabase SQL editor.
3. **Second tab open** with a SmartFit user signed in for Beat 7.
4. **Internet check**: SSE streaming needs a stable connection. Tether to phone if conference Wi-Fi is sketchy.
5. **Backup screenshots** of every beat in a folder, just in case.
6. **Mic test** if Beat 5 will be voice.
7. **Pin laptop volume**: chat chips are small. Narrate them out loud — don't expect the jury to read them.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Chat hangs >10s | Have a short fallback prompt ready; quip and move on. |
| Voice doesn't transcribe | Skip Beat 5; reuse a typed prompt instead. |
| Realtime doesn't push | Tapping the Rutinas tab triggers a refetch — looks identical. |
| OAuth flow misfires mid-demo | Don't show Google login. Stay signed in or use email/password. |

## Don'ts

- Don't show the source code (except the one-import snippet on the deck or `/mcp` page).
- Don't talk about how we built it (Supabase, edge functions, etc.).
- Don't open with "Hola somos team-16, hicimos…" — go straight into the problem.
- Don't apologise for bugs if they happen — narrate over them.

## Demo URLs (in case you need to share live)

- Landing: <https://gohan-landing.vercel.app>
- App: <https://gohan-app-theta.vercel.app>
- MCP docs page: <https://gohan-landing.vercel.app/mcp>
- GitHub: <https://github.com/platanus-hack/platanus-hack-26-ar-team-16>
