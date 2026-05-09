// @ts-nocheck — Deno runtime, not Node.js
// Supabase Edge Function: AI Chat with Claude API
// Handles streaming + tool_use for routine management
//
// Owner: @Juampiman (DEV 4 — AI logic)
// Deployed by: @DanteDia (DEV 3 — infrastructure)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ─── Tool definitions ────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
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

// ─── Tool handlers ───────────────────────────────────────────

async function executeCreateRoutine(userId: string, input: any) {
  const { data: existingRoutines } = await supabaseAdmin
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  const { data: routine, error: routineErr } = await supabaseAdmin
    .from('routines')
    .insert({ user_id: userId, name: input.routine_name, is_active: true })
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

  // Creating a routine ends onboarding — without this, the next message rebuilds
  // the system prompt with ONBOARDING MODE still on, and the AI re-asks the
  // discovery questions even though it already has the answers.
  await supabaseAdmin
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId);

  return { success: true, routine_id: routine.id };
}

async function executeUpdateExercise(input: any) {
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

async function executeReplaceExercise(input: any) {
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

async function executeAddExercise(input: any) {
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

async function executeRemoveExercise(input: any) {
  const { error } = await supabaseAdmin
    .from('routine_exercises')
    .delete()
    .eq('id', input.exercise_id);

  return { success: !error, error: error?.message };
}

async function executeTool(toolName: string, userId: string, input: any) {
  switch (toolName) {
    case 'create_routine':
      return executeCreateRoutine(userId, input);
    case 'update_exercise':
      return executeUpdateExercise(input);
    case 'replace_exercise':
      return executeReplaceExercise(input);
    case 'add_exercise':
      return executeAddExercise(input);
    case 'remove_exercise':
      return executeRemoveExercise(input);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ─── System prompt builder ──────────────────────────────────

function buildSystemPrompt(userProfile: any): string {
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
${profileBlock}${onboardingBlock}`;
}

// ─── Fetch current routine context ──────────────────────────

async function getRoutineContext(userId: string): Promise<string> {
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
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!routine) return '\nCURRENT ROUTINE: None — user has no routine yet.';

  let ctx = `\nCURRENT ROUTINE: "${routine.name}"\n`;
  const days = routine.routine_days?.sort((a: any, b: any) => a.day_of_week - b.day_of_week) ?? [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (const day of days) {
    ctx += `\n${dayNames[day.day_of_week]} — ${day.label} (day_id: ${day.id})\n`;
    const exercises = day.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index) ?? [];
    for (const ex of exercises) {
      ctx += `  - ${ex.exercise_name}: ${ex.sets}x${ex.reps}`;
      if (ex.weight_kg) ctx += ` @ ${ex.weight_kg}kg`;
      ctx += ` (id: ${ex.id})\n`;
    }
  }

  return ctx;
}

// ─── Main handler ───────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-no-stream',
      },
    });
  }

  try {
    const { userMessage, conversationHistory, userProfile } = await req.json();

    const userId = userProfile?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(userProfile);
    const routineContext = await getRoutineContext(userId);

    const MAX_HISTORY_MESSAGES = 20;
    const recentHistory = (conversationHistory ?? []).slice(-MAX_HISTORY_MESSAGES);

    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const noStream = req.headers.get('x-no-stream') === 'true';

    if (noStream) {
      const response = await callClaudeWithTools(
        systemPrompt + routineContext,
        messages,
        userId
      );
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (chunk: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        };

        try {
          await streamClaudeWithTools(
            systemPrompt + routineContext,
            messages,
            userId,
            send
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err: any) {
          send({ type: 'error', content: err.message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ─── Claude API with tool loop (streaming) ──────────────────

async function streamClaudeWithTools(
  system: string,
  messages: Anthropic.MessageParam[],
  userId: string,
  send: (chunk: any) => void
) {
  let currentMessages = [...messages];
  let loopCount = 0;
  const maxLoops = 5;

  while (loopCount < maxLoops) {
    loopCount++;

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system,
      messages: currentMessages,
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
          const result = await executeTool(currentToolName, userId, toolInput);

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

    if (!hasToolUse) break;

    const assistantContent: any[] = [];
    const finalMessage = await stream.finalMessage();
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

    currentMessages = [
      ...currentMessages,
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
}

// ─── Claude API with tool loop (non-streaming) ─────────────

async function callClaudeWithTools(
  system: string,
  messages: Anthropic.MessageParam[],
  userId: string
) {
  let currentMessages = [...messages];
  let loopCount = 0;
  const maxLoops = 5;
  const allToolCalls: any[] = [];

  while (loopCount < maxLoops) {
    loopCount++;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system,
      messages: currentMessages,
      tools: TOOLS,
    });

    if (response.stop_reason !== 'tool_use') {
      const textContent = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

      return {
        content: textContent,
        toolCalls: allToolCalls,
        routineModified: allToolCalls.length > 0,
      };
    }

    const toolResults = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(block.name, userId, block.input);
        allToolCalls.push({ toolName: block.name, success: result.success, result });
        toolResults.push({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  return { content: 'Max tool iterations reached.', toolCalls: allToolCalls, routineModified: true };
}
