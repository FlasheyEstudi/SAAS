import { success, serverError } from '@/lib/api-helpers';
import { listModels, isOllamaAvailable } from '@/lib/ollama';

// ============================================================
// GET /api/ai/models - List available Ollama models
// Returns: { ollamaAvailable, models: string[] }
// ============================================================

export async function GET() {
  try {
    const [ollamaAvailable, models] = await Promise.all([
      isOllamaAvailable(),
      listModels(),
    ]);

    return success({
      ollamaAvailable,
      models,
    });
  } catch (err) {
    console.error('Error listing Ollama models:', err);
    return serverError('Error al listar modelos de Ollama');
  }
}
