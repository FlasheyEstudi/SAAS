// ============================================================
// AI CLIENT - Configuración para integración con LLM local
// ============================================================
//
// ESTE ARCHIVO ES UN PLACEHOLDER / TEMPLATE
//
// Cuando esté listo para conectar la IA local (Ollama con Llama 3.2:1b),
// simplemente descomenta la sección "CONEXIÓN ACTIVA" más abajo
// y configura las variables de entorno en .env.local:
//
//   OLLAMA_URL=http://localhost:11434    <-- Puerto por defecto de Ollama
//   OLLAMA_MODEL=llama3.2:1b            <-- Modelo a usar
//
// Para iniciar Ollama (en Linux):
//   curl -fsSL https://ollama.com/install.sh | sh
//   ollama pull llama3.2:1b
//   ollama run llama3.2:1b   <-- esto inicia el servidor en puerto 11434
//
// Mientras Ollama no esté corriendo, el sistema funciona en modo
// FALLBACK con respuestas basadas en keywords.
// ============================================================

// ============================================================
// CONFIGURACIÓN - Cambia estas variables según tu entorno
// ============================================================

// Puerto y URL del servidor Ollama (por defecto: 11434)
// Si usas otro puerto, cámbialo aquí o en la variable de entorno
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'; // <-- PUERTO DE OLLAMA

// Modelo LLM a utilizar
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b'; // <-- MODELO

// Flag para activar/desactivar la conexión con Ollama
// Cambiar a 'true' cuando Ollama esté instalado y corriendo
const AI_ENABLED = process.env.AI_ENABLED === 'true' || false; // <-- ACTIVAR IA

// ============================================================
// TYPES
// ============================================================

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
  done: boolean;
}

// ============================================================
// SYSTEM PROMPT - Prompt del asistente contable
// Este prompt se envía al LLM como instrucción del sistema
// ============================================================

const SYSTEM_PROMPT = `Eres GANESHA, un asistente contable experto. Ayudas a los usuarios con:
- Estados financieros (Balance General, Estado de Resultados, Flujo de Efectivo)
- Análisis de saldos y movimientos contables
- Interpretación de reportes financieros
- Consultas sobre cuentas, pólizas, facturas, y conciliación bancaria
- Generación de reportes y resúmenes
- Cálculos de depreciación y provisiones
- Consultas fiscales (SAT/DGI, IVA, ISR, DIOT)

Siempre responde en español de forma profesional, cálida y pedagógica.
Usa formato Markdown (tablas para cifras, listas para pasos).
Nunca inventes cifras; si no hay datos, dilo claramente.
No ejecutes escrituras (crear/borrar) directamente; guía al usuario para hacerlo.
Si el usuario pide un reporte, usa la herramienta request_report_download.
Si el usuario pregunta sobre datos financieros, usa query_financial_data.
Si no estás seguro, pide más información.`;

// ============================================================
// AI TOOLS - Herramientas disponibles para Function Calling
// El LLM puede invocar estas herramientas para obtener datos
// del sistema contable (solo lectura a través de SQL views)
// ============================================================

const AI_TOOLS: OllamaTool[] = [
  {
    type: 'function',
    function: {
      name: 'request_report_download',
      description:
        'Genera y descarga un reporte financiero. Úsalo cuando el usuario pida un reporte, balance, estado de resultados, etc.',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            enum: [
              'balance_sheet',
              'income_statement',
              'trial_balance',
              'ar_aging',
              'cash_flow',
              'general_ledger',
              'comparative',
            ],
            description: 'Tipo de reporte a generar',
          },
          period_start: {
            type: 'string',
            format: 'date',
            description: 'Fecha inicio YYYY-MM-DD',
          },
          period_end: {
            type: 'string',
            format: 'date',
            description: 'Fecha fin YYYY-MM-DD',
          },
          format: {
            type: 'string',
            enum: ['pdf', 'xlsx', 'json'],
            description: 'Formato de salida',
          },
        },
        required: ['report_type', 'period_start', 'period_end', 'format'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_financial_data',
      description:
        'Consulta datos financieros específicos. Úsalo para responder preguntas sobre saldos, totales, comparaciones.',
      parameters: {
        type: 'object',
        properties: {
          target_view: {
            type: 'string',
            enum: [
              'trial_balance',
              'balance_sheet',
              'income_statement',
              'ar_aging',
              'ap_aging',
              'cash_flow',
            ],
            description: 'Vista de datos a consultar',
          },
          query: {
            type: 'string',
            description:
              'Consulta en lenguaje natural, ej: "saldo de bancos", "total de ventas"',
          },
        },
        required: ['target_view', 'query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_metric',
      description:
        'Calcula métricas financieras como ratios, variaciones, porcentajes.',
      parameters: {
        type: 'object',
        properties: {
          metric_type: {
            type: 'string',
            enum: [
              'current_ratio',
              'quick_ratio',
              'debt_to_equity',
              'gross_margin',
              'net_margin',
              'roi',
              'accounts_receivable_turnover',
              'inventory_turnover',
            ],
            description: 'Tipo de métrica a calcular',
          },
          period: {
            type: 'string',
            description: 'Período en formato YYYY-MM',
          },
        },
        required: ['metric_type'],
      },
    },
  },
];

// ============================================================
// CONEXIÓN ACTIVA A OLLAMA
// ============================================================
//
// DESCOMENTA esta sección cuando tengas Ollama corriendo:
//
// async function callOllamaAPI(
//   messages: OllamaMessage[]
// ): Promise<OllamaResponse> {
//   // Hacemos la llamada HTTP al endpoint de chat de Ollama
//   // URL: http://localhost:11434/api/chat  <-- CAMBIA EL PUERTO AQUÍ SI ES NECESARIO
//   //
//   // Ejemplo de body:
//   // {
//   //   "model": "llama3.2:1b",
//   //   "messages": [
//   //     { "role": "system", "content": "<SYSTEM_PROMPT>" },
//   //     { "role": "user", "content": "¿Cuál es el balance general?" }
//   //   ],
//   //   "stream": false,
//   //   "tools": [<AI_TOOLS>]
//   // }
//
//   const res = await fetch(`${OLLAMA_URL}/api/chat`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       model: OLLAMA_MODEL,
//       messages,
//       stream: false,
//       tools: AI_TOOLS,
//     }),
//     signal: AbortSignal.timeout(60000),
//   });
//
//   if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
//   return await res.json();
// }
//
// async function checkOllamaHealth(): Promise<boolean> {
//   try {
//     const res = await fetch(`${OLLAMA_URL}/api/tags`, {
//       signal: AbortSignal.timeout(3000),
//     });
//     return res.ok;
//   } catch {
//     return false;
//   }
// }
//
// async function getOllamaModels(): Promise<string[]> {
//   try {
//     const res = await fetch(`${OLLAMA_URL}/api/tags`, {
//       signal: AbortSignal.timeout(5000),
//     });
//     const data = await res.json();
//     return data.models?.map((m: { name: string }) => m.name) || [];
//   } catch {
//     return [];
//   }
// }
//
// ============================================================

// ============================================================
// FUNCIONES PÚBLICAS (modo FALLBACK activo por defecto)
// ============================================================

/**
 * Verifica si Ollama está disponible
 * Cuando AI_ENABLED=false o Ollama no responde, retorna false
 */
export async function isOllamaAvailable(): Promise<boolean> {
  if (!AI_ENABLED) return false;

  // DESCOMENTA cuando actives la conexión:
  // return await checkOllamaHealth();

  return false; // <-- Siempre false en modo placeholder
}

/**
 * Lista modelos disponibles en Ollama
 */
export async function listModels(): Promise<string[]> {
  if (!AI_ENABLED) return [];

  // DESCOMENTA cuando actives la conexión:
  // return await getOllamaModels();

  return []; // <-- Lista vacía en modo placeholder
}

/**
 * Chat principal con el LLM
 * En modo FALLBACK: genera respuestas basadas en keywords del mensaje
 * En modo ACTIVO: envía el mensaje a Ollama y retorna la respuesta del LLM
 *
 * @param userMessage - Mensaje del usuario
 * @param chatHistory - Historial de conversación (últimos 10 mensajes)
 * @param companyId - ID de la empresa para contexto
 */
export async function chatWithOllama(
  userMessage: string,
  chatHistory: OllamaMessage[] = [],
  companyId?: string
): Promise<{
  response: string;
  toolCalls?: OllamaResponse['message']['tool_calls'];
  usedFallback: boolean;
}> {
  // Si la IA está activada, intentar conexión real
  if (AI_ENABLED) {
    const available = await isOllamaAvailable();
    if (available) {
      try {
        // DESCOMENTA cuando actives la conexión:
        // const messages: OllamaMessage[] = [
        //   {
        //     role: 'system',
        //     content: SYSTEM_PROMPT + (companyId ? `\n\nContexto: Empresa ID ${companyId}` : ''),
        //   },
        //   ...chatHistory.slice(-10),
        //   { role: 'user', content: userMessage },
        // ];
        //
        // const data: OllamaResponse = await callOllamaAPI(messages);
        //
        // return {
        //   response: data.message?.content || 'No se pudo generar una respuesta.',
        //   toolCalls: data.message?.tool_calls,
        //   usedFallback: false,
        // };

        console.log('[AI] Modo activo detectado pero callOllamaAPI no descomentado. Usando fallback.');
      } catch (err) {
        console.error('[AI] Error en conexión Ollama, cayendo a fallback:', err);
      }
    }
  }

  // MODO FALLBACK - Respuestas basadas en keywords
  return {
    response: generateFallbackResponse(userMessage),
    usedFallback: true,
  };
}

// ============================================================
// FALLBACK RESPONSE GENERATOR
// Genera respuestas útiles basadas en keywords cuando
// el LLM no está disponible.
// Agrega más keywords y respuestas según necesites.
// ============================================================

function generateFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();

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

  return `🤖 Modo Fallback — IA local (Ollama) no configurada aún.\n\nTu consulta: "${message}"\n\nPara activar la IA completa:\n1. Edita el archivo src/lib/ollama.ts\n2. Descomenta la sección "CONEXIÓN ACTIVA A OLLAMA"\n3. Configura AI_ENABLED=true en .env.local\n4. Asegúrate de que Ollama esté corriendo en el puerto configurado\n\nMientras tanto, puedo ayudarte con las APIs del sistema. ¿Qué necesitas?`;
}

// ============================================================
// EXPORTS
// ============================================================

export { OLLAMA_URL, OLLAMA_MODEL, AI_TOOLS, SYSTEM_PROMPT };
export type { OllamaMessage, OllamaTool, OllamaResponse };
