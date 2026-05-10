# Gohan AI — Módulos Integrables

> **Owner sugerido:** @alexndr-n (DEV 2 — chat module + UI system)
> **Coordinación:** @DanteDia (backend / API), @Juampiman (edge function), @thblu (theming)
> **Timeline:** 12h disponibles para el hackathon
> **Status:** spec — pendiente review + arranque

---

## Por qué este documento existe

Hoy el "demo Megatlon" es una app que NOSOTROS armamos y skin-eamos como Megatlon. Eso vende el concepto, pero no es vendible a un gym real: ningún CTO va a reemplazar su app entera con la nuestra.

Lo que SÍ vamos a vender es **módulos integrables** que cualquier app de gym pueda meter en su producto existente con esfuerzo mínimo. Esa es la propuesta B2B real.

**Críticos del producto vendible:**
- El dev del gym integra en **menos de 10 minutos** (no en 2 semanas)
- Funciona en **cualquier stack** (no solo React)
- El gym **no comparte su data privada** con nosotros más de lo necesario
- Branding del gym, no nuestro
- Costo de integración bajo cero (no requiere construir backend)

---

## Los 3 patrones de integración (rankeados por facilidad)

### 🟢 Patrón 1 — Iframe Widget (el más fácil)

**Para quién:** cualquier gym con app web o app native con WebView. Casi todos.

**Cómo se ve para el dev:**
```html
<iframe
  src="https://chat.gohan.ai/embed?api_key=gym_megatlon_xxx&user_id=user_123"
  style="width:100%; height:600px; border:none;"
  allow="microphone"
></iframe>
```

**Eso es. Una línea.** El iframe corre nuestro chat module embebido, autenticado, themed con la paleta del gym (tomada de la API key).

**Tradeoffs:**
- ✅ Funciona en cualquier stack (web, mobile WebView, etc.)
- ✅ Updates automáticos (cambiamos el iframe content, todos los gyms reciben)
- ❌ Menos control de UX para el gym
- ❌ Cross-origin issues con audio/notifications en algunos navegadores
- ❌ Requiere whitelist de `frame-ancestors` para que el iframe se permita

### 🟡 Patrón 2 — SDK NPM (React / React Native)

**Para quién:** gyms que quieren UX más nativa y tienen frontend en React/RN.

**Cómo se ve para el dev:**
```bash
npm install @gohan-ai/chat-widget
```

```jsx
import { GohanChat } from '@gohan-ai/chat-widget';

export function CoachScreen() {
  return (
    <GohanChat
      apiKey="gym_megatlon_xxx"
      userId={currentUser.id}
      theme={{ primary: '#FF6B00' }}
      onRoutineChange={(routine) => {
        // gym puede reaccionar localmente al cambio
        myAppStore.setRoutine(routine);
      }}
    />
  );
}
```

**Tradeoffs:**
- ✅ Look & feel nativo, encaja en su app
- ✅ El gym puede reaccionar a eventos (`onRoutineChange`, etc.)
- ✅ Theming custom
- ❌ Solo React/RN — Flutter/Swift/Kotlin se quedan afuera
- ❌ Más mantenimiento (versiones, breaking changes, peer deps)

### 🔴 Patrón 3 — REST API directa

**Para quién:** gyms que quieren UI 100% propia y solo consumen la inteligencia de Gohan.

**Cómo se ve para el dev:**
```bash
curl -X POST https://api.gohan.ai/v1/chat \
  -H "Authorization: Bearer gym_megatlon_xxx" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_123","message":"cambiá los press de banca"}'
```

**Tradeoffs:**
- ✅ Máximo control para el gym
- ✅ Funciona en cualquier stack absolutamente
- ❌ Más esfuerzo de integración (el gym arma su propio UI)
- ❌ Sin streaming si usan REST simple (necesitarían SSE)

---

## Scope MVP para el hackathon (12h)

> **Recomendación:** atacar **Patrón 1 (iframe) + Patrón 2 (SDK npm)**. El iframe es el "anyone, 1 line" pitch; el SDK es para gyms serios con React stack. Patrón 3 (REST) lo dejamos documentado pero sin implementar — la edge function `ai-chat` ya es esencialmente eso.

### Pieza A — Embeddable Chat Web Build (`/embed`) — **5h**

Un build standalone del chat module + auth flow + theming, deployado a `chat.gohan.ai/embed?api_key=...&user_id=...`.

**Stack:**
- Vite + React + TypeScript (lite, no Expo) — un bundle web puro, sin dependencias mobile-only
- Reusa la lógica del chat module actual (`src/components/chat/`, `src/modules/chat/`) extrayendo la parte web-compatible
- Auth: la API key se valida server-side, devuelve un short-lived JWT que el chat usa para hablar con el edge function
- Theming: la API key mapea a un `tenant_id`; el iframe lee `primary_color` y aplica
- Manejo de mensajes: streaming SSE igual que la app actual

**Scope:**
1. `embed/` (carpeta nueva en raíz): proyecto Vite separado del Expo principal
2. `embed/src/App.tsx` con `<GohanChat />` autocontenido
3. Build a `embed/dist/` deployable a Vercel/Netlify
4. Deploy a `chat.gohan.ai` (subdominio, requiere DNS)

### Pieza B — NPM Package `@gohan-ai/chat-widget` — **4h**

Wrapper del mismo componente para que sea instalable como dep.

**Scope:**
1. `packages/chat-widget/` (nueva): TypeScript + tsup para build dual ESM+CJS
2. Componente `<GohanChat />` con props: `apiKey`, `userId`, `theme?`, `onRoutineChange?`, `onMessage?`
3. Build a `packages/chat-widget/dist/`
4. README con install + usage
5. Publish a npm como `@gohan-ai/chat-widget` (cuenta a crear; o publicar a un registry interno como GitHub Packages)

### Pieza C — Auth API Keys + Tenant Config — **2h**

Backend para que las API keys de gyms funcionen y mapeen a tenants.

**Scope (coordinar con @DanteDia):**
1. Migration: tabla `tenant_api_keys` con `id, tenant_id, key_hash, name, created_at, last_used_at, revoked_at`
2. Endpoint en edge function (o nuevo `auth-tenant` function): `POST /verify` recibe la key, devuelve `{ tenant_id, primary_color, logo_url, jwt_for_user_id }` (JWT short-lived para que el iframe llame al chat)
3. Helper script para generar keys (Dante puede correr al onboardear un gym)

### Pieza D — Demo Page para vender — **1h**

Una landing simple `https://gohan.ai/integrate` que muestra los 2 patrones con código copy-paste y un iframe live demo embebido. Esto es la "venta visual".

---

## Plan paso a paso (suggested order)

```
Hora  │ Quién                  │ Tarea
──────┼────────────────────────┼──────────────────────────────────────────
0–1h  │ Ale                    │ Setup repo nuevo embed/ con Vite+React
1–3h  │ Ale                    │ Extract chat module a embed/src/App.tsx
3–4h  │ Dante (paralelo)       │ Migration tenant_api_keys + endpoint verify
4–5h  │ Ale                    │ Wire auth (API key → JWT → chat works)
5–6h  │ Ale                    │ Build + deploy a Vercel/Netlify
6–8h  │ Ale                    │ Setup packages/chat-widget/ (npm package)
8–10h │ Ale                    │ Wrapper component + build dual + README
10h   │ Ale                    │ Publish a npm
10–11h│ Ale                    │ Demo page /integrate con iframe + snippets
11–12h│ All                    │ Test end-to-end + grabar demo
```

---

## Acceptance criteria (definition of done)

### Iframe widget
- [ ] `https://chat.gohan.ai/embed?api_key=demo_key_megatlon&user_id=<demo-uuid>` carga sin errores
- [ ] El chat se ve themed con `#FF6B00` (color de Megatlon, leído de tenant config)
- [ ] Mensajes hacen streaming token-by-token igual que la app principal
- [ ] tool_use modifica las rutinas igual que hoy (verificado contra DB live)
- [ ] El iframe es responsive (>=320px width)
- [ ] CSP / `frame-ancestors *` configurado en Vercel para que cualquier dominio lo pueda embeddear

### NPM package
- [ ] `npm install @gohan-ai/chat-widget` instala sin warnings
- [ ] Una app React vacía con `<GohanChat apiKey="..." userId="..." />` muestra el chat
- [ ] Funciona en React 18 y React 19 (peer deps definidos)
- [ ] README tiene snippet copy-paste, lista de props, ejemplo de theming
- [ ] Bundle size <100KB gzip

### Auth
- [ ] `POST /auth/verify` con API key válida devuelve `{ tenant_id, jwt }`
- [ ] API key inválida devuelve 401
- [ ] JWT expira en 1h
- [ ] Hay 1 demo key creada para Megatlon: `demo_megatlon_FB29AC...`

### Demo
- [ ] `gohan.ai/integrate` muestra los snippets de iframe y SDK
- [ ] El iframe live demo en la página funciona (chat real, modifica DB real del demo user)
- [ ] Se puede grabar un video screenshare de "abro el snippet → lo pego en CodeSandbox → funciona en 30s"

---

## Tradeoffs y decisiones pendientes (preguntar antes de codear)

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| **¿Subdominio `chat.gohan.ai`?** | Comprar dominio + DNS / usar `gohan-chat-embed.vercel.app` | Vercel free para hackathon, custom domain post-demo |
| **¿NPM package public o private?** | npm.com público / GitHub Packages | npm.com público — vende mejor, "look at our package" |
| **¿API keys en Supabase o en KV separado?** | Supabase tabla / Cloudflare KV / Upstash Redis | Supabase tabla — un sistema, RLS para protección |
| **¿JWT signing key?** | Compartido con Supabase Auth / nuestra clave separada | Nuestra clave separada para que el JWT no tenga acceso a nada que no sea el chat endpoint |
| **¿La rutina del user vive en NUESTRA DB o en la del gym?** | Nuestra DB con tenant_id (hoy) / DB del gym vía MCP del gym | **Hoy:** nuestra DB (lo que está construido). **V2:** el gym puede opcionalmente exponer su MCP para que escribamos en su DB. Documentar V2 como "advanced integration" pero no implementar |
| **¿El SDK soporta React Native además de React web?** | Solo web / dual con `react-native` peer dep | Solo web en V1. RN en V2 si hay demanda |

---

## Coordinación con el resto del equipo

**Antes de arrancar Ale tiene que coordinarse con:**

### @DanteDia (backend)
- **Necesito:** migration `tenant_api_keys` + endpoint `auth/verify` antes de hora 4
- **Coordinación:** Dante levanta la migration + endpoint, Ale consume
- Si no llega a tiempo: Ale puede mockear la verificación localmente (devolver `tenant_id` hardcodeado para `demo_megatlon` key) y switchear cuando esté el real

### @Juampiman (AI)
- **Necesito:** la edge function `ai-chat` ya acepta `userProfile` en el body. Verificar que el flow de iframe (sin sesión Supabase, autenticado vía JWT propio) puede llamar al edge function
- **Decisión:** ¿pasamos por la edge function como hoy o creamos un endpoint nuevo `chat-embed` que valida JWT custom?
- Recomendación: **reusar la edge function**, pasarle headers extra para el JWT

### @thblu (theming)
- **Necesito:** los tokens de tenant theme (que ya existen en `src/theme/tenants/`) deben ser compatibles con el bundle web standalone
- **Coordinación:** thblu confirma que los tokens son web-compatible (probablemente sí, son objetos JS)

### @DanteDia (DNS / deploy)
- Si vamos con `chat.gohan.ai`, necesita comprar `gohan.ai` y configurar DNS
- Alternativa hackathon: deploy a `gohan-chat-embed.vercel.app` sin custom domain

---

## Riesgos identificados

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| El chat module actual depende de Expo APIs (no funciona en bundle web puro) | Media | Inspeccionar `src/modules/chat/`, `src/components/chat/` y reemplazar APIs Expo-only por web equivalents (audio recorder, etc.) |
| Realtime de Supabase no funciona desde iframe sin auth Supabase | Alta | Pasar el JWT custom al cliente Supabase del iframe vía `setSession`, o eliminar dependency de realtime en el iframe (refetch periódico) |
| `frame-ancestors` no se configura bien y el iframe no funciona en Safari | Media | Test en Safari iOS desde el día 1, no dejar para el final |
| NPM publish se complica (cuenta, scope organizacional) | Baja | Crear `@gohan-ai` org en npm el día 1; si no se puede publicar, dejar el paquete compilado en GitHub Releases |
| Bundle size del chat module excede 100KB | Media | Audit deps, lazy-load el speech-recognition, compartir polyfills entre features |

---

## Para vender después de esto

Una vez construido, la story de venta es:

> "Tu app de gym + Gohan AI = 1 línea de iframe O 5 líneas de React. Tu users tienen un coach IA personalizado que conoce su rutina, sus lesiones, y modifica su plan en tiempo real cuando hablan. No necesitás backend, no necesitás re-entrenar nada, no necesitás dejar de usar tu UI. Empezás a venderlo como upsell esta semana."

Casos de uso reales para mostrar:
1. Cadena de gym con app web → embed iframe en su sección de "perfil del usuario"
2. Cadena con app React Native → npm SDK con `<GohanChat />` en una pantalla nueva
3. Gym chico con WordPress → iframe directo en una página dedicada

---

## Apéndice: por qué NO el MCP server (ahora)

El MCP server que tenemos en `mcp-server/` resuelve **otro caso de uso**: que el dev del gym opere las rutinas desde clientes MCP (Claude Desktop, Cursor, su propio agente IA). Es una herramienta de operación, no una herramienta de integración para end-users.

**Ese caso es válido y vendible**, pero como producto secundario "para gyms con team técnico avanzado". El primary product que estamos construyendo acá es el **chat module embeddable** porque eso es lo que cualquier gym puede integrar en horas, no en semanas.

El MCP server queda como pieza V2 / advanced integration. Lo documentamos en `mcp-server/README.md` y lo mostramos en la página `/integrate` como "advanced".
