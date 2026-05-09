# Gohan AI MCP Server

MCP server that allows gym apps to integrate Gohan AI personal trainer capabilities.

## Tools

| Tool | Description |
|------|-------------|
| `get_user_routine` | Get a user's current active routine |
| `update_exercise` | Modify sets, reps, weight of an exercise |
| `add_exercise` | Add a new exercise to a specific day |
| `get_user_profile` | Get user profile, injuries, equipment |
| `list_exercises_for_day` | List all exercises for a specific day |

## Setup

```bash
cd mcp-server
npm install
npm run dev
```

## Integration

Gym apps connect to this MCP server to read and modify their users' routines. Authentication is done via API key provided by the gym tenant.
