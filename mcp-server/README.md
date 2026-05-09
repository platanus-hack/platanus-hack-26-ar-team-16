# Gohan AI — MCP Server

MCP server that allows gym apps to integrate Gohan AI personal trainer capabilities into their existing systems.

## Tools

| Tool | Description |
|------|-------------|
| `get_user_routine` | Get a user's current active routine with all days and exercises |
| `list_exercises_for_day` | List exercises for a specific day of the week |
| `update_exercise` | Modify sets, reps, weight, or notes of an exercise |
| `add_exercise` | Add a new exercise to a specific day |
| `get_user_profile` | Get user profile: fitness level, injuries, equipment, goals |

## Setup

```bash
cd mcp-server
npm install
```

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Run

```bash
npm run dev    # Development with ts-node
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## Integration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "gohan-ai": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-key"
      }
    }
  }
}
```

Gym apps connect via MCP protocol to read and modify their users' routines programmatically.
