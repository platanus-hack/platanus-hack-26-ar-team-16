// TODO: @Juampiman — implement tool handlers that write to Supabase
// These are called when Claude uses tool_use to modify routines

export async function handleCreateRoutine(
  _userId: string,
  _routineData: unknown
): Promise<{ success: boolean; routineId: string }> {
  throw new Error('Not implemented');
}

export async function handleUpdateExercise(
  _exerciseId: string,
  _updates: unknown
): Promise<{ success: boolean }> {
  throw new Error('Not implemented');
}

export async function handleReplaceExercise(
  _exerciseId: string,
  _newExercise: unknown
): Promise<{ success: boolean }> {
  throw new Error('Not implemented');
}

export async function handleExplainExercise(
  _exerciseId: string,
  _userId: string
): Promise<{ reasoning: string }> {
  throw new Error('Not implemented');
}
