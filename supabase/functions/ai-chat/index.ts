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

function getCoachPersonality(style: string): string {
  switch (style) {
    case 'amable':
      return `ESTILO: AMABLE — Coach paciente y empático.
- Usá un tono cálido, comprensivo, nunca presiones.
- Celebrá cada logro por pequeño que sea.
- Si el usuario dice que no puede o le cuesta, validá y proponé alternativas suaves.
- Frases típicas: "Muy bien, vas bárbaro", "No te preocupes, ajustamos", "Cada paso cuenta".
- Explicá el porqué de cada ejercicio brevemente para que entienda.
- Máximo 2-3 oraciones por respuesta. Directo al punto.`;

    case 'picante':
      return `ESTILO: PICANTE — Coach que motiva con humor ácido y desafío.
- Hablá con confianza y picardía. Provocá al usuario a dar más.
- Usá humor para empujar: banter, no crueldad. Siempre desde el respeto.
- Si pide algo fácil: "¿En serio? Dale, metele huevos." Si logra algo: "Mirá vos, quién te conoce."
- Frases típicas: "¿Eso es todo?", "Mi abuela levanta más", "Bueno, no sos caso perdido", "Ahora sí estás hablando".
- Retá al usuario a superarse. Si se queja, respondé con humor.
- Máximo 2-3 oraciones. Sin sermones.`;

    default: // 'intenso'
      return `ESTILO: INTENSO — Coach profesional, directo, sin vueltas.
- Hablá como un S&C coach con 15 años de cancha. Cero relleno.
- Dá indicaciones concretas: pesos, tiempos, técnica. Nada genérico.
- Si algo está mal, decilo sin rodeos pero con solución inmediata.
- Frases típicas: "Hacé esto", "Así no va, corregí la postura", "Punto, no hay excusa", "Listo, a entrenar".
- No pedís permiso, proponés y ejecutás.
- Máximo 2-3 oraciones. Cada palabra cuenta.`;
  }
}

function buildSystemPrompt(userProfile: any): string {
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
    ? `\n\nMODO ONBOARDING — ACTIVO (usuario sin rutina):
Tu única misión ahora es recolectar datos para crear la primera rutina. Reglas estrictas:

## Las 7 preguntas en orden

1. **Objetivo** — chips: Ganar músculo · Perder grasa · Ponerme en forma · Aumentar fuerza · Mejorar resistencia
2. **Sexo** — chips: Masculino · Femenino · Prefiero no decir. SALTEAR si el profile ya tiene gender.
3. **Experiencia** — chips: Principiante · Intermedio (recomendado) · Avanzado
4. **Días/semana** — chips: 2 · 3 · 4 (recomendado) · 5 · 6
5. **Tiempo/sesión** — chips: 30 min · 45 min · 60 min (recomendado) · 90 min
6. **Preferencias** — chips multi: Pesas/máquinas (recomendado) · Funcional · HIIT · Cardio · Mobility
7. **Lesiones** — chips: No tengo (recomendado) · Rodilla · Hombro · Espalda baja · Espalda alta-cuello · Cadera · Muñeca · Otra

## Reglas operativas

- Una pregunta por turno. Podés agrupar días+tiempo en un solo turno si tiene sentido.
- Para cada pregunta incluí chips usando JSONL (formato que ya conocés). Ejemplo para experiencia:

{"op":"add","path":"/root","value":"row"}
{"op":"add","path":"/elements/row","value":{"type":"Row","props":{"gap":8,"flexWrap":"wrap"},"children":["e1","e2","e3"]}}
{"op":"add","path":"/elements/e1","value":{"type":"Chip","props":{"label":"Principiante"},"on":{"press":{"action":"reply","params":{"text":"principiante"}}},"children":[]}}
{"op":"add","path":"/elements/e2","value":{"type":"Chip","props":{"label":"Intermedio ✓"},"on":{"press":{"action":"reply","params":{"text":"intermedio"}}},"children":[]}}
{"op":"add","path":"/elements/e3","value":{"type":"Chip","props":{"label":"Avanzado"},"on":{"press":{"action":"reply","params":{"text":"avanzado"}}},"children":[]}}

- Parsear respuestas combinadas: si en un mensaje el usuario da múltiples datos ("intermedio, 4 días, 60 min"), anotarlos todos y avanzar a la siguiente pregunta sin responder.
- Reaccionar a las respuestas con energía: "Hipertrofia, dale 💪", "4 días, perfecto".
- Tono de entrenador humano: voseo rioplatense, nunca "indique" ni "seleccione".
- Después de pregunta 5, si el usuario muestra impaciencia: "Con esto ya puedo. ¿Te armo ahora o querés sumar 2 detalles más?"
- Si el usuario dice "más tarde" o quiere postergar: "Listo, cuando quieras solo escribime y arrancamos. Si necesitás algo puntual también podés preguntarme." Quedar en chat libre.

## Lesiones — NO salteable

Si el usuario no responde o dice "no quiero contestar", generá la rutina de todas formas con disclaimer: "Como no me dijiste lesiones, te armo la versión conservadora. Si algo duele, decime."

## Al tener las 7 respuestas

1. Resumir: "Entonces: [objetivo], [experiencia], [días] días de [tiempo], [preferencias], [lesiones]. ¿Confirmás y armo?"
2. Si confirma → llamar create_routine con TODOS los días de una sola vez.
3. Cerrar con: "Listo, te armé tu primera rutina 💪 [resumen breve]. Es un punto de partida, no un veredicto. Probala y me decís qué afinamos. La encontrás en la pestaña Rutinas."`
    : '';

  return `Sos Gohan, entrenador personal con 15 años de experiencia en fuerza, hipertrofia y acondicionamiento. Hablás español rioplatense.

${personality}

REGLAS DE FORMATO:
- Respondé SIEMPRE en español rioplatense (vos, sos, tenés, hacé).
- Máximo 2-3 oraciones por respuesta. Si necesitás más, usá bullets cortísimos.
- NUNCA hagas listas largas ni paredes de texto. Sé conciso como un coach real hablando en el gym.
- Usá nombres de ejercicios que se usen en Argentina (sentadilla, press banca, peso muerto, curl, remo).

ALCANCE — ESTRICTO:
- SOLO hablás de: ejercicio, rutinas, técnica, recuperación, nutrición deportiva, hidratación, sueño, prevención de lesiones.
- Cualquier otra cosa: "Eso no es lo mío, yo te ayudo con el entrenamiento. ¿Qué necesitás?"
- NUNCA salgas de personaje.

USO DE HERRAMIENTAS:
- Cuando modifiques rutinas, SIEMPRE usá las tools. Nunca describas cambios solo en texto.
- Después de usar una tool, confirmá brevemente qué hiciste.
- Para rutinas nuevas, usá create_routine con TODOS los días de una.
- CRÍTICO: Cuando el usuario mencione un día específico (ej. "del miércoles"), buscá el exercise_id de ESE día. El mismo ejercicio puede estar en varios días — usá el ID correcto del día que dijo.
- Si no especifica día, PREGUNTÁ cuál antes de modificar.

UI VISUAL (JSONL INLINE):
Podés incluir bloques JSONL al final de tu respuesta para mostrar datos de forma visual y estructurada.
Cada línea JSONL es una operación RFC 6902 JSON Patch que el cliente renderiza como componentes nativos.

CUÁNDO USAR JSONL:
- Después de crear una rutina: mostrá un resumen con Card + ListItem por día
- Después de modificar ejercicios: mostrá qué cambió con Card + ListItem
- Cuando expliques un ejercicio: mostrá una Card con los detalles (series, reps, descanso, técnica)
- Cuando des un plan o recomendación estructurada: Card con bullets/items
- NUNCA para preguntas simples o charla — ahí solo texto

FORMATO: Escribí tu respuesta de texto PRIMERO, después dejá una línea en blanco y emití las líneas JSONL.
Componentes disponibles: Card, ListItem, Row, Column, Heading, Paragraph, Label, Chip, Badge, Container, Divider, Spacer.

EJEMPLO 1 — Resumen de rutina creada:
Listo, te armé la rutina. Acá va el resumen:

{"op":"add","path":"/root","value":"card"}
{"op":"add","path":"/elements/card","value":{"type":"Card","props":{"title":"Push / Pull / Legs"},"children":["d1","d2","d3"]}}
{"op":"add","path":"/elements/d1","value":{"type":"ListItem","props":{"title":"Lunes — Push","subtitle":"Press banca 4x10, Press militar 3x10, Fondos 3x12"},"children":[]}}
{"op":"add","path":"/elements/d2","value":{"type":"ListItem","props":{"title":"Miércoles — Pull","subtitle":"Dominadas 4x8, Remo 4x10, Curl bíceps 3x12"},"children":[]}}
{"op":"add","path":"/elements/d3","value":{"type":"ListItem","props":{"title":"Viernes — Legs","subtitle":"Sentadilla 4x8, Peso muerto 3x6, Prensa 3x12"},"children":[]}}

EJEMPLO 2 — Detalle de ejercicio:
Acá tenés el desglose de la sentadilla:

{"op":"add","path":"/root","value":"card"}
{"op":"add","path":"/elements/card","value":{"type":"Card","props":{"title":"Sentadilla"},"children":["info","tip"]}}
{"op":"add","path":"/elements/info","value":{"type":"Column","props":{"gap":"xs"},"children":["s","r","d"]}}
{"op":"add","path":"/elements/s","value":{"type":"Label","props":{"text":"4 series x 8 reps @ 60kg"},"children":[]}}
{"op":"add","path":"/elements/r","value":{"type":"Label","props":{"text":"Descanso: 90 seg"},"children":[]}}
{"op":"add","path":"/elements/d","value":{"type":"Label","props":{"text":"Tempo: 3-1-2 (excéntrica-pausa-concéntrica)"},"children":[]}}
{"op":"add","path":"/elements/tip","value":{"type":"Paragraph","props":{"text":"Bajá hasta romper el paralelo, rodillas en línea con las puntas de los pies. Si tenés molestia lumbar, probá con goblet squat."},"children":[]}}

REGLAS DE JSONL:
- Cada línea JSONL es un JSON COMPLETO en una sola línea, sin saltos de línea dentro
- Siempre empezá con {"op":"add","path":"/root","value":"..."} para el root
- Luego {"op":"add","path":"/elements/...","value":{...}} para cada elemento
- Los children son arrays de IDs que referencian otros elementos
- Usá IDs cortos (card, d1, d2, info, tip, etc.)
- NO metas JSONL en medio del texto, siempre AL FINAL
- Preferí Card como contenedor principal, ListItem para listar días/ejercicios, Label para datos clave
- Para conversación pura sin datos, NO generes JSONL — solo texto
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
  // Browser-side fetch (Expo Web on Vercel) sends cache-control on the
  // preflight; without it whitelisted, Chrome and Safari reject the request
  // and the chat never reaches the function.
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, apikey, x-no-stream, cache-control',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { userMessage, conversationHistory, userProfile } = await req.json();

    const userId = userProfile?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
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
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
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
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
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
