# Gohan AI - AI Personal Trainer Modules

## Project

AI-powered personal trainer modules for existing gym apps. Chat with AI coach → personalized routines generated and updated in real-time. B2B multi-tenant, integrable via MCP server.

## Stack

- React Native + Expo (prebuild, NOT Expo Go)
- Expo Router (file-based navigation)
- NativeWind (Tailwind CSS for RN)
- Zustand (state management)
- Supabase (auth, PostgreSQL, realtime subscriptions, edge functions)
- Claude API via @anthropic-ai/sdk (streaming + tool_use)
- Custom MCP Server (TypeScript, separate package in mcp-server/)

## Conventions

- TypeScript strict mode
- Conventional commits: feat:, fix:, chore:, docs:
- Interfaces in src/types/ are CONTRACTS — don't change without team agreement
- Each module area is owned by one dev — don't edit other devs' areas
- Mock data for cross-module dependencies until integration phase
- No force push to main
- Claude API key ONLY in edge functions, NEVER in client code

## Architecture — Module Ownership

- app/(tabs)/routine.tsx, src/components/routine/, src/modules/routine/ → @thblu
- app/, src/components/ui/, src/components/chat/, src/modules/chat/, src/store/, src/theme/ → @alexndr-n
- src/services/, src/hooks/useRealtimeRoutine.ts, supabase/, src/types/ → @DanteDia
- src/modules/ai/, mcp-server/ → @Juampiman

## Key Patterns

- AI responses use Claude streaming (token by token)
- Claude tool_use modifies routines directly in Supabase
- Supabase Realtime pushes routine changes to the Routine screen
- Multi-tenant: tenant config (colors, logo) loaded from tenants table
- Chat guardrail: AI only responds about fitness/training/sports nutrition
