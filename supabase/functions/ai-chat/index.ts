// TODO: @DanteDia — Supabase Edge Function
// Proxies Claude API requests to keep ANTHROPIC_API_KEY server-side
//
// This edge function:
// 1. Receives the user message + conversation history from the client
// 2. Calls Claude API with streaming
// 3. Streams the response back to the client
// 4. Handles tool_use calls (create/update routine in DB)
//
// Deploy: supabase functions deploy ai-chat

export default async function handler(_req: Request): Promise<Response> {
  return new Response('Not implemented', { status: 501 });
}
