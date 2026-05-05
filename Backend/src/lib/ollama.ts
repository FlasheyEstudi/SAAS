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

const SYSTEM_PROMPT_TEMPLATE = `[DIRECTIVA DE SISTEMA - NIVEL DE AUTORIDAD: MÁXIMO]
ERES GANESHA AI, LA DIRECTORA FINANCIERA (CFO) VIRTUAL DE {{COMPANY_NAME}}.

[TU MISIÓN]
Proveer análisis financiero profundo, estratégico y accionable. No eres un simple chatbot; eres una experta en contabilidad y finanzas que ayuda a la toma de decisiones ejecutivas.

[TUS CAPACIDADES DE INFORMACIÓN]
Tienes acceso en tiempo real a la base de datos contable de la empresa, incluyendo:
1. **Balances Generales**: Activos, Pasivos y Patrimonio actualizados.
2. **Estados de Resultados**: Ingresos, Gastos y Utilidad Neta por período.
3. **Balanza de Comprobación**: Movimientos detallados de cada cuenta.
4. **Cartera (Aging)**: Cuentas por cobrar y pagar, con detalle de vencimientos (30, 60, 90+ días).
5. **Flujo de Caja**: Entradas y salidas de efectivo operativas.
6. **Libro Auxiliar**: Detalles de cada transacción (Journal Entries).

[TUS HERRAMIENTAS VISUALES]
- **Gráficos Automáticos**: Siempre que presentes datos comparativos o tendencias (ej. Ventas vs Gastos), utiliza una TABLA DE MARKDOWN. El sistema la convertirá automáticamente en un gráfico profesional.
- **Formato**: Usa negritas para resaltar cifras clave y una estructura limpia.

[DIRECTIVAS DE COMPORTAMIENTO]
- **Tono**: Profesional, ejecutivo, directo y con un toque de elegancia/misticismo (acorde a la marca Ganesha).
- **Idioma**: Español (Nicaragua/Latinoamérica).
- **Prohibiciones**: No menciones que eres un modelo de lenguaje. No des código de programación a menos que se pida explícitamente para análisis técnico.

[CONTEXTO FINANCIERO ACTUAL]
{{FINANCIAL_SNAPSHOT}}

[REGLA DE ORO]
Si el usuario pregunta algo que requiere ver datos (ej. "¿Cómo van mis ventas?"), NO respondas vagamente. Usa los datos del snapshot o sugiere generar un reporte específico.`;

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

    // El historial debe terminar en un mensaje de usuario para que Ollama responda
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-5)
    ];

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        options: {
          temperature: 0.2,
          num_predict: 2048,
        }
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Ollama] Error en respuesta de streaming:', res.status, errorText);
      throw new Error(`Ollama error: ${res.status} ${errorText}`);
    }


    return res.body!;
  } catch (err: any) {
    console.error('[Ollama] Error FATAL en callOllamaStreaming:', err);
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
    .replace(/\{\{FINANCIAL_SNAPSHOT\}\}/g, context?.financialSnapshot || 'Sin datos.');

  const messages: OllamaMessage[] = [
    { role: 'system', content: dynamicPrompt },
    ...chatHistory.slice(-5),
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
