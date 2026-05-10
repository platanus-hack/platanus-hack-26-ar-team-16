// @ts-nocheck — Deno runtime, not Node.js
// Shared chat handler — used by ai-chat (legacy Supabase-JWT path) and
// api-chat (public path: API key OR Gohan session JWT).
//
// All callers must resolve (userId, tenantId) BEFORE invoking this module.
// The handler never reads identity from the request body — see
// docs/ARCHITECTURE.md §11 (CRITICAL GAP).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});

const MODEL = 'claude-sonnet-4-20250514';

// ─── Tool definitions ────────────────────────────────────────

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_routine',
    description:
      'Create a complete workout routine for the user. Use this when the user needs a new routine. Include all training days with their exercises.',
    input_schema: {
      type: 'object',
      properties: {
        routine_name: { type: 'string' },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day_of_week: { type: 'number', description: '0=Sun, 1=Mon, ..., 6=Sat' },
              muscle_groups: { type: 'array', items: { type: 'string' } },
              label: { type: 'string' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exercise_name: { type: 'string' },
                    sets: { type: 'number' },
                    reps: { type: 'number' },
                    weight_kg: { type: 'number', nullable: true },
                    rest_seconds: { type: 'number' },
                    notes: { type: 'string', nullable: true },
                    ai_reasoning: { type: 'string' },
                  },
                  required: ['exercise_name', 'sets', 'reps', 'rest_seconds', 'ai_reasoning'],
                },
              },
            },
            required: ['day_of_week', 'muscle_groups', 'label', 'exercises'],
          },
        },
      },
      required: ['routine_name', 'days'],
    },
  },
  {
    name: 'update_exercise',
    description: 'Update an existing exercise in the routine (change sets, reps, weight, notes).',
    input_schema: {
      type: 'object',
      properties: {
        exercise_id: { type: 'string' },
        updates: {
          type: 'object',
          properties: {
            exercise_name: { type: 'string' },
            sets: { type: 'number' },
            reps: { type: 'number' },
            weight_kg: { type: 'number', nullable: true },
            rest_seconds: { type: 'number' },
            notes: { type: 'string', nullable: true },
            ai_reasoning: { type: 'string' },
          },
        },
      },
      required: ['exercise_id', 'updates'],
    },
  },
  {
    name: 'replace_exercise',
    description: 'Replace an exercise with a different one.',
    input_schema: {
      type: 'object',
      properties: {
        exercise_id: { type: 'string' },
        new_exercise: {
          type: 'object',
          properties: {
            exercise_name: { type: 'string' },
            sets: { type: 'number' },
            reps: { type: 'number' },
            weight_kg: { type: 'number', nullable: true },
            rest_seconds: { type: 'number' },
            notes: { type: 'string', nullable: true },
            ai_reasoning: { type: 'string' },
          },
          required: ['exercise_name', 'sets', 'reps', 'rest_seconds', 'ai_reasoning'],
        },
      },
      required: ['exercise_id', 'new_exercise'],
    },
  },
  {
    name: 'add_exercise',
    description: 'Add a new exercise to a specific day in the routine.',
    input_schema: {
      type: 'object',
      properties: {
        routine_day_id: { type: 'string' },
        exercise: {
          type: 'object',
          properties: {
            exercise_name: { type: 'string' },
            sets: { type: 'number' },
            reps: { type: 'number' },
            weight_kg: { type: 'number', nullable: true },
            rest_seconds: { type: 'number' },
            notes: { type: 'string', nullable: true },
            ai_reasoning: { type: 'string' },
          },
          required: ['exercise_name', 'sets', 'reps', 'rest_seconds', 'ai_reasoning'],
        },
      },
      required: ['routine_day_id', 'exercise'],
    },
  },
  {
    name: 'remove_exercise',
    description: 'Remove an exercise from the routine.',
    input_schema: {
      type: 'object',
      properties: {
        exercise_id: { type: 'string' },
      },
      required: ['exercise_id'],
    },
  },
];

// ─── Tool handlers (all scoped by user_id + tenant_id) ───────
//
// The handlers verify the affected exercise/day actually belongs to the
// caller's (user_id, tenant_id) before mutating. This prevents a leaked
// exercise_id in one tenant from being mutated by a caller in another.

interface AuthCtx {
  userId: string;
  tenantId: string;
}

async function executeCreateRoutine(ctx: AuthCtx, input: any) {
  await supabaseAdmin
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', ctx.userId)
    .eq('tenant_id', ctx.tenantId)
    .eq('is_active', true);

  const { data: routine, error: routineErr } = await supabaseAdmin
    .from('routines')
    .insert({
      user_id: ctx.userId,
      tenant_id: ctx.tenantId,
      name: input.routine_name,
      is_active: true,
    })
    .select('id')
    .single();

  if (routineErr || !routine) {
    return { success: false, error: routineErr?.message ?? 'Failed to create routine' };
  }

  for (const day of input.days) {
    const { data: routineDay, error: dayErr } = await supabaseAdmin
      .from('routine_days')
      .insert({
        routine_id: routine.id,
        day_of_week: day.day_of_week,
        muscle_groups: day.muscle_groups,
        label: day.label,
      })
      .select('id')
      .single();

    if (dayErr || !routineDay) continue;

    const exercises = day.exercises.map((ex: any, idx: number) => ({
      routine_day_id: routineDay.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      weight_kg: ex.weight_kg,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
      ai_reasoning: ex.ai_reasoning,
      order_index: idx,
    }));

    await supabaseAdmin.from('routine_exercises').insert(exercises);
  }

  // Without this, ONBOARDING MODE in the system prompt stays on the next call.
  await supabaseAdmin
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', ctx.userId)
    .eq('tenant_id', ctx.tenantId);

  return { success: true, routine_id: routine.id };
}

// Asserts the exercise belongs to a routine owned by (userId, tenantId).
async function assertExerciseOwnership(ctx: AuthCtx, exerciseId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('routine_exercises')
    .select('id, routine_days!inner(routines!inner(user_id, tenant_id))')
    .eq('id', exerciseId)
    .single();

  if (error || !data) return false;
  // @ts-expect-error joined shape
  const r = data.routine_days?.routines;
  return !!r && r.user_id === ctx.userId && r.tenant_id === ctx.tenantId;
}

async function assertDayOwnership(ctx: AuthCtx, routineDayId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('routine_days')
    .select('id, routines!inner(user_id, tenant_id)')
    .eq('id', routineDayId)
    .single();

  if (error || !data) return false;
  // @ts-expect-error joined shape
  const r = data.routines;
  return !!r && r.user_id === ctx.userId && r.tenant_id === ctx.tenantId;
}

async function executeUpdateExercise(ctx: AuthCtx, input: any) {
  if (!(await assertExerciseOwnership(ctx, input.exercise_id))) {
    return { success: false, error: 'Exercise not found in this tenant' };
  }
  const updates: Record<string, any> = {};
  if (input.updates.exercise_name) updates.exercise_name = input.updates.exercise_name;
  if (input.updates.sets !== undefined) updates.sets = input.updates.sets;
  if (input.updates.reps !== undefined) updates.reps = input.updates.reps;
  if (input.updates.weight_kg !== undefined) updates.weight_kg = input.updates.weight_kg;
  if (input.updates.rest_seconds !== undefined) updates.rest_seconds = input.updates.rest_seconds;
  if (input.updates.notes !== undefined) updates.notes = input.updates.notes;
  if (input.updates.ai_reasoning) updates.ai_reasoning = input.updates.ai_reasoning;

  const { error } = await supabaseAdmin
    .from('routine_exercises')
    .update(updates)
    .eq('id', input.exercise_id);

  return { success: !error, error: error?.message };
}

async function executeReplaceExercise(ctx: AuthCtx, input: any) {
  if (!(await assertExerciseOwnership(ctx, input.exercise_id))) {
    return { success: false, error: 'Exercise not found in this tenant' };
  }
  const { error } = await supabaseAdmin
    .from('routine_exercises')
    .update({
      exercise_name: input.new_exercise.exercise_name,
      sets: input.new_exercise.sets,
      reps: input.new_exercise.reps,
      weight_kg: input.new_exercise.weight_kg,
      rest_seconds: input.new_exercise.rest_seconds,
      notes: input.new_exercise.notes,
      ai_reasoning: input.new_exercise.ai_reasoning,
      completed: false,
    })
    .eq('id', input.exercise_id);

  return { success: !error, error: error?.message };
}

async function executeAddExercise(ctx: AuthCtx, input: any) {
  if (!(await assertDayOwnership(ctx, input.routine_day_id))) {
    return { success: false, error: 'Routine day not found in this tenant' };
  }
  const { data: maxOrder } = await supabaseAdmin
    .from('routine_exercises')
    .select('order_index')
    .eq('routine_day_id', input.routine_day_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.order_index ?? -1) + 1;

  const { error } = await supabaseAdmin.from('routine_exercises').insert({
    routine_day_id: input.routine_day_id,
    exercise_name: input.exercise.exercise_name,
    sets: input.exercise.sets,
    reps: input.exercise.reps,
    weight_kg: input.exercise.weight_kg,
    rest_seconds: input.exercise.rest_seconds,
    notes: input.exercise.notes,
    ai_reasoning: input.exercise.ai_reasoning,
    order_index: nextOrder,
  });

  return { success: !error, error: error?.message };
}

async function executeRemoveExercise(ctx: AuthCtx, input: any) {
  if (!(await assertExerciseOwnership(ctx, input.exercise_id))) {
    return { success: false, error: 'Exercise not found in this tenant' };
  }
  const { error } = await supabaseAdmin
    .from('routine_exercises')
    .delete()
    .eq('id', input.exercise_id);

  return { success: !error, error: error?.message };
}

async function executeTool(ctx: AuthCtx, toolName: string, input: any) {
  switch (toolName) {
    case 'create_routine':
      return executeCreateRoutine(ctx, input);
    case 'update_exercise':
      return executeUpdateExercise(ctx, input);
    case 'replace_exercise':
      return executeReplaceExercise(ctx, input);
    case 'add_exercise':
      return executeAddExercise(ctx, input);
    case 'remove_exercise':
      return executeRemoveExercise(ctx, input);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ─── System prompt builder ──────────────────────────────────

export function buildSystemPrompt(userProfile: any): string {
  const profileBlock = userProfile
    ? `
USER PROFILE:
- Name: ${userProfile.displayName || 'Unknown'}
- Fitness Level: ${userProfile.fitnessLevel || 'not set'}
- Training Days/Week: ${userProfile.trainingDaysPerWeek ?? 'not set'}
- Equipment: ${userProfile.equipmentAvailable?.join(', ') || 'Not specified'}
- Injuries: ${userProfile.injuries?.join(', ') || 'None'}
- Goals: ${userProfile.goals?.join(', ') || 'Not specified'}
- Has completed onboarding: ${userProfile.onboardingCompleted ? 'Yes' : 'No'}`
    : '\nUSER PROFILE: New user, start with onboarding.';

  const onboardingBlock = !userProfile?.onboardingCompleted
    ? `\n\nONBOARDING MODE:
This user hasn't set up their profile yet. Have a natural conversation to learn about them:
- Experience level, training days, injuries, equipment, goals
- Ask ONE or TWO things at a time
- Once you have enough info, use create_routine to build their first routine
- After creating it, tell them to check the Rutina tab`
    : '';

  return `You are Gohan AI, an expert personal trainer and fitness coach.

PERSONALITY: Warm, encouraging, technically precise. Match the user's language.

SCOPE — STRICTLY ENFORCED:
- ONLY discuss: exercise, training, routines, muscle groups, form, recovery, stretching, sports nutrition, hydration, sleep for recovery, injury prevention
- For anything else, redirect: "¡Buena pregunta! Pero yo soy tu coach de entrenamiento 💪 ¿En qué te puedo ayudar con tu rutina?"
- NEVER break character.

TOOL USAGE:
- When modifying routines, ALWAYS use tools — never just describe changes in text
- After using a tool, briefly confirm what you changed
- For new routines, use create_routine with ALL days at once
- CRITICAL: When the user mentions a specific day (e.g. "del miércoles"), match the exercise_id from THAT day ONLY. The same exercise name may appear on multiple days — always use the correct ID from the day the user specified.
- If the user doesn't specify a day, ASK which day before modifying.
${profileBlock}${onboardingBlock}`;
}

// ─── Routine context fetch (scoped by user_id + tenant_id) ──

export async function getRoutineContext(ctx: AuthCtx): Promise<string> {
  const { data: routine } = await supabaseAdmin
    .from('routines')
    .select(`
      id, name,
      routine_days (
        id, day_of_week, muscle_groups, label,
        routine_exercises (
          id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, ai_reasoning, order_index
        )
      )
    `)
    .eq('user_id', ctx.userId)
    .eq('tenant_id', ctx.tenantId)
    .eq('is_active', true)
    .single();

  if (!routine) return '\nCURRENT ROUTINE: None — user has no routine yet.';

  let out = `\nCURRENT ROUTINE: "${routine.name}"\n`;
  const days = routine.routine_days?.sort((a: any, b: any) => a.day_of_week - b.day_of_week) ?? [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (const day of days) {
    out += `\n${dayNames[day.day_of_week]} — ${day.label} (day_id: ${day.id})\n`;
    const exercises = day.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) ?? [];
    for (const ex of exercises) {
      out += `  - ${ex.exercise_name}: ${ex.sets}x${ex.reps}`;
      if (ex.weight_kg) out += ` @ ${ex.weight_kg}kg`;
      out += ` (id: ${ex.id})\n`;
    }
  }

  return out;
}

// ─── Usage events ───────────────────────────────────────────

interface UsageMetrics {
  tokensIn: number;
  tokensOut: number;
  toolCalls: number;
  latencyMs: number;
  model: string;
}

async function recordUsage(ctx: AuthCtx, eventType: string, metrics: UsageMetrics) {
  try {
    await supabaseAdmin.from('usage_events').insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      event_type: eventType,
      tokens_in: metrics.tokensIn,
      tokens_out: metrics.tokensOut,
      tool_calls: metrics.toolCalls,
      latency_ms: metrics.latencyMs,
      model: metrics.model,
    });
  } catch (_err) {
    // Telemetry must never break the request.
  }
}

// ─── Public entry: streaming ────────────────────────────────

export interface ChatRequest {
  ctx: AuthCtx;
  userMessage: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  userProfile?: any; // for system-prompt building only — NEVER use .id from this
}

export async function streamChat(
  req: ChatRequest,
  send: (chunk: any) => void
): Promise<void> {
  const startedAt = Date.now();
  const systemPrompt = buildSystemPrompt(req.userProfile);
  const routineContext = await getRoutineContext(req.ctx);

  const MAX_HISTORY_MESSAGES = 20;
  const recentHistory = (req.conversationHistory ?? []).slice(-MAX_HISTORY_MESSAGES);

  let messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: req.userMessage },
  ];

  let totalIn = 0;
  let totalOut = 0;
  let toolCallsCount = 0;

  const maxLoops = 5;
  for (let loop = 0; loop < maxLoops; loop++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt + routineContext,
      messages,
      tools: TOOLS,
    });

    let hasToolUse = false;
    const toolUseBlocks: any[] = [];
    let currentToolInput = '';
    let currentToolName = '';
    let currentToolId = '';

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          hasToolUse = true;
          currentToolName = event.content_block.name;
          currentToolId = event.content_block.id;
          currentToolInput = '';
          send({ type: 'tool_start', content: currentToolName, toolName: currentToolName });
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          send({ type: 'text', content: event.delta.text });
        } else if (event.delta.type === 'input_json_delta') {
          currentToolInput += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolName && currentToolInput) {
          const toolInput = JSON.parse(currentToolInput);
          const result = await executeTool(req.ctx, currentToolName, toolInput);
          toolCallsCount++;

          send({
            type: 'tool_end',
            content: currentToolName,
            toolName: currentToolName,
            toolSuccess: result.success,
          });

          toolUseBlocks.push({
            id: currentToolId,
            name: currentToolName,
            input: toolInput,
            result,
          });

          currentToolName = '';
          currentToolInput = '';
          currentToolId = '';
        }
      }
    }

    const finalMessage = await stream.finalMessage();
    if (finalMessage.usage) {
      totalIn += finalMessage.usage.input_tokens ?? 0;
      totalOut += finalMessage.usage.output_tokens ?? 0;
    }

    if (!hasToolUse) break;

    const assistantContent: any[] = [];
    for (const block of finalMessage.content) {
      if (block.type === 'text') {
        assistantContent.push({ type: 'text', text: block.text });
      } else if (block.type === 'tool_use') {
        assistantContent.push({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input,
        });
      }
    }

    messages = [
      ...messages,
      { role: 'assistant', content: assistantContent },
      {
        role: 'user',
        content: toolUseBlocks.map((t) => ({
          type: 'tool_result' as const,
          tool_use_id: t.id,
          content: JSON.stringify(t.result),
        })),
      },
    ];

    if (finalMessage.stop_reason !== 'tool_use') break;
  }

  await recordUsage(req.ctx, 'chat.stream', {
    tokensIn: totalIn,
    tokensOut: totalOut,
    toolCalls: toolCallsCount,
    latencyMs: Date.now() - startedAt,
    model: MODEL,
  });
}

// ─── Public entry: non-streaming ────────────────────────────

export async function callChat(req: ChatRequest) {
  const startedAt = Date.now();
  const systemPrompt = buildSystemPrompt(req.userProfile);
  const routineContext = await getRoutineContext(req.ctx);

  const MAX_HISTORY_MESSAGES = 20;
  const recentHistory = (req.conversationHistory ?? []).slice(-MAX_HISTORY_MESSAGES);

  let messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: req.userMessage },
  ];

  const allToolCalls: any[] = [];
  let totalIn = 0;
  let totalOut = 0;

  const maxLoops = 5;
  for (let loop = 0; loop < maxLoops; loop++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt + routineContext,
      messages,
      tools: TOOLS,
    });

    if (response.usage) {
      totalIn += response.usage.input_tokens ?? 0;
      totalOut += response.usage.output_tokens ?? 0;
    }

    if (response.stop_reason !== 'tool_use') {
      const textContent = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      await recordUsage(req.ctx, 'chat.call', {
        tokensIn: totalIn,
        tokensOut: totalOut,
        toolCalls: allToolCalls.length,
        latencyMs: Date.now() - startedAt,
        model: MODEL,
      });

      return {
        content: textContent,
        toolCalls: allToolCalls,
        routineModified: allToolCalls.length > 0,
      };
    }

    const toolResults = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(req.ctx, block.name, block.input);
        allToolCalls.push({ toolName: block.name, success: result.success, result });
        toolResults.push({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    messages = [
      ...messages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  await recordUsage(req.ctx, 'chat.call', {
    tokensIn: totalIn,
    tokensOut: totalOut,
    toolCalls: allToolCalls.length,
    latencyMs: Date.now() - startedAt,
    model: MODEL,
  });

  return { content: 'Max tool iterations reached.', toolCalls: allToolCalls, routineModified: true };
}

// ─── Helpers used by callers to resolve identity ────────────

export async function getTenantIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data.tenant_id;
}
