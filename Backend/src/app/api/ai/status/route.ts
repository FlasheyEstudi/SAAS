import { success, serverError } from '@/lib/api-helpers';
import { isOllamaAvailable, OLLAMA_URL, OLLAMA_MODEL, listModels } from '@/lib/ollama';

// ============================================================
// GET /api/ai/status - Check Ollama service status
// Returns: { ollamaAvailable, model, url, loadedModels }
// ============================================================

export async function GET() {
  try {
    const [ollamaAvailable, loadedModels] = await Promise.all([
      isOllamaAvailable(),
      listModels(),
    ]);

    return success({
      ollamaAvailable,
      model: OLLAMA_MODEL,
      url: OLLAMA_URL,
      loadedModels,
    });
  } catch (err) {
    console.error('Error checking Ollama status:', err);
    return serverError('Error al verificar el estado de Ollama');
  }
}
