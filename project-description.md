# Gohan AI

**Módulos de personal trainer IA para apps de gimnasios existentes.**

Track: 🗼 Vertical AI · Buenos Aires · team-16

---

## El problema

Hicimos research con socios de gimnasios — Megatlon, SmartFit, SportClub. Todos repiten el mismo patrón: los miembros abren la app del gym para ver su rutina, y cuando algo cambia (un dolor, un viaje, un día sin tiempo) abren ChatGPT para pedirle que les arme una rutina nueva.

El problema no es que falte AI en fitness — el problema es que **ninguna app de gym tiene un chat AI integrado, conectado a la rutina del usuario, capaz de modificarla en tiempo real**.

## La solución

Gohan AI no es otra app de fitness. Es la capa de inteligencia que se integra a la app que tu gym ya tiene:

- **Módulo de chat** que conoce al usuario, su rutina, su equipamiento y sus lesiones.
- **Servidor MCP** que cualquier app o agente puede consumir.
- **Multi-tenant desde el día cero**: misma intelligence, la marca de cada gym, sus datos.

> Megatlon, SmartFit, cualquier cadena: misma intelligence, su marca, sus datos.

## Demo en vivo

- **Landing:** https://gohan-landing.vercel.app
- **App:** https://gohan-app-theta.vercel.app
- **MCP docs:** https://gohan-landing.vercel.app/mcp

En el landing, scrolleá hasta "Try it" — el iPhone embebido carga la app real con el usuario demo ya logueado. Hablale al coach, pedile que ajuste la rutina, mirá cómo se actualiza en tiempo real. Camera + voice prompts funcionan nativamente.

**Cuenta demo (auto-login en el iframe):** `demo@gohan.ai`

## Arquitectura

Tres caminos de integración para los gyms partners:

1. **Módulo embed** — React component que el gym dropea en su app. Auth via Gohan session JWT (intercambiado por la edge function `api-session`).
2. **MCP server** — HTTP transport en `POST /mcp`, autenticado con `Authorization: Bearer gk_live_*`. Ideal para agentes backend del gym.
3. **Claude Desktop** (dev) — modo `--stdio`, sin auth, para prototipado.

Los 3 caminos comparten la misma API de **9 tools**: `get_user_routine`, `list_exercises_for_day`, `update_exercise`, `add_exercise`, `remove_exercise`, `replace_exercise`, `get_user_profile`, `get_tenant_info`, `list_tenant_users`.

**Tenant scoping automático**: cada API key resuelve a un `tenant_id` que se aplica a toda query de Postgres. Imposible que un gym lea datos de otro.

## Stack

- **Frontend app**: React Native + Expo Router + NativeWind v4 (web + iOS + Android del mismo código)
- **Landing**: Next.js 15 + Tailwind v4
- **Backend**: Supabase (Postgres + Auth + Realtime + Edge Functions en Deno)
- **AI**: Claude Sonnet 4 con tool_use streaming
- **MCP**: Custom Node server con `@modelcontextprotocol/sdk`, transporte HTTP

## Patterns clave

- **Realtime via Supabase**: Claude llama a las tools, escribe en Postgres, las pantallas del usuario se actualizan al instante sin refresh manual.
- **JSONL UI rendering**: el AI puede emitir operaciones RFC-6902 inline para construir cards/lists/badges en la respuesta del chat, no solo texto.
- **Coach personalities**: el usuario elige entre `amable`, `picante`, `intenso` — el system prompt del modelo cambia el tono del coach.
- **Multi-tenant branding**: colores y logos del gym se cargan desde la tabla `tenants` y se aplican a la app vía theme provider.

## Equipo

- **Dante Arola** ([@DanteDia](https://github.com/DanteDia)) — backend (Supabase, edge functions, MCP infra, landing)
- **Tomás Calligaris** ([@thblu](https://github.com/thblu)) — rutinas (UI + lógica)
- **Juan Pablo Mantegazza** ([@Juampiman](https://github.com/Juampiman)) — AI (system prompts, tool use, MCP server)
- **Alejandro Nieto** ([@alexndr-n](https://github.com/alexndr-n)) — chat module + UI shell + theme

## Repo

https://github.com/platanus-hack/platanus-hack-26-ar-team-16

> Make your gym think.
