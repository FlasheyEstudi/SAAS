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

    let financialSnapshot = 'Sin datos disponibles.';
    
    // 1. Detección de saludos simples para respuesta instantánea
    const isSimpleGreeting = /^(hola|buenos dias|buenas tardes|que tal|saludos|hi|hello)$/i.test(message.trim());
    
    if (!isSimpleGreeting) {
      // 2. Obtener el snapshot financiero solo si es necesario y con tiempo límite estricto
      try {
        const snapshotPromise = getFinancialSnapshot(companyId);
        const timeoutPromise = new Promise<string>((resolve) => 
          setTimeout(() => resolve('Resumen no disponible por carga de sistema.'), 2000)
        );
        financialSnapshot = await Promise.race([snapshotPromise, timeoutPromise]);
      } catch (snapshotErr) {
        console.error('[AI-Chat] Error al obtener snapshot:', snapshotErr);
      }
    } else {
      financialSnapshot = 'El usuario te está saludando. Responde amablemente sin datos financieros aún.';
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
      // 1. Crear un canal de comunicación (ReadableStream)
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // 2. Responder inmediatamente con el stream abierto
      const response = new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked',
        },
      });

      // 3. Procesar la IA en "segundo plano" (sin bloquear la respuesta inicial)
      (async () => {
        let heartbeatInterval: NodeJS.Timeout | null = null;
        try {
          // Latido inicial para activar el proxy
          await writer.write(encoder.encode(' '));
          
          // Marcapasos: enviar un espacio cada 5 segundos para mantener viva la conexión
          heartbeatInterval = setInterval(async () => {
            try {
              await writer.write(encoder.encode(' '));
            } catch (e) {
              if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
          }, 5000);
          
          const ollamaStream = await chatWithOllamaStream(message, chatHistory, aiContext);
          
          // En cuanto tenemos el stream, detenemos el marcapasos manual
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          
          const reader = ollamaStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
          }
        } catch (err: any) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          console.error('[AI-Chat] Error en stream asíncrono:', err);
          // Si el writer aún está abierto, enviar el error
          try {
            await writer.write(encoder.encode(`\n\n{"error": "${err.message}"}`));
          } catch (e) {}
        } finally {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          try {
            await writer.close();
          } catch (e) {}
        }
      })();

      return response;
    }


    const result = await chatWithOllama(message, chatHistory, aiContext);
    return success({
      response: result.response,
      usedFallback: result.usedFallback,
      ollamaAvailable: true,
    });
  } catch (err: any) {
    console.error('[AI-Chat] ERROR FATAL:', {
      message: err.message,
      stack: err.stack,
      cause: err.cause
    });
    return serverError('Error en el motor de IA: ' + err.message);
  }
}
