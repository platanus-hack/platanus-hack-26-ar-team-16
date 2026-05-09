// Mock streaming reply until @Juampiman wires the real CoachEngine
// from src/modules/ai/. Contract: AsyncIterable<string> of incremental tokens.

const SAMPLE_REPLIES = [
  'Buenísimo. Para arrancar contame: ¿qué experiencia tenés con el entrenamiento de fuerza?',
  'Listo. Te armo una rutina de 4 días con foco en hipertrofia. Mirá la pestaña Rutina, se actualiza sola.',
  'Si te molesta el hombro, podemos cambiar el press militar por press con mancuerna en banco inclinado.',
  'Para tu objetivo te recomiendo 3-4 días de entrenamiento con énfasis en compuestos. ¿Tenés acceso a barra y mancuernas?',
];

export async function* mockStreamReply(_userText: string): AsyncIterable<string> {
  const reply = SAMPLE_REPLIES[Math.floor(Math.random() * SAMPLE_REPLIES.length)] ?? '';
  // Stream a few characters at a time to feel like real LLM tokens.
  const chunkSize = 3;
  for (let i = 0; i < reply.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, 35));
    yield reply.slice(i, i + chunkSize);
  }
}
