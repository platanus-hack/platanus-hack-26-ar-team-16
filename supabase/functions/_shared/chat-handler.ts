// @ts-nocheck — Deno runtime, not Node.js
// Shared chat handler — used by ai-chat (legacy Supabase-JWT path) and
// api-chat (public path: API key OR Gohan session JWT).
//
// All callers must resolve (userId, tenantId) BEFORE invoking this module.
// The handler never reads identity from the request body — see
// docs/ARCHITECTURE.md §11 (CRITICAL GAP).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';
import {
  getCoachPersonality,
  getTemporalContext,
  CORE_IDENTITY,
  FORMAT_RULES,
  SCOPE_RULES,
  TOOL_RULES,
  UI_RULES,
  CITATION_RULES,
  ONBOARDING_MODE,
} from './coach-instructions.ts';

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
      'Create a NEW workout routine and switch to it. The user can have multiple saved routines (e.g. "Regular", "Vacaciones", "Bulk", "Cut"); creating a new one deactivates any currently active routine but does NOT delete it — it remains saved and switchable. Pick a short, descriptive routine_name that reflects the context the user described (e.g. "Vacaciones", "Bulk pierna").',
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
  {
    name: 'list_routines',
    description:
      'List all routines the user has saved (active + inactive), with their ids. Use this when the user asks what routines they have, or before switching/renaming/deleting so you can resolve a name to an id.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'switch_routine',
    description:
      'Make a different saved routine the active one. Pass either routine_id (preferred) or routine_name (case-insensitive contains match). Use when the user says things like "cambiá a la rutina de vacaciones" or "volvé a la regular".',
    input_schema: {
      type: 'object',
      properties: {
        routine_id: { type: 'string' },
        routine_name: { type: 'string' },
      },
    },
  },
  {
    name: 'rename_routine',
    description: 'Rename a saved routine.',
    input_schema: {
      type: 'object',
      properties: {
        routine_id: { type: 'string' },
        new_name: { type: 'string' },
      },
      required: ['routine_id', 'new_name'],
    },
  },
  {
    name: 'cite_sources',
    description:
      'Devolvé fuentes científicas para respaldar un claim del coach. Llamalo SOLO cuando el usuario pida explícitamente la fuente, o cuando estés haciendo un claim que requiere respaldo (ej: rangos de reps, dosis de proteína, tiempos de recovery, efectividad de suplementos). Si no hay fuente apropiada en la DB, NO inventes — devolvé array vacío.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Claim corto a respaldar, en español. Ej: "rango de repeticiones para hipertrofia"',
        },
        category: {
          type: 'string',
          enum: ['training', 'nutrition', 'recovery', 'injury', 'supplements', 'mental'],
        },
        max_results: {
          type: 'integer',
          default: 3,
          maximum: 5,
        },
      },
      required: ['query', 'category'],
    },
  },
  {
    name: 'delete_routine',
    description:
      'Permanently delete a saved routine. Confirm with the user first if there is any ambiguity. Cannot delete the only remaining routine.',
    input_schema: {
      type: 'object',
      properties: { routine_id: { type: 'string' } },
      required: ['routine_id'],
    },
  },
  {
    name: 'update_routine_day',
    description:
      'Update a specific day\'s label and/or muscle groups in the active routine. Use this whenever the user changes what a day focuses on (e.g. "change Monday to legs", "rename Wednesday to Pull"). Always pair with add/replace/remove_exercise calls to update the actual exercises too.',
    input_schema: {
      type: 'object',
      properties: {
        routine_day_id: { type: 'string', description: 'ID of the routine_day row to update' },
        label: { type: 'string', description: 'New human-readable label, e.g. "Piernas", "Pull", "Full Body"' },
        muscle_groups: {
          type: 'array',
          items: { type: 'string' },
          description: 'Muscle groups trained this day, e.g. ["Cuádriceps", "Isquiotibiales", "Glúteos"]',
        },
      },
      required: ['routine_day_id'],
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

async function executeUpdateRoutineDay(ctx: AuthCtx, input: any) {
  if (!(await assertDayOwnership(ctx, input.routine_day_id))) {
    return { success: false, error: 'Day not found in this tenant' };
  }
  const updates: Record<string, any> = {};
  if (input.label !== undefined) updates.label = input.label;
  if (input.muscle_groups !== undefined) updates.muscle_groups = input.muscle_groups;
  if (Object.keys(updates).length === 0) return { success: false, error: 'No fields to update' };
  const { error } = await supabaseAdmin
    .from('routine_days')
    .update(updates)
    .eq('id', input.routine_day_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
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

async function assertRoutineOwnership(ctx: AuthCtx, routineId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('routines')
    .select('id, user_id, tenant_id')
    .eq('id', routineId)
    .single();
  if (error || !data) return false;
  return data.user_id === ctx.userId && data.tenant_id === ctx.tenantId;
}

async function executeListRoutines(ctx: AuthCtx) {
  const { data, error } = await supabaseAdmin
    .from('routines')
    .select('id, name, is_active, updated_at')
    .eq('user_id', ctx.userId)
    .eq('tenant_id', ctx.tenantId)
    .order('updated_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, routines: data ?? [] };
}

async function executeSwitchRoutine(ctx: AuthCtx, input: any) {
  let routineId: string | null = input.routine_id ?? null;

  if (!routineId && input.routine_name) {
    const { data, error } = await supabaseAdmin
      .from('routines')
      .select('id, name')
      .eq('user_id', ctx.userId)
      .eq('tenant_id', ctx.tenantId)
      .ilike('name', `%${input.routine_name}%`);
    if (error) return { success: false, error: error.message };
    if (!data || data.length === 0) {
      return { success: false, error: `No routine matches "${input.routine_name}"` };
    }
    if (data.length > 1) {
      return {
        success: false,
        error: `Ambiguous routine name "${input.routine_name}" — matches: ${data.map((r) => r.name).join(', ')}. Pass routine_id instead.`,
      };
    }
    routineId = data[0].id;
  }

  if (!routineId) return { success: false, error: 'routine_id or routine_name is required' };
  if (!(await assertRoutineOwnership(ctx, routineId))) {
    return { success: false, error: 'Routine not found' };
  }

  await supabaseAdmin
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', ctx.userId)
    .eq('tenant_id', ctx.tenantId)
    .eq('is_active', true);

  const { error } = await supabaseAdmin
    .from('routines')
    .update({ is_active: true })
    .eq('id', routineId);
  return { success: !error, error: error?.message, routine_id: routineId };
}

async function executeRenameRoutine(ctx: AuthCtx, input: any) {
  if (!(await assertRoutineOwnership(ctx, input.routine_id))) {
    return { success: false, error: 'Routine not found' };
  }
  const { error } = await supabaseAdmin
    .from('routines')
    .update({ name: input.new_name })
    .eq('id', input.routine_id);
  return { success: !error, error: error?.message };
}

async function executeDeleteRoutine(ctx: AuthCtx, input: any) {
  if (!(await assertRoutineOwnership(ctx, input.routine_id))) {
    return { success: false, error: 'Routine not found' };
  }

  const { data: all, error: countErr } = await supabaseAdmin
    .from('routines')
    .select('id, is_active')
    .eq('user_id', ctx.userId)
    .eq('tenant_id', ctx.tenantId);
  if (countErr) return { success: false, error: countErr.message };
  if ((all?.length ?? 0) <= 1) {
    return { success: false, error: 'Cannot delete the only remaining routine.' };
  }

  const target = all!.find((r) => r.id === input.routine_id);
  const { error } = await supabaseAdmin
    .from('routines')
    .delete()
    .eq('id', input.routine_id);
  if (error) return { success: false, error: error.message };

  // If we just deleted the active routine, promote the most recent remaining one.
  if (target?.is_active) {
    const survivor = all!.find((r) => r.id !== input.routine_id);
    if (survivor) {
      await supabaseAdmin
        .from('routines')
        .update({ is_active: true })
        .eq('id', survivor.id);
    }
  }

  return { success: true };
}

async function executeCiteSources(input: any) {
  const maxResults = Math.min(input.max_results ?? 3, 5);
  const query: string = input.query ?? '';
  const category: string = input.category;

  // Primary: filter by category + ILIKE on claim_short
  const { data: primary } = await supabaseAdmin
    .from('sources')
    .select('id, title, authors, year, url, claim_short')
    .eq('category', category)
    .ilike('claim_short', `%${query.split(' ').slice(0, 3).join('%')}%`)
    .limit(maxResults);

  if (primary && primary.length > 0) {
    return { success: true, sources: primary };
  }

  // Fallback: return top sources in the category regardless of query
  const { data: fallback } = await supabaseAdmin
    .from('sources')
    .select('id, title, authors, year, url, claim_short')
    .eq('category', category)
    .limit(maxResults);

  return { success: true, sources: fallback ?? [] };
}

async function executeTool(ctx: AuthCtx, toolName: string, input: any) {
  switch (toolName) {
    case 'create_routine':
      return executeCreateRoutine(ctx, input);
    case 'update_exercise':
      return executeUpdateExercise(ctx, input);
    case 'replace_exercise':
      return executeReplaceExercise(ctx, input);
    case 'update_routine_day':
      return executeUpdateRoutineDay(ctx, input);
    case 'add_exercise':
      return executeAddExercise(ctx, input);
    case 'remove_exercise':
      return executeRemoveExercise(ctx, input);
    case 'list_routines':
      return executeListRoutines(ctx);
    case 'switch_routine':
      return executeSwitchRoutine(ctx, input);
    case 'rename_routine':
      return executeRenameRoutine(ctx, input);
    case 'delete_routine':
      return executeDeleteRoutine(ctx, input);
    case 'cite_sources':
      return executeCiteSources(input);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ─── System prompt builder ──────────────────────────────────

export function buildSystemPrompt(userProfile: any): string {
  const coachStyle = userProfile?.coachStyle || 'intenso';
  const personality = getCoachPersonality(coachStyle);

  const profileBlock = userProfile
    ? `
USER PROFILE:
- Nombre: ${userProfile.displayName || 'Desconocido'}
- Nivel: ${userProfile.fitnessLevel || 'no definido'}
- Días/semana: ${userProfile.trainingDaysPerWeek ?? 'no definido'}
- Equipamiento: ${userProfile.equipmentAvailable?.join(', ') || 'No especificado'}
- Lesiones: ${userProfile.injuries?.join(', ') || 'Ninguna'}
- Objetivos: ${userProfile.goals?.join(', ') || 'No especificado'}
- Onboarding completo: ${userProfile.onboardingCompleted ? 'Sí' : 'No'}`
    : '\nUSER PROFILE: Usuario nuevo, arrancá con onboarding.';

  const onboardingBlock = !userProfile?.onboardingCompleted
    ? `\n\n${ONBOARDING_MODE}`
    : '';

  return `${CORE_IDENTITY}

${personality}

${FORMAT_RULES}

${SCOPE_RULES}

${TOOL_RULES}

${CITATION_RULES}

${UI_RULES}
${getTemporalContext()}${profileBlock}${onboardingBlock}`;
}

// ─── Routine context fetch (scoped by user_id + tenant_id) ──

export async function getRoutineContext(ctx: AuthCtx): Promise<string> {
  const { data: allRoutines } = await supabaseAdmin
    .from('routines')
    .select('id, name, is_active, updated_at')
    .eq('user_id', ctx.userId)
    .eq('tenant_id', ctx.tenantId)
    .order('updated_at', { ascending: false });

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

  let savedBlock = '';
  if (allRoutines && allRoutines.length > 0) {
    savedBlock = `\nSAVED ROUTINES (user can have multiple — use switch_routine to change active):\n`;
    for (const r of allRoutines) {
      savedBlock += `  - "${r.name}" (id: ${r.id})${r.is_active ? ' [ACTIVE]' : ''}\n`;
    }
  }

  if (!routine) return `${savedBlock}\nCURRENT ROUTINE: None — user has no routine yet.`;

  let out = `${savedBlock}\nCURRENT ROUTINE: "${routine.name}"\n`;
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

          // Emit sources to the client so the UI can render citation pills
          if (currentToolName === 'cite_sources' && result.sources?.length) {
            send({ type: 'sources', sources: result.sources });
          }

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
