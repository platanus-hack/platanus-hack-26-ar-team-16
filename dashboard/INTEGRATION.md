# Integración con Gohan AI (repo real)

Este dashboard B2B está pensado como **una segunda app web** que se conecta a la misma instancia de Supabase que la app mobile de Gohan AI ([platanus-hack/platanus-hack-26-ar-team-16](https://github.com/platanus-hack/platanus-hack-26-ar-team-16)). No reemplaza nada del repo: lo complementa.

## Arquitectura propuesta

```
┌─────────────────────────────────────────────────────┐
│   APP MOBILE (Expo) — el repo real                  │
│   Inicio · Rutina · Coach (Gohan AI chat)           │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────┴─────────┐
              │     SUPABASE      │
              │   (multi-tenant)  │
              └────────┬─────────┘
                       │
       ┌───────────────┴────────────────┐
       │                                │
┌──────┴──────────┐          ┌──────────┴──────────┐
│   MCP SERVER    │          │  DASHBOARD B2B      │
│  (gym apps)     │          │  (este proyecto)    │
│                 │          │                     │
│ get_user_*      │          │ Operación           │
│ update_exercise │          │ Miembros (360)      │
│ add_exercise    │          │ Monetización        │
└─────────────────┘          └─────────────────────┘
                                       ▲
                              dueños / operación
                              de cada cadena de gym
```

El dashboard escucha la misma instancia de Supabase, filtra por `tenant_id` (cada gym chain ve solo lo suyo) y compone vistas agregadas.

## Mapeo de cada métrica del dashboard a tablas reales

### Sección 1 — Operación

| Métrica del dashboard | Cómo se computa |
|---|---|
| **Miembros activos** | `SELECT COUNT(*) FROM profiles WHERE tenant_id = $1 AND onboarding_completed = true` |
| **MRR** | `SELECT SUM(monthly_fee_usd) FROM membership_plans WHERE tenant_id = $1 AND cancelled_at IS NULL` ⚠️ Esta tabla no existe aún — sugerida |
| **Adherencia promedio** | `SELECT AVG(completed::int) FROM routine_exercises re JOIN routine_days rd ON ... WHERE re.created_at > NOW() - INTERVAL '30 days'` — la columna `completed` es la fuente de verdad |
| **Wearable conectado %** | Sugerencia: agregar tabla `wearable_connections` y conectar Terra API o OpenWearables |
| **Engagement con Gohan** | `SELECT COUNT(*) FROM messages m JOIN conversations c ON ... WHERE m.role = 'user' AND m.created_at > NOW() - 30 days` |
| **NPS** | Sugerencia: tabla `nps_responses`. El agente puede preguntar en chat al detectar momentos clave (ej. después de 30 días, después de un PR) |
| **Churn** | Calculado a partir de profiles cancelados / total. En MVP se puede inferir de "última sesión hace >21 días" |
| **Heatmap de ocupación** | Cuando se agregue check-in real, viene de una tabla `gym_visits`. Mientras tanto, se puede inferir de `routine_exercises.completed` agrupado por hora |
| **Distribución de personas** | Computada offline por un job que corre Claude API sobre `messages.content` y clasifica al usuario |

### Sección 2 — Miembros (vista 360)

Cada fila de la tabla viene de `MemberAggregate` ([lib/supabase-schema.ts](lib/supabase-schema.ts)):

```sql
-- Vista materializada sugerida
CREATE MATERIALIZED VIEW member_dashboard AS
SELECT
  p.*,
  t.name AS tenant_name,
  (SELECT COUNT(*) FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.user_id = p.id AND m.role = 'user'
    AND m.created_at > NOW() - INTERVAL '30 days') AS chat_messages_30d,
  (SELECT AVG(re.completed::int) * 100 FROM routine_exercises re
    JOIN routine_days rd ON rd.id = re.routine_day_id
    JOIN routines r ON r.id = rd.routine_id
    WHERE r.user_id = p.id
    AND re.created_at > NOW() - INTERVAL '30 days') AS adherence_30d_pct,
  -- + más agregados
FROM profiles p
JOIN tenants t ON t.id = p.tenant_id;

-- Refresh cada hora
REFRESH MATERIALIZED VIEW CONCURRENTLY member_dashboard;
```

La vista 360 individual (`/miembros/[id]`) es un join sobre todas las tablas, además de las inferencias del agente.

### Sección 3 — Monetización

Las oportunidades por miembro vienen de un job batch que:

1. Lee los últimos N mensajes de `messages` para cada usuario.
2. Le pasa a Claude API el contexto + perfil + adherencia.
3. Claude clasifica al usuario en una de las 6 personas y genera oportunidades.
4. Resultado se guarda en `member_inferences` (sugerida) con TTL.

Esto se puede correr como una **Edge Function de Supabase** programada con cron, reusando la `ANTHROPIC_API_KEY` que el equipo ya configuró para el chat.

## Tablas que faltan (sugeridas para el dashboard B2B)

Tipos en [lib/supabase-schema.ts](lib/supabase-schema.ts) marcados con `_SUGGESTED`:

1. `nps_responses` — para que Gohan pregunte NPS en chat y se almacene.
2. `membership_plans` — plan + monthly_fee_usd + payment_method por miembro.
3. `wearable_connections` + `wearable_metrics` — integración Terra/OpenWearables.
4. `gym_visits` — check-in físico (puede venir del torno).
5. `member_inferences` — cache de las inferencias de Claude (persona, churn risk, oportunidades).

Estas se proponen como migración separada `002_dashboard_b2b.sql` para no chocar con la 001 que ya hizo DEV 3.

## Flow de datos en vivo

Como ya hay Supabase Realtime configurado para que la rutina se actualice en la app mobile cuando Gohan modifica algo, el mismo canal se puede usar en el dashboard:

```ts
// En el dashboard B2B
const channel = supabase
  .channel("dashboard-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "routine_exercises", filter: `tenant_id=eq.${tenantId}` },
    () => refreshAggregates()
  )
  .subscribe();
```

## Multi-tenancy

Cada `Tenant` (gym chain) tiene su propio dashboard. RLS de Supabase ya filtra por `tenant_id` (DEV 3 lo dejó listo). El dashboard:

- Login del dueño del gym → resuelve su `tenant_id`
- Todas las queries pasan por RLS automáticamente
- Header del dashboard muestra el nombre + logo del tenant
- En el futuro: vista de "owner de cadena" que ve N sucursales agregadas

## Cómo conectarlo (cuando el dashboard se vuelva production)

1. `npm install @supabase/supabase-js`
2. Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. En `lib/mock-data.ts`, reemplazar las funciones que retornan `MEMBERS` por queries reales:

```ts
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, anonKey);

export async function getMembers(tenantId: string): Promise<Member[]> {
  const { data } = await supabase
    .from("member_dashboard") // la vista materializada
    .select("*")
    .eq("tenant_id", tenantId);
  return data ?? [];
}
```

4. Agregar Server Actions / Route Handlers de Next.js para queries que requieren auth.
5. NextAuth con Supabase como provider para que el login del dashboard use el mismo backend.

## Por qué el dashboard B2B vale la pena

El equipo ya tiene la app mobile lista. Lo que NO tienen es **producto para el cliente que paga** (la cadena de gym). Sin un dashboard, la propuesta B2B es solo "instalá nuestro MCP". Con dashboard, la propuesta es:

> "Te integramos Gohan AI en tu app, y como bonus te damos un dashboard de operaciones, retención y monetización que ningún otro provider te da."

Eso convierte a Gohan AI en una **plataforma**, no un módulo. Es la diferencia entre cobrar $X por usuario activo vs. cobrar $X + $Y por features de business intelligence.
