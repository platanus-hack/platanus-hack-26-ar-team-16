# GOHAN AI - Documento Fundacional

> **Status (2026-05-10):** This is the *founding* doc — the week-1 vision, scope, and team delegation. Sections 1–4 (Vision / Problema / Diferenciadores / Modelo de Negocio / Screens) are still current. Sections from "Estructura de Directorios" onward describe the *initial* MVP layout and team split; the codebase has since grown (extra tabs, a dashboard/, a landing/, an npm package, multiple edge functions, denormalized child tables, a wearables bridge). For the up-to-date architectural state — including data model, security model, build pipeline, and pending decisions — see **`docs/ARCHITECTURE.md`**, which is the single source of truth per `CLAUDE.md`. When the two documents disagree, ARCHITECTURE.md wins.

## Vision

Gohan AI es un sistema de **módulos integrables** que convierte cualquier app de gimnasio existente en un **personal trainer inteligente**. El usuario conversa con una IA especializada en fitness que genera y adapta rutinas personalizadas en tiempo real.

No es una app más de fitness. Es una capa de inteligencia que se integra en las apps que los gimnasios YA tienen, a través de un **MCP server**.

## Problema

Las apps de gimnasio actuales tienen rutinas estáticas, difíciles de editar, y cero personalización. Los usuarios terminan usando ChatGPT o Claude como personal trainer, pero esas herramientas no tienen una UI diseñada para rutinas. Gohan AI cierra esa brecha.

## Diferenciadores

| Feature | Apps de Gym actuales | ChatGPT/Claude | Gohan AI |
|---------|---------------------|----------------|----------|
| Rutinas personalizadas | Plantillas genéricas | Texto plano | UI dedicada + IA |
| Edición de rutinas | Compleja, rígida | Copy-paste manual | Conversacional en tiempo real |
| Adaptación a equipamiento | No | Si le decís | Automática por contexto |
| Adaptación a lesiones | No | Si le decís | Persistente en perfil |
| Integración con gym apps | N/A | No existe | MCP server plug & play |
| Experiencia mobile | Variable | Web genérica | Mobile-first dedicada |

## Modelo de Negocio

**B2B**: Vender módulos a cadenas de gimnasios existentes.
- El gimnasio integra Gohan AI en su app via MCP
- Multi-tenant: misma infraestructura, branding personalizado por gym
- Diseño agnóstico: funciona con cualquier app existente

---

## Screens

### 1. INICIO (Home)
- Saludo personalizado con nombre del usuario
- Próximo workout del día (card resumen)
- Botón rápido a Gohan AI coach
- Resumen semanal (días completados)
- INVERSIÓN DE TIEMPO: mínima (2 horas max)

### 2. RUTINA
- Botón de calendario arriba a la derecha (abre vista mensual)
- Fila de botones por cada día de la semana (Lun-Dom)
- Cada botón muestra qué grupo muscular trabaja ese día
- Al tocar un día → vista detallada con:
  - Lista de ejercicios del día
  - Peso, series, repeticiones por ejercicio
  - Posibilidad de marcar "completado"
  - Botón "¿Por qué este ejercicio?" → la IA explica
- La rutina se actualiza EN TIEMPO REAL cuando el usuario habla con la IA (Supabase realtime)

### 3. COACH / GOHAN AI
- Chat estilo Claude/ChatGPT
- Input: texto + audio (speech-to-text)
- Respuestas con streaming token-by-token
- El chat SOLO responde sobre fitness, rutinas, ejercicios, nutrición deportiva
- Temas fuera de scope → respuesta educada de redirección
- El onboarding del usuario ES la primera conversación con la IA:
  - "Contame sobre vos: experiencia, objetivos, días disponibles, lesiones, equipamiento"
  - De esa charla genera la primera rutina completa

---

## Tech Stack

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Mobile | **React Native + Expo** (prebuild) | Cross-platform, velocidad de desarrollo |
| Navigation | **Expo Router** | File-based routing |
| Styling | **NativeWind** (Tailwind CSS for RN) | Prototipado rápido |
| State | **Zustand** | Mínimo boilerplate |
| Backend | **Supabase** | Auth, PostgreSQL, Realtime, Edge Functions |
| AI | **Claude API** (@anthropic-ai/sdk) | Streaming, tool use, coaching |
| MCP | **Custom MCP Server** (TypeScript) | Integración con gym apps |
| Audio | **expo-speech** / **Web Speech API** | Speech-to-text para input de voz |

---

## Arquitectura

```
┌───────────────────────────────────────────────────────┐
│                    MOBILE APP (Expo)                   │
│                                                       │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  INICIO  │  │   RUTINA     │  │  COACH / AI    │  │
│  │  (Home)  │  │  (Calendar   │  │  (Chat +       │  │
│  │          │  │   + Detail)  │  │   Audio)       │  │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘  │
│       └───────────────┼──────────────────┘            │
│                       │                               │
│              ┌────────┴────────┐                      │
│              │  Zustand Store  │                      │
│              └────────┬────────┘                      │
│                       │                               │
└───────────────────────┼───────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │     SUPABASE       │
              │  - Auth            │
              │  - PostgreSQL      │
              │  - Realtime ←──────┼──── Routine updates push to app
              │  - Edge Functions  │
              │  - Storage (audio) │
              └─────────┬──────────┘
                        │
              ┌─────────┴──────────┐
              │   CLAUDE API       │
              │  - Streaming chat  │
              │  - Tool use        │
              │  (update routines) │
              └────────────────────┘

              ┌────────────────────┐
              │   MCP SERVER       │
              │  (Separate pkg)    │
              │  - get_routine     │    ← Gym apps connect here
              │  - update_exercise │
              │  - add_exercise    │
              │  - get_profile     │
              └────────────────────┘
```

### Flujo clave: Chat → Rutina en tiempo real

1. Usuario habla con Gohan AI en el chat
2. Claude API recibe el mensaje + contexto del usuario
3. Claude usa **tool_use** para llamar funciones que modifican la rutina en Supabase
4. Supabase emite el cambio via **Realtime subscription**
5. La pantalla de Rutina se actualiza automáticamente sin refresh

---

## Estructura de Directorios

```
platanus-hack-26-ar-team-16/
│
├── app/                              # Expo Router
│   ├── (auth)/
│   │   └── login.tsx                 # [DEV 2] Login screen
│   ├── (tabs)/
│   │   ├── _layout.tsx               # [DEV 2] Tab bar (Inicio, Rutina, Coach)
│   │   ├── index.tsx                 # [DEV 2] INICIO - Home dashboard
│   │   ├── routine.tsx               # [DEV 1] RUTINA - Calendar + day selector
│   │   └── coach.tsx                 # [DEV 2] COACH - AI chat screen
│   ├── routine/
│   │   └── [day].tsx                 # [DEV 1] Day detail view
│   └── _layout.tsx                   # [DEV 2] Root layout
│
├── src/
│   ├── components/
│   │   ├── ui/                       # [DEV 2] Primitives (Button, Card, Input)
│   │   ├── routine/                  # [DEV 1] DaySelector, ExerciseCard, WeekView
│   │   └── chat/                     # [DEV 2] ChatBubble, MessageInput, AudioButton
│   │
│   ├── modules/
│   │   ├── routine/                  # [DEV 1] Routine display logic
│   │   │   ├── RoutineManager.ts     # Transform routine data for UI
│   │   │   └── types.ts
│   │   ├── chat/                     # [DEV 2] Chat state/logic
│   │   │   ├── ChatManager.ts        # Message handling, audio recording
│   │   │   └── types.ts
│   │   └── ai/                       # [DEV 4] AI engine
│   │       ├── CoachEngine.ts        # Claude API integration
│   │       ├── prompts.ts            # System prompts + tool definitions
│   │       ├── tools.ts              # Tool implementations (update routine, etc.)
│   │       └── types.ts
│   │
│   ├── services/                     # [DEV 3] Backend services
│   │   ├── supabase.ts               # Client config
│   │   ├── auth.ts                   # Auth service
│   │   ├── routines.ts               # Routine CRUD + realtime subscription
│   │   ├── conversations.ts          # Chat history CRUD
│   │   ├── profiles.ts               # User profile service
│   │   └── tenant.ts                 # Multi-tenant config
│   │
│   ├── store/                        # [DEV 2] Zustand stores
│   │   ├── useAuthStore.ts
│   │   ├── useRoutineStore.ts
│   │   ├── useChatStore.ts
│   │   └── useTenantStore.ts
│   │
│   ├── theme/                        # [DEV 2] Design tokens
│   │   ├── colors.ts
│   │   └── typography.ts
│   │
│   ├── hooks/                        # Shared hooks
│   │   ├── useRealtimeRoutine.ts     # [DEV 3] Supabase realtime hook
│   │   └── useAudioRecorder.ts       # [DEV 2] Audio recording hook
│   │
│   └── types/                        # [ALL] Shared type contracts
│       ├── routine.ts
│       ├── chat.ts
│       ├── user.ts
│       ├── tenant.ts
│       └── index.ts
│
├── mcp-server/                       # [DEV 4] MCP Server (separate pkg)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  # MCP server entry
│   │   ├── tools.ts                  # Tool definitions
│   │   └── supabase.ts              # DB client for MCP
│   └── README.md
│
├── supabase/                         # [DEV 3] Supabase config
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── ai-chat/                  # Edge function for Claude API (keeps key server-side)
│           └── index.ts
│
├── FOUNDATION.md
├── CLAUDE.md
├── README.md
├── platanus-hack-project.json
├── project-logo.png
├── .gitignore
├── app.json
├── package.json
└── tsconfig.json
```

---

## Delegación de Tareas

### DEV 1 — Tomas Calligaris (@thblu) — Routine Module

**Scope**: Todo lo que es la pantalla de RUTINA y sus componentes.

**Archivos**: `app/(tabs)/routine.tsx`, `app/routine/[day].tsx`, `src/components/routine/`, `src/modules/routine/`

**NO toca**: `src/components/chat/`, `src/modules/ai/`, `src/services/`, `supabase/`, `mcp-server/`

**Tareas**:
1. `WeekDaySelector` - Fila de botones Lun-Dom con grupo muscular
2. `ExerciseCard` - Card de ejercicio con peso, series, reps, checkbox completado
3. `RoutineView` - Vista del día seleccionado con lista de ejercicios
4. `CalendarModal` - Modal con calendario mensual (botón arriba derecha)
5. `routine.tsx` - Pantalla principal de rutina con day selector + exercise list
6. `[day].tsx` - Vista detallada del día con opción de logging
7. Botón "¿Por qué este ejercicio?" en cada ExerciseCard
8. Suscribirse a Zustand store para recibir updates en tiempo real
9. Animaciones de transición entre días (Reanimated si hay tiempo)

**Entregables críticos (primeras 8 horas)**:
- [ ] WeekDaySelector funcionando con mock data
- [ ] ExerciseCard con peso/series/reps
- [ ] Vista de día completa renderizando ejercicios
- [ ] Navegación entre días fluida

**Consume de DEV 3**: `useRealtimeRoutine` hook, routine service
**Consume de DEV 4**: Respuesta de "¿Por qué este ejercicio?"

---

### DEV 2 — Alejandro Nieto (@alexndr-n) — Chat Module + Home + UI System

**Scope**: Chat de IA, pantalla Home, design system, navegación, stores.

**Archivos**: `app/`, `src/components/ui/`, `src/components/chat/`, `src/modules/chat/`, `src/store/`, `src/theme/`, `src/hooks/useAudioRecorder.ts`

**NO toca**: `src/components/routine/`, `src/modules/ai/`, `src/services/`, `supabase/`, `mcp-server/`

**Tareas**:
1. Setup Expo project + Expo Router + NativeWind
2. Design system: colores, tipografía, componentes base (Button, Card, Input, Badge)
3. Tab navigation layout (Inicio, Rutina, Coach)
4. `index.tsx` - Home screen (saludo, próximo workout, botón rápido a coach)
5. `coach.tsx` - Chat screen completa:
   - Lista de mensajes con scroll
   - ChatBubble (user vs AI, con streaming visual)
   - MessageInput (texto + botón audio)
   - Indicador de "escribiendo..." durante streaming
6. `AudioButton` + `useAudioRecorder` hook para speech-to-text
7. Zustand stores (auth, routine, chat, tenant)
8. Login screen (UI, conecta con auth service de DEV 3)
9. Theming multi-tenant (colores y logo configurables por tenant)

**Entregables críticos (primeras 8 horas)**:
- [ ] Expo project corriendo con tab navigation
- [ ] Design system + componentes base
- [ ] Chat screen con mensajes mock y input funcional
- [ ] Home screen básica

**Consume de DEV 3**: Auth service, chat history service
**Consume de DEV 4**: Streaming de respuestas de Claude API

---

### DEV 3 — Dante Arola (@DanteDia) — Backend & Infrastructure

**Scope**: Supabase, auth, data models, realtime, multi-tenant, edge functions.

**Archivos**: `src/services/`, `src/hooks/useRealtimeRoutine.ts`, `supabase/`, `src/types/`

**NO toca**: `app/`, `src/components/`, `src/modules/ai/`, `mcp-server/`

**Tareas**:
1. Setup Supabase project (auth, db, storage, realtime)
2. Schema de base de datos:
   ```sql
   -- tenants (gym chains)
   tenants: id, name, slug, logo_url, primary_color, secondary_color, created_at

   -- profiles (extends supabase auth)
   profiles: id, tenant_id (FK), display_name, avatar_url,
             fitness_level, equipment_available, injuries,
             training_days_per_week, goals, onboarding_completed,
             created_at

   -- routines
   routines: id, user_id (FK), name, is_active, created_at, updated_at

   -- routine_days
   routine_days: id, routine_id (FK), day_of_week (0-6),
                 muscle_groups[], label, created_at

   -- routine_exercises
   routine_exercises: id, routine_day_id (FK), exercise_name,
                      sets, reps, weight_kg, rest_seconds,
                      order_index, notes, ai_reasoning,
                      completed, created_at

   -- conversations
   conversations: id, user_id (FK), created_at

   -- messages
   messages: id, conversation_id (FK), role ('user'|'assistant'),
             content, audio_url, created_at
   ```
3. Row Level Security (RLS) en todas las tablas
4. Auth flow (email/password + Google OAuth)
5. Routine CRUD service (`src/services/routines.ts`)
6. Conversation/message CRUD service (`src/services/conversations.ts`)
7. `useRealtimeRoutine` hook - Supabase realtime subscription que actualiza la rutina cuando la IA la modifica
8. Edge function `ai-chat` - Proxy para Claude API (mantiene API key server-side)
9. Multi-tenant: tenant config por slug, RLS filtrado por tenant_id
10. Storage bucket para audio files

**Entregables críticos (primeras 8 horas)**:
- [ ] Supabase project con schema completo
- [ ] Auth funcionando (register/login)
- [ ] Routine CRUD operativo
- [ ] Realtime subscription emitiendo cambios

**Provee a DEV 1**: `useRealtimeRoutine`, routine service
**Provee a DEV 2**: Auth service, conversation service
**Provee a DEV 4**: DB access para tools de Claude

---

### DEV 4 — Juampiman (@Juampiman) — AI Engine & MCP Server

**Scope**: Claude API, prompts, tool use, MCP server.

**Archivos**: `src/modules/ai/`, `mcp-server/`

**NO toca**: `app/`, `src/components/`, `src/services/`, `supabase/migrations/`

**Tareas**:
1. `CoachEngine.ts` - Integración con Claude API:
   - Streaming de respuestas
   - System prompt de personal trainer experto
   - Contexto del usuario (perfil, rutina actual, historial de chat)
   - Guardrail: solo responde sobre fitness/entrenamiento/nutrición deportiva
2. `prompts.ts` - System prompts optimizados:
   - Prompt base de coach (personalidad, expertise, limitaciones de tema)
   - Prompt de onboarding (primera conversación)
   - Prompt de explicación de ejercicio ("¿por qué este ejercicio para MÍ?")
3. `tools.ts` - Tool definitions para Claude tool_use:
   - `create_routine` - Crear rutina completa
   - `update_exercise` - Modificar ejercicio específico
   - `replace_exercise` - Reemplazar ejercicio por alternativa
   - `add_exercise` - Agregar ejercicio a un día
   - `remove_exercise` - Quitar ejercicio
   - `update_day` - Cambiar grupo muscular de un día
   - `explain_exercise` - Explicar por qué se eligió un ejercicio
4. Tool implementations que escriben directo a Supabase
5. MCP Server (`mcp-server/`):
   - Herramientas expuestas: `get_user_routine`, `update_exercise`, `add_exercise`, `get_user_profile`, `list_exercises_for_day`
   - Autenticación por API key del gym
   - README con docs de integración
6. Guardrail de temas: si el usuario pregunta algo no-fitness, responder con redirección educada

**Entregables críticos (primeras 8 horas)**:
- [ ] Claude API conectada con streaming funcionando
- [ ] System prompt de coach definido y testeado
- [ ] Al menos 3 tools funcionando (create_routine, update_exercise, replace_exercise)
- [ ] MCP server básico con 2 herramientas expuestas

**Consume de DEV 3**: Supabase client, schema de rutinas
**Provee a DEV 1**: Explicación de ejercicios via tool
**Provee a DEV 2**: Stream de respuestas de IA

---

## Contratos de Integración

```
DEV 2 (Chat UI)  ──→  user message  ──→  DEV 4 (AI Engine)
                                              │
                                        Claude API + Tools
                                              │
                                        Writes to Supabase
                                              │
                                    DEV 3 (Realtime) ←────┘
                                              │
                                    Emits realtime event
                                              │
                                    DEV 1 (Routine UI) ←──┘
                                              │
                      ┌───────────────────────┘
                      │
               MCP Server (DEV 4)
                      │
               External Gym Apps
```

**Regla de oro**: Cada dev trabaja con MOCK DATA de los otros hasta la integración.

---

## Protocolo Anti-Conflicto de Merge

### Base común (YA HECHO en main)
El scaffolding completo ya está en `main`:
- Expo project inicializado con TODAS las dependencias
- Layouts y pantallas con placeholders
- Stores, services, hooks con firmas definidas
- Types/contratos compartidos
- Config files cerrados (tsconfig, tailwind, app.json, metro.config)
- MCP server scaffold
- Migración SQL base

### Reglas para cada dev desde su branch

1. **SOLO reemplazá placeholders y creá archivos NUEVOS** en tus carpetas exclusivas
2. **NUNCA modifiques**: `package.json`, `app.json`, `tsconfig.json`, `tailwind.config.js`, `metro.config.js`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
3. **Si necesitás un paquete nuevo**: pedilo en el grupo, se instala en `main`, todos hacen pull
4. **Si necesitás modificar un tipo en `src/types/`**: proponelo en el grupo, DEV 3 lo cambia en `main`, todos hacen pull
5. **Antes de mergear**: SIEMPRE hacer `git pull origin main --rebase` primero

### Orden de trabajo

```
main (scaffolding completo) ← ya está
  ├── TODOS: git checkout -b {tu-branch}
  ├── TODOS: trabajan en sus carpetas exclusivas
  ├── TODOS: crean archivos NUEVOS, reemplazan placeholders
  └── Merge: cuando una feature está lista, PR o merge a main
```

---

## Timeline (~30 horas restantes)

### Fase 1: Arranque Inmediato (Horas 0-3)
- TODOS: Clonar repo, `npm install`, verificar que la app corre
- DEV 1: Reemplazar placeholder de routine.tsx, crear componentes
- DEV 2: Reemplazar placeholders de index.tsx y coach.tsx, crear componentes UI
- DEV 3: Crear proyecto Supabase, aplicar migración SQL, implementar services
- DEV 4: Implementar CoachEngine con Claude API, crear primer tool

### Fase 2: Core (Horas 3-14)
- DEV 1: Rutina completa (calendar, day view, exercise cards)
- DEV 2: Chat screen completa con streaming visual + Home
- DEV 3: CRUD completo + realtime + edge function
- DEV 4: Todos los tools + MCP server básico

### Fase 3: Integration (Horas 14-22)
- DEV 2 + DEV 4: Conectar chat con Claude API streaming
- DEV 1 + DEV 3: Conectar rutina con realtime subscription
- DEV 4 + DEV 3: Tools escribiendo a Supabase real
- TODOS: Flow end-to-end funcionando

### Fase 4: Polish & Demo (Horas 22-30)
- DEV 1: Animaciones, estados vacíos, polish
- DEV 2: Loading states, empty states, theming multi-tenant
- DEV 3: Edge cases, RLS final, data flow sólido
- DEV 4: Refinar prompts, mejorar MCP docs
- TODOS: Preparar demo, testing final

---

## Variables de Entorno

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Claude API (solo en edge function, NUNCA en el client)
ANTHROPIC_API_KEY=

# App
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DEFAULT_TENANT=default
```

---

## Git Workflow

- **Branch por dev**: `thblu/routine`, `alexndr-n/chat`, `DanteDia/backend`, `Juampiman/ai`
- **Merge a `main`** via PR o merge directo cuando la feature está estable
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`
- **NO force push** a main
- **Pull antes de push** siempre

```bash
# Crear tu branch
git checkout -b thblu/routine  # (cambiar según tu nombre)
git push -u origin thblu/routine

# Workflow
git add .
git commit -m "feat: add week day selector component"
git pull origin main --rebase
git push
```

---

## Criterios de Evaluación → Estrategia

| Criterio | Peso | Estrategia |
|----------|------|------------|
| **Originalidad** (15%) | MCP server para gym apps + coaching IA especializado + rutinas en tiempo real |
| **Ambición** (20%) | Multi-tenant B2B + MCP integration + streaming AI + realtime sync |
| **Ejecución** (20%) | MVP funcional: chatear → rutina se arma sola → se puede usar en el gym |
| **Aspecto Técnico** (25%) | Claude API streaming + tool_use, Supabase realtime, MCP server, multi-tenant |
| **Impacto** (20%) | Resuelve un problema real de personalización en gym apps existentes, modelo B2B escalable |

---

## Demo Script (3 minutos)

> 1. "Juan se anota en SmartFit y abre la app. Gohan AI lo saluda y le pregunta sobre él."
> 2. "Juan le cuenta: entrena 4 días, tiene molestia en hombro derecho, solo mancuernas en casa los fines de semana."
> 3. [MOSTRAR] La rutina se construye EN VIVO en la pestaña Rutina mientras habla.
> 4. "La semana siguiente, Juan le dice que el peso muerto le molestó. Gohan lo cambia por hip thrust y le explica POR QUÉ."
> 5. [MOSTRAR] MCP server: otra app del gym consulta y modifica la rutina de Juan.
> 6. [MOSTRAR] Multi-tenant: misma app, branding de dos gyms distintos.
