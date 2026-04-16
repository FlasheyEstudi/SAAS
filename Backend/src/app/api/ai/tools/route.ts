import { success, serverError } from '@/lib/api-helpers';
import { AI_TOOLS } from '@/lib/ollama';

// ============================================================
// GET /api/ai/tools - Return available AI tool definitions
// Returns the AI_TOOLS array so the frontend can understand
// what function-calling capabilities the AI has.
// ============================================================

export async function GET() {
  try {
    return success({
      tools: AI_TOOLS,
      count: AI_TOOLS.length,
    });
  } catch (err) {
    console.error('Error fetching AI tools:', err);
    return serverError('Error al obtener las herramientas de IA');
  }
}
