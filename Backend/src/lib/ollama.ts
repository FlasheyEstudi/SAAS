// ============================================================
// AI CLIENT - Configuración para integración con LLM local
// ============================================================

import { executeAiTool } from './ai-tool-executor';

// Puerto y URL del servidor Ollama
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const AI_ENABLED = process.env.AI_ENABLED === 'true' || false;

// ============================================================
// TYPES
// ============================================================

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: OllamaResponse['message']['tool_calls'];
}

interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
    tool_calls?: Array<{
      function: {
        name: string;
        arguments: {
          [key: string]: unknown;
        };
      };
    }>;
  };
  done?: boolean;
  choices?: Array<{
    message: {
      role: string;
      content: string;
      tool_calls?: Array<{
        function: {
          name: string;
          arguments: {
            [key: string]: unknown;
          };
        };
      }>;
    };
  }>;
}/**
 * Extractor mejorado para formato XML y JSON manual
 */
function extractManualToolCall(text: string): OllamaResponse['message']['tool_calls'] {
  const cleaned = text.replace(/'/g, '"');
  
  // Buscar formato XML: <TOOL:name>{args}</TOOL>
  const xmlMatch = cleaned.match(/<TOOL:([a-zA-Z0-9_]+)>([\s\S]*?)<\/TOOL>/i);
  
  if (xmlMatch) {
    const name = xmlMatch[1];
    const argsStr = xmlMatch[2].trim();
    try {
      return [{
        function: {
          name,
          arguments: JSON.parse(argsStr)
        }
      }];
    } catch {
      // Si el JSON falla, buscamos llaves internas
      const nestedJson = argsStr.match(/\{[\s\S]*?\}/);
      if (nestedJson) {
        try {
          return [{
            function: { name, arguments: JSON.parse(nestedJson[0]) }
          }];
        } catch { /* ignore */ }
      }
    }
  }

  // Fallback a detección de JSON puro en el texto
  const jsonMatch = cleaned.match(/\{[\s\S]*?("name"|"function"|"target_view")[\s\S]*?\}/);
  if (!jsonMatch) return undefined;

  try {
    let block = jsonMatch[0];
    if (block.split('{').length > block.split('}').length) {
      block += '}'.repeat(block.split('{').length - block.split('}').length);
    }

    let parsed = JSON.parse(block);
    if (!Array.isArray(parsed)) parsed = [parsed];

    return parsed.map((item: any) => {
      const name = item.name || item.function || 'get_ledger_data';
      const args = item.parameters || item.arguments || item.params || item;
      return {
        function: {
          name: typeof name === 'string' ? name : (name.name || 'get_ledger_data'),
          arguments: typeof args === 'object' ? args : {},
        },
      };
    });
  } catch {
    return undefined;
  }
}

async function callOllamaAPI(messages: OllamaMessage[]): Promise<OllamaResponse> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      // Desactivamos herramientas nativas para modelos de 1B para evitar confusión
      // tools: AI_TOOLS, 
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[AI] Ollama API Error (${res.status}):`, body);
    throw new Error(`Ollama error: ${res.status} ${body}`);
  }

  const data = (await res.json()) as OllamaResponse;
  
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    return {
      model: data.model,
      message: data.choices[0].message as any,
      done: data.done ?? true,
    };
  }

  return data;
}

const SYSTEM_PROMPT = `Eres GANESHA, un asistente financiero experto.
Para consultar datos, DEBES generar un llamado a herramienta usando formato XML estricto que contenga JSON válido.

EJEMPLO 1 (Una sola empresa):
<TOOL:get_ledger_data>{"target_view": "balance_sheet", "consolidated": false}</TOOL>

EJEMPLO 2 (Empresas consolidadas):
<TOOL:get_ledger_data>{"target_view": "income_statement", "consolidated": true}</TOOL>

VISTAS PERMITIDAS en target_view: trial_balance, balance_sheet, income_statement, ar_aging, ap_aging, cash_flow.

REGLA DE ORO: Responde INMEDIATAMENTE con la etiqueta <TOOL>. Tu JSON interno no debe contener sintaxis como "true/false", solo "true" o "false". Nunca des explicaciones antes de usar la herramienta.`;
const AI_TOOLS: OllamaTool[] = [
  {
    type: 'function',
    function: {
      name: 'export_document',
      description: 'Exportar un documento de registros contables.',
      parameters: {
        type: 'object',
        properties: {
          report_type: { type: 'string', enum: ['balance_sheet', 'income_statement', 'trial_balance', 'ar_aging', 'cash_flow'] },
          period_start: { type: 'string', format: 'date' },
          period_end: { type: 'string', format: 'date' },
          format: { type: 'string', enum: ['pdf', 'xlsx', 'json'] },
          consolidated: { type: 'boolean' },
        },
        required: ['report_type', 'format'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ledger_data',
      description: 'Obtener datos de los registros de libros.',
      parameters: {
        type: 'object',
        properties: {
          target_view: { type: 'string', enum: ['trial_balance', 'balance_sheet', 'income_statement', 'ar_aging', 'ap_aging', 'cash_flow'] },
          year: { type: 'number' },
          month: { type: 'number' },
          query: { type: 'string' },
          consolidated: { type: 'boolean' },
        },
        required: ['target_view'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compute_stat',
      description: 'Calcular estadísticas de registros.',
      parameters: {
        type: 'object',
        properties: {
          metric_type: { type: 'string', enum: ['current_ratio', 'quick_ratio', 'debt_to_equity', 'gross_margin', 'net_margin'] },
          period: { type: 'string', description: 'YYYY-MM' },
        },
        required: ['metric_type'],
      },
    },
  },
];




async function isOllamaAvailable(): Promise<boolean> {
  if (!AI_ENABLED) {
    console.log('[AI] isOllamaAvailable: AI_ENABLED is false');
    return false;
  }
  try {
    const start = Date.now();
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const success = res.ok;
    console.log(`[AI] isOllamaAvailable: Connected to ${OLLAMA_URL} in ${Date.now() - start}ms. Success: ${success}`);
    return success;
  } catch (err: any) {
    console.log(`[AI] isOllamaAvailable: Failed to connect to ${OLLAMA_URL}. Error: ${err.message}`);
    return false;
  }
}


/**
 * Lista modelos disponibles en Ollama
 */
async function listModels(): Promise<string[]> {
  if (!AI_ENABLED) return [];
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}


/**
 * Sanitizador de objetos para JSON - maneja BigInt y Referencias Circulares
 */
function safeJsonStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
}

// ============================================================
// MAIN CHAT FUNCTION
// ============================================================

async function chatWithOllama(
  userMessage: string,
  chatHistory: OllamaMessage[] = [],
  companyId?: string
): Promise<{
  response: string;
  toolCalls?: OllamaResponse['message']['tool_calls'];
  usedFallback: boolean;
}> {
  if (AI_ENABLED) {
    const available = await isOllamaAvailable();
    if (available) {
      try {
        const messages: OllamaMessage[] = [
          {
            role: 'system',
            content: SYSTEM_PROMPT + (companyId ? `\n\nContexto: Empresa ID ${companyId}` : ''),
          },
          ...chatHistory.slice(-10),
          { role: 'user', content: userMessage },
        ];

        let iterations = 0;
        let lastResponse: OllamaResponse | null = null;

        while (iterations < 3) {
          const data: OllamaResponse = await callOllamaAPI(messages);
          lastResponse = data;
          
          let toolCalls = data.message?.tool_calls;

          // Fallback: Si no hay tool_calls nativos pero el contenido parece JSON
          if ((!toolCalls || toolCalls.length === 0) && data.message?.content) {
            const manualCalls = extractManualToolCall(data.message.content);
            if (manualCalls) {
              console.log('[AI] Manual tool call detected in text content');
              toolCalls = manualCalls;
            }
          }

          if (toolCalls && toolCalls.length > 0 && companyId) {
            messages.push({
              role: 'assistant',
              content: data.message.content || '',
              tool_calls: toolCalls
            });

            for (const tool of toolCalls) {
              try {
                console.log(`[AI] Executing tool: ${tool.function.name}`);
                const result = await executeAiTool(
                  tool.function.name,
                  tool.function.arguments,
                  companyId
                );

                messages.push({
                  role: 'tool',
                  content: safeJsonStringify(result)
                });
              } catch (toolErr) {
                console.error(`[AI] Error in tool ${tool.function.name}:`, toolErr);
                messages.push({
                  role: 'tool',
                  content: JSON.stringify({ error: 'Error interno ejecutando herramienta' })
                });
              }
            }

            iterations++;
            continue;
          }
          break;
        }


        if (!lastResponse) throw new Error('No response from Ollama');

        return {
          response: lastResponse.message?.content || 'No se pudo generar una respuesta final.',
          toolCalls: lastResponse.message?.tool_calls,
          usedFallback: false,
        };
      } catch (err) {
        console.error('[AI] Error in tool execution loop:', err);
      }
    }
  }

  return {
    response: generateFallbackResponse(userMessage),
    usedFallback: true,
  };
}

function generateFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('hola') || lowerMsg.includes('buenos días') || lowerMsg.includes('qué tal')) {
    return '¡Hola! Soy GANESHA, tu asistente contable. ¿En qué puedo ayudarte hoy?';
  }
  
  if (lowerMsg.includes('balance')) return '📊 Para ver el Balance General dirígete a Reportes > Balance General.';
  if (lowerMsg.includes('resultado')) return '📈 El Estado de Resultados está disponible en Reportes > Estado de Resultados.';

  if (lowerMsg.includes('balance') || lowerMsg.includes('general')) {
    return '📊 Para generar el Balance General, utiliza:\nGET /api/reports/balance-sheet?companyId={ID}&year=2024&month=1';
  }
  if (lowerMsg.includes('resultado') || lowerMsg.includes('pérdida') || lowerMsg.includes('ganancia')) {
    return '📈 Para ver el Estado de Resultados:\nGET /api/reports/income-statement?companyId={ID}&year=2024&month=1\nMuestra ingresos, gastos y utilidad neta del período.';
  }
  if (lowerMsg.includes('poliza') || lowerMsg.includes('póliza') || lowerMsg.includes('diario')) {
    return '📝 Para consultar pólizas:\nGET /api/journal-entries?companyId={ID}\nPuedes filtrar por período, estado (DRAFT/POSTED) y tipo.';
  }
  if (lowerMsg.includes('factura') || lowerMsg.includes('cxc') || lowerMsg.includes('cxp')) {
    return '🧾 Para facturas:\n• CxC: GET /api/invoices?companyId={ID}&invoiceType=SALE\n• CxP: GET /api/invoices?companyId={ID}&invoiceType=PURCHASE\n• Antigüedad: GET /api/invoices/aging?companyId={ID}';
  }
  if (lowerMsg.includes('banco') || lowerMsg.includes('concilia')) {
    return '🏦 Para conciliación bancaria:\n1. GET /api/bank-movements?bankAccountId={ID}&status=PENDING\n2. POST /api/bank-movements/reconcile';
  }
  if (lowerMsg.includes('cuenta') || lowerMsg.includes('plan')) {
    return '📋 Plan de Cuentas:\n• Árbol completo: GET /api/accounts/tree?companyId={ID}\n• Buscar: GET /api/accounts/search?companyId={ID}&query=banco';
  }
  if (lowerMsg.includes('kpi') || lowerMsg.includes('dashboard') || lowerMsg.includes('resumen')) {
    return '📈 Dashboard:\n• KPIs: GET /api/dashboard/kpis?companyId={ID}\n• Posición de caja: GET /api/dashboard/cash-positions?companyId={ID}\n• Tendencias: GET /api/dashboard/expense-trends?companyId={ID}';
  }
  if (lowerMsg.includes('balanza') || lowerMsg.includes('comprobación')) {
    return '⚖️ Balanza de Comprobación:\nGET /api/reports/trial-balance?companyId={ID}&year=2024&month=1\nMuestra saldos deudores y acreedores por cuenta.';
  }
  if (lowerMsg.includes('flujo') || lowerMsg.includes('efectivo')) {
    return '💰 Flujo de Efectivo:\nGET /api/reports/cash-flow?companyId={ID}&year=2024&month=1';
  }
  if (lowerMsg.includes('iva') || lowerMsg.includes('impuesto') || lowerMsg.includes('fiscal')) {
    return '🏦 Reportes Fiscales:\n• Resumen IVA: GET /api/tax/reports/iva-summary?companyId={ID}&year=2024&month=1\n• DIOT: GET /api/tax/reports/diot?companyId={ID}&year=2024&month=1\n• Retenciones: GET /api/tax/reports/withholding?companyId={ID}&year=2024&month=1';
  }
  if (lowerMsg.includes('activo') || lowerMsg.includes('depreciacion') || lowerMsg.includes('depreciación')) {
    return '🏭 Activos Fijos:\n• Resumen: GET /api/fixed-assets/summary?companyId={ID}\n• Depreciar: POST /api/fixed-assets/bulk-depreciate?companyId={ID}&year=2024&month=1';
  }
  if (lowerMsg.includes('presupuesto') || lowerMsg.includes('budget')) {
    return '📋 Presupuestos:\n• vs Real: GET /api/budgets/report?companyId={ID}&year=2024&month=1\n• Varianza: GET /api/budgets/variance?companyId={ID}&year=2024&month=1';
  }

  return `🤖 Modo de Respaldo Contable
(La conexión con la IA de Llama no se pudo establecer localmente).

Tu consulta: "${message}"

Para activar el motor de IA Avanzado:
• Hemos configurado todo el código para ti, pero el motor principal está desconectado.
• Por favor abre tu terminal y escribe: "sudo systemctl start ollama"
• Una vez ejecutado, este chat se volverá inteligente automáticamente.

Mientras tanto, en este Modo de Respaldo puedo guiarte con consultas con palabras clave. Por ejemplo, intenta escribir "mostrar el balance general" o "ver facturas vencidas". ¿Qué necesitas?`;
}

export { 
  OLLAMA_URL, 
  OLLAMA_MODEL, 
  AI_TOOLS, 
  SYSTEM_PROMPT, 
  isOllamaAvailable, 
  listModels, 
  chatWithOllama 
};
export type { OllamaMessage, OllamaTool, OllamaResponse };
