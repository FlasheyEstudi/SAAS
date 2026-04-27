import { success, error, serverError, validateAuth, requireAuth, requireCompanyAccess } from '@/lib/api-helpers';
import { chatWithOllama, isOllamaAvailable, AI_TOOLS, OLLAMA_MODEL } from '@/lib/ollama';
import type { OllamaMessage } from '@/lib/ollama';

// ============================================================
// POST /api/ai/chat - AI chat endpoint (Ollama Llama 3.2:1b)
// Body: { message: string, companyId: string, history?: OllamaMessage[] }
//
// Connects to the local Ollama instance running Llama 3.2:1b.
// Returns AI response with optional tool calls for the frontend.
// Falls back to keyword-based guidance when Ollama is offline.
// ============================================================

import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    const { message, companyId, history } = body;

    if (!message || typeof message !== 'string') {
      return error('El mensaje es obligatorio');
    }

    if (!companyId || typeof companyId !== 'string') {
      return error('El companyId es obligatorio');
    }

    // SEGURIDAD CRÍTICA: Validar que el usuario tenga acceso a esta empresa
    const companyError = requireCompanyAccess(user!, companyId);
    if (companyError) return companyError;

    // Obtener detalles de la empresa para inyectar como contexto
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true, taxId: true }
    });

    const aiContext = {
      companyId: companyId,
      companyName: company?.name || 'Empresa',
      companyTaxId: company?.taxId || 'N/A',
      userId: user!.id,
      userName: user!.name,
      userRole: user!.role,
      currentDate: new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };

    // Validate history array if provided
    let chatHistory: OllamaMessage[] = [];
    if (Array.isArray(history)) {
      chatHistory = history.filter(
        (msg: unknown) =>
          msg &&
          typeof msg === 'object' &&
          ['system', 'user', 'assistant', 'tool'].includes((msg as OllamaMessage).role) &&
          typeof (msg as OllamaMessage).content === 'string'
      );
    }

    // Check Ollama availability in parallel with the chat request
    const [ollamaAvailable, result] = await Promise.all([
      isOllamaAvailable(),
      chatWithOllama(message, chatHistory, aiContext),
    ]);

    const responseData: {
      response: string;
      toolCalls?: typeof result.toolCalls;
      usedFallback: boolean;
      ollamaAvailable: boolean;
      model: string;
      tools?: typeof AI_TOOLS;
    } = {
      response: result.response,
      usedFallback: result.usedFallback,
      ollamaAvailable,
      model: OLLAMA_MODEL,
    };

    // Include tool calls if the model returned them
    if (result.toolCalls && result.toolCalls.length > 0) {
      responseData.toolCalls = result.toolCalls;
      // Return tool definitions so the frontend can render them
      responseData.tools = AI_TOOLS;
    }

    return success(responseData);
  } catch (err) {
    console.error('Error in AI chat endpoint:', err);
    return serverError('Error al procesar la solicitud de IA');
  }
}
