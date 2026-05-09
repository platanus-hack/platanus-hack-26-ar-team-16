export const COACH_TOOLS = [
  {
    name: 'create_routine',
    description:
      'Create a complete workout routine for the user. Use this when the user needs a new routine or wants to start fresh. Include all training days with their exercises.',
    input_schema: {
      type: 'object' as const,
      properties: {
        routine_name: {
          type: 'string',
          description: 'Name for the routine, e.g. "Rutina de Hipertrofia 4 días"',
        },
        days: {
          type: 'array',
          description: 'Array of training days',
          items: {
            type: 'object',
            properties: {
              day_of_week: {
                type: 'number',
                description: '0=Sunday, 1=Monday, ..., 6=Saturday',
              },
              muscle_groups: {
                type: 'array',
                items: { type: 'string' },
                description: 'Muscle groups trained this day, e.g. ["chest", "triceps"]',
              },
              label: {
                type: 'string',
                description: 'Human-readable label, e.g. "Pecho y Tríceps"',
              },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exercise_name: { type: 'string' },
                    sets: { type: 'number' },
                    reps: { type: 'number' },
                    weight_kg: {
                      type: 'number',
                      nullable: true,
                      description: 'Weight in kg, null if bodyweight',
                    },
                    rest_seconds: { type: 'number', description: 'Rest between sets in seconds' },
                    notes: {
                      type: 'string',
                      nullable: true,
                      description: 'Form cues or notes for the user',
                    },
                    ai_reasoning: {
                      type: 'string',
                      description:
                        'Why this exercise was chosen for THIS user (considering their level, goals, injuries, equipment)',
                    },
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
    description:
      'Update an existing exercise in the routine (change sets, reps, weight, notes). Use when the user wants to adjust a specific exercise.',
    input_schema: {
      type: 'object' as const,
      properties: {
        exercise_id: { type: 'string', description: 'UUID of the exercise to update' },
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
    description:
      'Replace an exercise with a different one. Use when the user finds an exercise uncomfortable, painful, or wants an alternative. Always explain why the replacement is better.',
    input_schema: {
      type: 'object' as const,
      properties: {
        exercise_id: { type: 'string', description: 'UUID of the exercise to replace' },
        new_exercise: {
          type: 'object',
          properties: {
            exercise_name: { type: 'string' },
            sets: { type: 'number' },
            reps: { type: 'number' },
            weight_kg: { type: 'number', nullable: true },
            rest_seconds: { type: 'number' },
            notes: { type: 'string', nullable: true },
            ai_reasoning: {
              type: 'string',
              description: 'Why this replacement was chosen considering the user situation',
            },
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
      type: 'object' as const,
      properties: {
        routine_day_id: { type: 'string', description: 'UUID of the routine day' },
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
    description:
      'Remove an exercise from the routine. Use when the user explicitly asks to remove an exercise.',
    input_schema: {
      type: 'object' as const,
      properties: {
        exercise_id: { type: 'string', description: 'UUID of the exercise to remove' },
      },
      required: ['exercise_id'],
    },
  },
] as const;
