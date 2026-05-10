# Gohan AI · Dashboard del gimnasio

Dashboard B2B Next.js 14 (App Router + TypeScript + Tailwind) que convierte los datos que captura Gohan AI en una herramienta accionable para el dueño/operación de cada cadena de gym (tenant).

> **Es complementario al repo principal** [`platanus-hack/platanus-hack-26-ar-team-16`](https://github.com/platanus-hack/platanus-hack-26-ar-team-16). Ese repo tiene la app mobile (Expo + Supabase + MCP) que usa el socio del gym; este dashboard es el producto que ven los **dueños del gym** (target B2B). Comparten la misma instancia de Supabase y el mismo modelo multi-tenant.

> Ver [INTEGRATION.md](./INTEGRATION.md) para el mapeo exacto de cada métrica del dashboard a las tablas reales (`profiles`, `routines`, `routine_exercises`, `messages`, etc.) que ya implementó DEV 3 + las tablas sugeridas para llenar gaps (`nps_responses`, `membership_plans`, `wearable_connections`, `member_inferences`).

## Por qué un dashboard web (no Expo)

El target del dashboard son los dueños/operación del gym, no los socios. Las decisiones que toman (campañas, retención, pricing, staffing) se piensan en una pantalla grande con muchos datos cruzados. Por eso el stack del dashboard es **Next.js (web)**, distinto del stack mobile del repo principal (Expo + React Native). Las dos apps comparten el backend Supabase, los tipos de [`lib/supabase-schema.ts`](./lib/supabase-schema.ts) y el mismo MCP server.

## Cómo correrlo

```bash
cd gohan-dashboard
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El dashboard redirige a `/operacion` automáticamente.

## Las 3 secciones

### 1. `/operacion` — Vista ejecutiva
KPIs del negocio en una mirada: miembros activos, MRR, churn, NPS, adherencia, % de wearables conectados, engagement con Gohan. Gráfica de evolución de MRR vs target, correlación churn-NPS, heatmap de ocupación por hora/día y distribución de personas. Cierra con un insight automático del agente.

### 2. `/miembros` — Vista 360 + customer personas
Las 6 personas que se desprenden de los datos de Gohan, con peso sobre la base, ARPU lift estimado y plays de retención. Tabla filtrable de miembros con persona asignada, plan, adherencia, engagement con el chat, NPS, score de churn y top oportunidad de upsell. Cada fila es navegable a una vista 360 (`/miembros/[id]`) que muestra las 3 capas de información completas: críticos, salud y antecedentes, wearable + lifestyle.

### 3. `/monetizacion` — Revenue incremental
MRR actual vs oportunidad calculada. Top oportunidades de producto ordenadas por revenue mensual esperado (volumen × confianza × ticket). Plays específicos por persona con catálogo de productos, conversión esperada y ARPU lift. Termina con la tesis de por qué los datos de Gohan son un moat.

## Modelo de datos (lib/types.ts)

Refleja las 3 capas que define el SKILL.md:

- **Capa 1 — Crítica**: Datos del onboarding inicial (objetivo, experiencia, días/semana, lesiones).
- **Capa 2 — Personalización**: Salud, antecedentes, hábitos de vida.
- **Capa 3 — Deep Knowledge**: Wearables (HRV, sueño, FC, VO2max), salud reproductiva, comportamiento real en la app (adherencia, edits de rutina, mensajes a Gohan, NPS continuo).

Sobre eso se computan dos cosas:
- **Risk score**: Probabilidad de churn 0-100 con razones específicas.
- **Opportunities**: Productos/servicios para upsell por miembro con confianza × ticket esperado.

## Las 6 customer personas (lib/personas.ts)

| Persona | % base | ARPU lift/mes | Play principal |
|---|---|---|---|
| El Recién Llegado | 24% | +$18 | Onboarding premium 90d con coach, antropometría inicial |
| El Hipertrofia-Driven | 22% | +$42 | Marketplace de suplementos + plan macros + asesoría |
| El Profesional Ocupado | 18% | +$65 | Plan anual Elite + recovery + sleep/mindfulness |
| La Mujer Saludable Integral | 16% | +$38 | Nutrición ciclo-sincronizada + bundle femme |
| El Senior Activo | 11% | +$28 | Convenio obras sociales + fisio + suplementación |
| El Atleta Amateur | 9% | +$78 | Tier Elite con coach humano + analítica avanzada |

## Mock data

`lib/mock-data.ts` genera ~120 miembros sintéticos con distribución realista por persona y los escala a una sucursal de 847 miembros activos para los agregados. Las cifras están alineadas con benchmarks de retail fitness LATAM (Smart Fit, Gold's, etc.).

En producción, este archivo se reemplaza por queries a la misma instancia de Supabase que usa la app mobile. Ver [INTEGRATION.md](./INTEGRATION.md) para el mapeo exacto: cada métrica está documentada con su query SQL contra las tablas reales (`profiles`, `routines`, `routine_exercises`, `conversations`, `messages`).

## Stack

- **Next.js 14** (App Router)
- **TypeScript** estricto
- **Tailwind CSS** con paleta brand custom (`brand`, `ink`)
- **Recharts** para gráficas
- **lucide-react** para íconos
- **clsx** para clases condicionales

## Estructura

```
gohan-dashboard/
├── app/
│   ├── layout.tsx           — Sidebar + header global
│   ├── page.tsx             — Redirect a /operacion
│   ├── operacion/page.tsx   — Sección 1
│   ├── miembros/
│   │   ├── page.tsx         — Sección 2 (lista + filtros)
│   │   └── [id]/page.tsx    — Vista 360 individual
│   └── monetizacion/page.tsx — Sección 3
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── KpiCard.tsx
├── lib/
│   ├── types.ts             — Modelo de datos del dashboard
│   ├── supabase-schema.ts   — Tipos espejo del schema real del repo principal
│   ├── personas.ts          — Las 6 personas
│   └── mock-data.ts         — Generador + agregados (mock hasta conectar Supabase)
├── INTEGRATION.md           — Mapeo de cada métrica a tablas reales del repo
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Próximos pasos sugeridos

1. **Migración 002_dashboard_b2b.sql** que agregue las tablas faltantes (`nps_responses`, `membership_plans`, `wearable_connections`, `member_inferences`). Ver tipos `_SUGGESTED` en [`lib/supabase-schema.ts`](./lib/supabase-schema.ts).
2. **Edge Function `infer-personas`** programada con cron, que toma los últimos N mensajes de cada usuario, los pasa por Claude API y guarda persona + churn risk + oportunidades en `member_inferences`. Reusa la `ANTHROPIC_API_KEY` que ya configuró DEV 4.
3. **Vista materializada `member_dashboard`** en Supabase con `REFRESH ... CONCURRENTLY` cada hora para alimentar las queries del dashboard sin pegar a las tablas crudas.
4. **Realtime** suscripción a `routine_exercises` filtrada por `tenant_id` para que las métricas de adherencia se actualicen en vivo.
5. **NPS por chat**: trigger en `messages` para que Gohan pregunte NPS en momentos clave (día 14, 60, después de un PR). Resultado va a `nps_responses`.
6. **Auth con Supabase**: NextAuth + Supabase provider para que el login del dashboard use el mismo backend. El `tenant_id` del owner determina qué ve.
7. **Layer de privacidad**: las inferencias médicas (medicación, condiciones crónicas inferidas del chat) no deberían exponerse al dueño del gym sin consentimiento explícito del miembro.
8. **Export a CSV/Slack** de cohortes accionables (ej. "Miembros con churn crítico para campaña winback de esta semana").
