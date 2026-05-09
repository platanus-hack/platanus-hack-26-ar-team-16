import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

const server = new McpServer({
  name: 'gohan-ai',
  version: '1.0.0',
});

server.tool(
  'get_user_routine',
  'Get the active routine for a user, including all days and exercises',
  { user_id: z.string().describe('UUID of the user') },
  async ({ user_id }) => {
    const { data, error } = await getSupabase()
      .from('routines')
      .select(`
        id, name, is_active, created_at, updated_at,
        routine_days (
          id, day_of_week, muscle_groups, label,
          routine_exercises (
            id, exercise_name, sets, reps, weight_kg,
            rest_seconds, order_index, notes, ai_reasoning, completed
          )
        )
      `)
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'list_exercises_for_day',
  'List all exercises for a specific day of the week in the active routine',
  {
    user_id: z.string().describe('UUID of the user'),
    day_of_week: z.number().min(0).max(6).describe('0=Sunday, 1=Monday, ..., 6=Saturday'),
  },
  async ({ user_id, day_of_week }) => {
    const { data: routine } = await getSupabase()
      .from('routines')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (!routine) {
      return { content: [{ type: 'text' as const, text: 'No active routine found' }] };
    }

    const { data, error } = await getSupabase()
      .from('routine_days')
      .select(`
        id, day_of_week, muscle_groups, label,
        routine_exercises (
          id, exercise_name, sets, reps, weight_kg,
          rest_seconds, order_index, notes, completed
        )
      `)
      .eq('routine_id', routine.id)
      .eq('day_of_week', day_of_week)
      .single();

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'update_exercise',
  'Update an exercise in the routine (sets, reps, weight, notes)',
  {
    exercise_id: z.string().describe('UUID of the exercise'),
    sets: z.number().optional().describe('Number of sets'),
    reps: z.number().optional().describe('Number of reps'),
    weight_kg: z.number().nullable().optional().describe('Weight in kg'),
    notes: z.string().nullable().optional().describe('Notes or form cues'),
  },
  async ({ exercise_id, ...updates }) => {
    const cleanUpdates: Record<string, unknown> = {};
    if (updates.sets !== undefined) cleanUpdates.sets = updates.sets;
    if (updates.reps !== undefined) cleanUpdates.reps = updates.reps;
    if (updates.weight_kg !== undefined) cleanUpdates.weight_kg = updates.weight_kg;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;

    const { error } = await getSupabase()
      .from('routine_exercises')
      .update(cleanUpdates)
      .eq('id', exercise_id);

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: 'Exercise updated successfully' }] };
  }
);

server.tool(
  'add_exercise',
  'Add a new exercise to a specific day in the routine',
  {
    routine_day_id: z.string().describe('UUID of the routine day'),
    exercise_name: z.string(),
    sets: z.number().default(3),
    reps: z.number().default(10),
    weight_kg: z.number().nullable().optional(),
    rest_seconds: z.number().default(60),
    notes: z.string().nullable().optional(),
  },
  async ({ routine_day_id, ...exercise }) => {
    const { data: maxOrder } = await getSupabase()
      .from('routine_exercises')
      .select('order_index')
      .eq('routine_day_id', routine_day_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const { error } = await getSupabase().from('routine_exercises').insert({
      routine_day_id,
      ...exercise,
      order_index: (maxOrder?.order_index ?? -1) + 1,
    });

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: 'Exercise added successfully' }] };
  }
);

server.tool(
  'remove_exercise',
  'Remove an exercise from a routine day',
  {
    exercise_id: z.string().describe('UUID of the exercise to remove'),
  },
  async ({ exercise_id }) => {
    const { error } = await getSupabase()
      .from('routine_exercises')
      .delete()
      .eq('id', exercise_id);

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: 'Exercise removed successfully' }] };
  }
);

server.tool(
  'replace_exercise',
  'Replace an exercise with a new one, keeping the same position and day',
  {
    exercise_id: z.string().describe('UUID of the exercise to replace'),
    exercise_name: z.string().describe('Name of the new exercise'),
    sets: z.number().default(3),
    reps: z.number().default(10),
    weight_kg: z.number().nullable().optional(),
    rest_seconds: z.number().default(60),
    notes: z.string().nullable().optional(),
  },
  async ({ exercise_id, ...newExercise }) => {
    const { data: existing, error: fetchError } = await getSupabase()
      .from('routine_exercises')
      .select('routine_day_id, order_index')
      .eq('id', exercise_id)
      .single();

    if (fetchError || !existing) {
      return { content: [{ type: 'text' as const, text: `Error: exercise not found` }] };
    }

    const { error: deleteError } = await getSupabase()
      .from('routine_exercises')
      .delete()
      .eq('id', exercise_id);

    if (deleteError) {
      return { content: [{ type: 'text' as const, text: `Error: ${deleteError.message}` }] };
    }

    const { error: insertError } = await getSupabase()
      .from('routine_exercises')
      .insert({
        routine_day_id: existing.routine_day_id,
        order_index: existing.order_index,
        ...newExercise,
      });

    if (insertError) {
      return { content: [{ type: 'text' as const, text: `Error: ${insertError.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: 'Exercise replaced successfully' }] };
  }
);

server.tool(
  'get_user_profile',
  'Get a user profile including fitness level, injuries, equipment, and goals',
  { user_id: z.string().describe('UUID of the user') },
  async ({ user_id }) => {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'get_tenant_info',
  'Get branding and config for a gym tenant (colors, logo, name)',
  { tenant_slug: z.string().describe('Slug identifier for the tenant (e.g. "smartfit")') },
  async ({ tenant_slug }) => {
    const { data, error } = await getSupabase()
      .from('tenants')
      .select('*')
      .eq('slug', tenant_slug)
      .single();

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'list_tenant_users',
  'List all users that belong to a specific gym tenant',
  { tenant_slug: z.string().describe('Slug identifier for the tenant (e.g. "smartfit")') },
  async ({ tenant_slug }) => {
    const { data: tenant } = await getSupabase()
      .from('tenants')
      .select('id')
      .eq('slug', tenant_slug)
      .single();

    if (!tenant) {
      return { content: [{ type: 'text' as const, text: 'Tenant not found' }] };
    }

    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id, display_name, fitness_level, goals, training_days_per_week, onboarding_completed')
      .eq('tenant_id', tenant.id);

    if (error) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
