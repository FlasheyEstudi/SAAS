import { success, error, serverError, validateAuth, requireAuth, requireCompanyAccess } from '@/lib/api-helpers';
import { chatWithOllama, isOllamaAvailable, chatWithOllamaStream } from '@/lib/ollama';
import { db } from '@/lib/db';
import { getFinancialSnapshot } from '@/services/financial-reports.service';

export async function POST(request: Request) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    console.log('[AI-Chat] Iniciando solicitud para usuario:', user!.email);
    const body = await request.json();
    const { message, companyId, history, stream = false } = body;

    if (!message || typeof message !== 'string') return error('El mensaje es obligatorio');
    if (!companyId || typeof companyId !== 'string') return error('El companyId es obligatorio');

    const companyError = requireCompanyAccess(user!, companyId);
    if (companyError) {
      console.log('[AI-Chat] Error de acceso a empresa:', companyId);
      return companyError;
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true, taxId: true }
    });

    let financialSnapshot = 'Sin datos disponibles en este momento.';
    try {
      console.log('[AI-Chat] Obteniendo snapshot financiero...');
      financialSnapshot = await getFinancialSnapshot(companyId);
      console.log('[AI-Chat] Snapshot obtenido con éxito.');
    } catch (snapshotErr) {
      console.error('[AI-Chat] Error getting financial snapshot:', snapshotErr);
    }

    const aiContext = {
      companyId: companyId,
      companyName: company?.name || 'Empresa',
      companyTaxId: company?.taxId || 'N/A',
      userId: user!.id,
      userName: user!.name,
      userRole: user!.role,
      currentDate: new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      financialSnapshot
    };

    // Validate history
    let chatHistory: any[] = [];
    if (Array.isArray(history)) {
      chatHistory = history.filter(msg => msg && typeof msg === 'object' && msg.role && msg.content);
    }

    if (stream) {
      console.log('[AI-Chat] Iniciando flujo streaming con Ollama...');
      const ollamaStream = await chatWithOllamaStream(message, chatHistory, aiContext);
      console.log('[AI-Chat] Flujo de streaming iniciado correctamente.');
      return new Response(ollamaStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    console.log('[AI-Chat] Iniciando chat síncrono...');
    const result = await chatWithOllama(message, chatHistory, aiContext);
    return success({
      response: result.response,
      usedFallback: result.usedFallback,
      ollamaAvailable: true,
    });
  } catch (err: any) {
    console.error('[AI-Chat] Error FATAL en el chat:', err);
    return serverError('Error al procesar solicitud: ' + err.message);
  }
}
