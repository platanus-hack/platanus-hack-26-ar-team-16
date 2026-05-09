# Gohan AI — MCP Server

MCP server that lets gym apps integrate Gohan AI's personal-trainer capabilities into their existing systems. It exposes 9 tools that read and mutate user routines, profiles, and tenant branding stored in Supabase.

This document is the integration reference for B2B partners.

---

## 1. What you get

- 9 MCP tools covering: routine reads, exercise CRUD, user profile reads, multi-tenant branding, and tenant user listings.
- A single Node process speaking the [Model Context Protocol](https://modelcontextprotocol.io) over **stdio**.
- Direct access to the Gohan AI Supabase database using a service-role key (no separate API layer in between).

You connect any MCP host (Claude Desktop, your own MCP client, an internal LLM agent) to this server and your host gains the 9 tools as if they were native.

---

## 2. Architecture

```
┌──────────────────────┐   stdio   ┌─────────────────────┐  HTTPS  ┌──────────────┐
│ MCP host             │ ───────▶  │ gohan-ai MCP server │ ──────▶ │  Supabase    │
│ (Claude Desktop,     │ ◀──────── │ (this Node process) │ ◀────── │  (Postgres)  │
│  your gym backend,   │   tools   │                     │         │              │
│  custom agent, ...)  │           │ uses SERVICE ROLE   │         │              │
└──────────────────────┘           └─────────────────────┘         └──────────────┘
```

- **Transport**: stdio. The host spawns the server as a subprocess and exchanges JSON-RPC over stdin/stdout. There is no HTTP listener.
- **Auth between host ↔ server**: none beyond the OS process boundary. The host is trusted.
- **Auth between server ↔ Supabase**: `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). The server is trusted.

> **Security implication**: this server must run **server-side**, in a host you control. It cannot run inside an end-user device (mobile app, browser) because the service-role key would be exposed. See [§9 Security](#9-security).

---

## 3. Requirements

- Node.js ≥ 18
- A Supabase project provisioned with the Gohan AI schema (`profiles`, `tenants`, `routines`, `routine_days`, `routine_exercises`)
- An MCP host capable of spawning stdio servers (Claude Desktop, [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) clients, etc.)

---

## 4. Install & build

```bash
cd mcp-server
npm install
npm run build      # emits dist/index.js
```

Scripts:

| Script        | What it does                              |
| ------------- | ----------------------------------------- |
| `npm run dev` | Run from source via `ts-node`             |
| `npm run build` | Compile TypeScript to `dist/`           |
| `npm start`   | Run the compiled `dist/index.js`          |

> Note: `tsc` may emit `TS2589` ("type instantiation excessively deep") from the MCP SDK + Zod combination. This is a known SDK issue and does not affect runtime. The build is configured to emit JS regardless.

---

## 5. Environment variables

| Variable                     | Required | Description                                                         |
| ---------------------------- | -------- | ------------------------------------------------------------------- |
| `SUPABASE_URL`               | yes      | Project URL, e.g. `https://cjflwpcxfprxxjbhjxlo.supabase.co`        |
| `SUPABASE_SERVICE_ROLE_KEY`  | yes      | Service-role key. Bypasses RLS. **Never expose to clients.**        |

The Supabase client is lazy-initialized on first tool call, so the server starts even if env vars are missing — they will only fail when a tool is invoked.

---

## 6. Integration patterns

### 6.1 Claude Desktop

Add an entry to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gohan-ai": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

Restart Claude Desktop. The 9 tools appear under the `gohan-ai` server.

### 6.2 Your own MCP host (Node)

```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/mcp-server/dist/index.js'],
  env: {
    SUPABASE_URL: process.env.GOHAN_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.GOHAN_SERVICE_ROLE!,
  },
});

const client = new Client({ name: 'my-gym-app', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
const result = await client.callTool({
  name: 'get_user_routine',
  arguments: { user_id: 'd14aca31-5ece-465a-b02e-ebdd79384962' },
});
```

### 6.3 Gym backend acting as agent host

Typical B2B pattern: your backend runs an LLM agent that orchestrates your own business logic plus Gohan tools. The Gohan MCP server runs as a child process of your backend; tools become available to your agent's tool-calling loop. End users only ever talk to your backend over HTTPS — the service-role key never leaves your infrastructure.

---

## 7. Tool reference

All tools return `content: [{ type: 'text', text: <string> }]`. Read tools return JSON-stringified payloads. Write tools return a human-readable status string. Errors are returned in the same shape with the text prefixed by `Error:`. Tools never throw to the host.

### 7.1 `get_user_routine`

Get a user's active routine with all days and exercises.

| Param     | Type   | Required | Notes                |
| --------- | ------ | -------- | -------------------- |
| `user_id` | string | yes      | UUID of the user     |

Response shape (text payload, parsed JSON):

```json
{
  "id": "uuid",
  "name": "Push / Pull / Legs",
  "is_active": true,
  "created_at": "2026-...",
  "updated_at": "2026-...",
  "routine_days": [
    {
      "id": "uuid",
      "day_of_week": 1,
      "muscle_groups": ["chest", "triceps"],
      "label": "Push",
      "routine_exercises": [
        {
          "id": "uuid",
          "exercise_name": "Bench press",
          "sets": 4,
          "reps": 8,
          "weight_kg": 60,
          "rest_seconds": 90,
          "order_index": 0,
          "notes": null,
          "ai_reasoning": "Compound first to maximize output",
          "completed": false
        }
      ]
    }
  ]
}
```

If the user has no active routine, the Supabase query returns an error and the tool surfaces it as text.

### 7.2 `list_exercises_for_day`

List exercises for a single day in the active routine.

| Param         | Type   | Required | Notes                                |
| ------------- | ------ | -------- | ------------------------------------ |
| `user_id`     | string | yes      | UUID of the user                     |
| `day_of_week` | number | yes      | 0=Sunday, 1=Monday, …, 6=Saturday    |

Response: same `routine_days` row shape as in `get_user_routine`, scoped to that day.

### 7.3 `update_exercise`

Mutate sets / reps / weight / notes of an existing exercise. Only fields explicitly passed are updated.

| Param         | Type             | Required | Notes                              |
| ------------- | ---------------- | -------- | ---------------------------------- |
| `exercise_id` | string           | yes      | UUID                               |
| `sets`        | number           | no       |                                    |
| `reps`        | number           | no       |                                    |
| `weight_kg`   | number \| null   | no       | `null` clears the weight           |
| `notes`       | string \| null   | no       | `null` clears notes                |

Response: `"Exercise updated successfully"` on success.

### 7.4 `add_exercise`

Append a new exercise to the end of a routine day. `order_index` is auto-assigned to `max + 1`.

| Param            | Type             | Required | Default | Notes                |
| ---------------- | ---------------- | -------- | ------- | -------------------- |
| `routine_day_id` | string           | yes      | —       | UUID of the day      |
| `exercise_name`  | string           | yes      | —       |                      |
| `sets`           | number           | no       | 3       |                      |
| `reps`           | number           | no       | 10      |                      |
| `weight_kg`      | number \| null   | no       | —       |                      |
| `rest_seconds`   | number           | no       | 60      |                      |
| `notes`          | string \| null   | no       | —       |                      |

Response: `"Exercise added successfully"` on success.

### 7.5 `remove_exercise`

Delete an exercise.

| Param         | Type   | Required |
| ------------- | ------ | -------- |
| `exercise_id` | string | yes      |

Response: `"Exercise removed successfully"`.

> **Quirk**: this does **not** reindex siblings. After removal, `order_index` may have gaps (e.g. 0, 1, 2, 4, 5). Always sort by `order_index`; never assume contiguous integers.

### 7.6 `replace_exercise`

Swap an exercise for a new one while preserving its position (same `routine_day_id` and `order_index`). Internally this is a `delete` followed by an `insert`, not an `update`.

| Param            | Type             | Required | Default |
| ---------------- | ---------------- | -------- | ------- |
| `exercise_id`    | string           | yes      | —       |
| `exercise_name`  | string           | yes      | —       |
| `sets`           | number           | no       | 3       |
| `reps`           | number           | no       | 10      |
| `weight_kg`      | number \| null   | no       | —       |
| `rest_seconds`   | number           | no       | 60      |
| `notes`          | string \| null   | no       | —       |

Response: `"Exercise replaced successfully"`.

> Because this is delete+insert, the new row gets a **new UUID**. Cached references to the old `exercise_id` will be stale.

### 7.7 `get_user_profile`

Return the full profile row for a user.

| Param     | Type   | Required |
| --------- | ------ | -------- |
| `user_id` | string | yes      |

Response: the full `profiles` row (`select *`). Common fields include `display_name`, `fitness_level`, `goals`, `training_days_per_week`, `onboarding_completed`, plus injuries / equipment metadata stored on the profile.

### 7.8 `get_tenant_info`

Return the configuration row for a gym tenant — name, brand color, logo, slug, etc.

| Param         | Type   | Required | Notes                                     |
| ------------- | ------ | -------- | ----------------------------------------- |
| `tenant_slug` | string | yes      | e.g. `"smartfit"`, `"default"`            |

Use this to drive theming in your client (logo, primary color) per gym.

### 7.9 `list_tenant_users`

List all users that belong to a gym tenant. Useful for admin dashboards or analytics.

| Param         | Type   | Required |
| ------------- | ------ | -------- |
| `tenant_slug` | string | yes      |

Response: an array of profile summaries — `id`, `display_name`, `fitness_level`, `goals`, `training_days_per_week`, `onboarding_completed`.

---

## 8. Multi-tenant model

Every user belongs to exactly one tenant via `profiles.tenant_id`. Tenants are addressed by `slug` from the outside (`smartfit`, `default`, etc.) so partner systems don't need to know internal UUIDs.

Typical B2B flow:

1. Your gym app authenticates the end user against your IdP.
2. Your backend resolves which Gohan `user_id` corresponds to that user (one-to-one mapping you maintain).
3. Your backend's agent calls Gohan tools with that `user_id` plus your `tenant_slug` for branding.

Tenants are seeded server-side; this MCP server does not expose tenant creation.

---

## 9. Security

- **`SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security.** Any caller of these tools effectively has full read/write on the underlying tables.
- The server **does not** authenticate the MCP host, and **does not** scope tool calls to a tenant. Authorization is your responsibility:
  - Run the server inside a trusted environment (your backend, not end-user devices).
  - Validate `user_id` server-side against your own auth before passing it to tools.
  - If you need tenant isolation, gate calls in your host before they reach the server.
- The service-role key must be injected via env vars and never logged.
- This server is intended for trusted-host integration. For a public-internet-exposed deployment, put it behind your own API and authn layer.

---

## 10. Known quirks

| Quirk                                                              | Consequence                                                  | Mitigation                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `remove_exercise` does not reindex siblings                        | `order_index` may have gaps                                  | Always sort by `order_index`; do not assume contiguous       |
| `replace_exercise` is delete+insert                                | The replaced exercise has a **new** UUID                     | Re-read the day after replace if you cache exercise IDs      |
| `update_exercise` cannot null arbitrary fields                     | Only `weight_kg` and `notes` accept `null`                   | For other resets, replace the exercise                       |
| MCP SDK + Zod surfaces `TS2589` at compile time                    | Cosmetic build warnings                                      | Build is configured to emit JS regardless                    |
| Tools return errors as text (prefixed with `Error:`)               | The host has to parse the text to detect failures            | On the host side, treat any text starting with `Error:` as a failure |

---

## 11. Versioning

Server identity advertised over MCP:

- name: `gohan-ai`
- version: `1.0.0`

Tool names and parameter shapes documented here are the contract. Breaking changes will bump the major version.
