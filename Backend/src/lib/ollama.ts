import { db } from '@/lib/db';
import * as reports from '@/services/financial-reports.service';

export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
export const AI_ENABLED = process.env.AI_ENABLED === 'true';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: {
    function: {
      name: string;
      arguments: Record<string, unknown>;
    };
  }[];
}

export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface OllamaResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
}

export interface AiContext {
  companyId: string;
  companyName: string;
  companyTaxId?: string;
  userId: string;
  userName: string;
  userRole: string;
  currentDate: string;
  financialSnapshot?: string;
}

const SYSTEM_PROMPT_TEMPLATE = `[SISTEMA DE ANÁLISIS FINANCIERO AVANZADO - MODO AUDITORÍA]
- IDENTIDAD: GANESHA, Directora Financiera y Auditora de Discrepancias.
- ORGANIZACIÓN: {{COMPANY_NAME}}.
- AUTORIDAD: {{USER_NAME}}.

[REGLAS DE FORMATO CRÍTICAS]
1. TABLAS: Usa saltos de línea reales. NO pongas todo en una línea.
Ejemplo exacto:
| Categoría | Monto |
| :--- | :--- |
| Ingresos | $100.00 |

2. VISUALIZACIÓN: Si hay números, usa [CHART: ...] después de la tabla.
3. PROHIBICIÓN: No uses "Lo siento" o "No puedo".

[MENSAJE INICIAL]
"Hola {{USER_NAME}}, soy Ganesha. Iniciando auditoría forense para {{COMPANY_NAME}}."

[DATOS PARA ANÁLISIS]
{{FINANCIAL_SNAPSHOT}}`;

export const AI_TOOLS: OllamaTool[] = [
  {
    type: 'function',
    function: {
      name: 'export_document',
      description: 'Genera y descarga un reporte en formato PDF o Excel.',
      parameters: {
        type: 'object',
        properties: {
          report_type: { type: 'string', enum: ['trial_balance', 'balance_sheet', 'income_statement', 'aging_report'] },
          format: { type: 'string', enum: ['pdf', 'excel'] },
          period_label: { type: 'string' }
        },
        required: ['report_type', 'format']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_ledger_data',
      description: 'Obtener datos financieros profundos de la empresa.',
      parameters: {
        type: 'object',
        properties: {
          target_view: { type: 'string', enum: ['trial_balance', 'balance_sheet', 'income_statement', 'ar_aging', 'ap_aging', 'cash_flow'] },
          year: { type: 'number' },
          month: { type: 'number' }
        },
        required: ['target_view']
      }
    }
  }
];

export async function isOllamaAvailable(): Promise<boolean> {
  if (!AI_ENABLED) return false;
  const hosts = [OLLAMA_URL, 'http://localhost:11434'];
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch { }
  }
  return false;
}

export async function listModels(): Promise<string[]> {
  if (!AI_ENABLED) return [];
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch { return []; }
}

async function callOllamaStreaming(systemPrompt: string, chatHistory: OllamaMessage[]): Promise<ReadableStream> {
  try {
    // Filtrar mensajes previos para que no haya múltiples prompts de sistema
    const filteredHistory = chatHistory
      .filter(m => m.role !== 'system')
      .slice(-4); // Reducimos a 4 mensajes para CPUs más lentos

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...filteredHistory
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos de espera para CPUs viejos

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        options: {
          temperature: 0.1,
          num_predict: 2048,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Ollama respondio con error ${res.status}: ${errorText}`);
    }

    return res.body!;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('La IA tardó demasiado en responder (Tiempo de espera agotado)');
    }
    console.error('[Ollama] Error en callOllamaStreaming:', err);
    throw err;
  }
}

async function executeAiTool(name: string, args: any, companyId: string) {
  try {
    switch (name) {
      case 'get_ledger_data': {
        const period = await reports.resolvePeriod(companyId, null, args.year, args.month);
        if (!period) return { error: 'Período no encontrado' };
        if (args.target_view === 'trial_balance') return await reports.getTrialBalance(companyId, period.id);
        if (args.target_view === 'balance_sheet') return await reports.getBalanceSheet(companyId, period.id);
        if (args.target_view === 'income_statement') return await reports.getIncomeStatement(companyId, period.id);
        if (args.target_view === 'ar_aging') return await reports.getAgingReport(companyId, 'SALE');
        if (args.target_view === 'ap_aging') return await reports.getAgingReport(companyId, 'PURCHASE');
        if (args.target_view === 'cash_flow') return await reports.getCashFlow(companyId, period.id);
        return { error: 'Vista no soportada' };
      }
      case 'export_document':
        return { message: "Reporte listo para descarga", ...args };
      default:
        return { error: 'Herramienta no implementada' };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function chatWithOllamaStream(
  userMessage: string,
  chatHistory: OllamaMessage[] = [],
  context?: AiContext
): Promise<ReadableStream> {
  const dynamicPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace(/\{\{COMPANY_NAME\}\}/g, context?.companyName || 'Empresa')
    .replace(/\{\{USER_NAME\}\}/g, context?.userName || 'Usuario')
    .replace(/\{\{FINANCIAL_SNAPSHOT\}\}/g, context?.financialSnapshot || 'Sin datos.');

  const messages: OllamaMessage[] = [
    { role: 'system', content: dynamicPrompt },
    ...chatHistory.slice(-4),
    { role: 'user', content: userMessage },
  ];

  return callOllamaStreaming(dynamicPrompt, [...chatHistory, { role: 'user', content: userMessage }]);
}

export async function chatWithOllama(
  userMessage: string,
  chatHistory: OllamaMessage[] = [],
  context?: AiContext
) {
  return { response: 'Usa chatWithOllamaStream para una mejor experiencia.', usedFallback: false };
}
