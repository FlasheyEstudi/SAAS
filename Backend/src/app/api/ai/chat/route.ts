import { success, error, serverError, validateAuth, requireAuth, requireCompanyAccess } from '@/lib/api-helpers';
import { chatWithOllama, isOllamaAvailable, chatWithOllamaStream } from '@/lib/ollama';
import { db } from '@/lib/db';
import { getFinancialSnapshot } from '@/services/financial-reports.service';

export async function POST(request: Request) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;


    const body = await request.json();
    const { message, companyId, history, stream = false } = body;

    if (!message || typeof message !== 'string') return error('El mensaje es obligatorio');
    if (!companyId || typeof companyId !== 'string') return error('El companyId es obligatorio');

    const companyError = requireCompanyAccess(user!, companyId);
    if (companyError) {

      return companyError;
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true, taxId: true }
    });

    let financialSnapshot = 'Sin datos disponibles en este momento.';
    try {
      financialSnapshot = await getFinancialSnapshot(companyId);
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
      const ollamaStream = await chatWithOllamaStream(message, chatHistory, aiContext);
      return new Response(ollamaStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }


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
