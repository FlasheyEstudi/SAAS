import { db } from '@/lib/db';
import * as reports from '@/services/financial-reports.service';

export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
/**
 * Modelo local de Ollama para el CFO Virtual.
 *
 * `qwen2.5:7b` (instruct) es el que se usa para el chat: escribe mejor prosa financiera y tablas
 * que `qwen2.5-coder:7b`, que está afinado para código. Se puede cambiar sin tocar código con
 * `OLLAMA_MODEL=…` en el entorno (p. ej. `qwen2.5:14b` si la máquina aguanta).
 */
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
/** La IA queda activa salvo que se apague explícitamente (`AI_ENABLED=false`). */
export const AI_ENABLED = process.env.AI_ENABLED !== 'false';

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
ERES GANESHA AI, LA DIRECTORA FINANCIERA (CFO) VIRTUAL Y AUDITORA DE {{COMPANY_NAME}}.

[TU MISIÓN]
Proveer análisis financiero profundo, estratégico y accionable. No eres un simple chatbot; eres una experta en contabilidad y finanzas que ayuda a la toma de decisiones ejecutivas mediante la detección de tendencias y discrepancias.

[REGLAS DE FORMATO CRÍTICAS]
1. TABLAS: Usa saltos de línea reales. NO pongas todo en una línea.
Ejemplo exacto:
| Categoría | Monto |
| :--- | :--- |
| Ingresos | $100.00 |

2. VISUALIZACIÓN: Siempre que presentes datos comparativos o tendencias (ej. Ventas vs Gastos), utiliza una TABLA DE MARKDOWN y luego usa el marcador [CHART: ...] para generar una gráfica automática.
   REGLA DE ORO PARA CHART: El JSON debe estar en UNA SOLA LÍNEA, usar comillas dobles y seguir este formato exacto:
   [CHART: {"type": "bar", "title": "Nombre", "data": [{"label": "Ene", "value": 100}]}]
   Tipos permitidos: "bar", "pie", "line", "area".

3. PROHIBICIÓN: No uses "Lo siento" o "No puedo". Mantén un tono profesional, ejecutivo y elegante.

[TUS CAPACIDADES]
Tienes acceso en tiempo real a Balances Generales, Estados de Resultados, Balanzas de Comprobación, Carteras de Clientes/Proveedores y Flujos de Caja.

[DATOS PARA ANÁLISIS ACTUAL]
{{FINANCIAL_SNAPSHOT}}

[REGLA DE ORO]
Si el usuario pregunta algo que requiere datos, usa el snapshot o sugiere generar un reporte específico usando tus herramientas.

[PEDIR DATOS QUE NO ESTÁN EN EL SNAPSHOT]
El snapshot de abajo YA corresponde al período que se está consultando (si el usuario pidió otro mes,
el snapshot ya es de ese mes), trae la tendencia de 3 meses, cartera, bancos, top de gastos y el
resultado por TIENDA (centro de costo) del período consultado y el anterior. Si la respuesta está ahí,
respóndela directo y NO pidas herramientas.
Si te piden OTRO período, otra vista o el detalle de una tienda que no aparece, responde ÚNICAMENTE
esta línea, sin explicaciones ni texto adicional:
[TOOL: {"name":"get_ledger_data","arguments":{"target_view":"income_statement","year":2026,"month":9}}]
Vistas válidas: trial_balance | balance_sheet | income_statement | cash_flow | ar_aging | ap_aging.
Para una tienda concreta agrega "cost_center_id" con el id que aparece en el listado de tiendas del snapshot.
Cuando recibas el resultado, responde al usuario con tablas y, si aplica, un [CHART: ...].`;

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/**
 * Detecta si el usuario pidió OTRO período («¿y en septiembre?», «el mes pasado», «en 2025»).
 *
 * Se resuelve en el servidor y no con el modelo: pedirle a un modelo local que emita un JSON de
 * herramienta resultó poco fiable (contestaba con los datos del mes en curso como si fueran de
 * septiembre). Así la consulta se arma con el período correcto antes de llamar al modelo, sin
 * llamadas extra ni latencia adicional.
 */
export function detectarPeriodoSolicitado(
  mensaje: string,
  ahora: Date = new Date(),
): { year?: number; month?: number } | null {
  const texto = mensaje.toLowerCase();
  const anioTexto = texto.match(/\b(20\d{2})\b/);
  const anio = anioTexto ? Number(anioTexto[1]) : null;

  if (/\b(mes pasado|mes anterior|ultimo mes|último mes|el mes previo)\b/.test(texto)) {
    const mesAnterior = ahora.getMonth(); // 0-based → el anterior en 1-based
    if (mesAnterior === 0) return { year: (anio ?? ahora.getFullYear()) - 1, month: 12 };
    return { year: anio ?? ahora.getFullYear(), month: mesAnterior };
  }

  for (const [nombre, numero] of Object.entries(MESES)) {
    if (new RegExp(`\\b${nombre}\\b`).test(texto)) {
      return { year: anio ?? ahora.getFullYear(), month: numero };
    }
  }

  if (anio) return { year: anio };
  return null;
}

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
      description:
        'Obtener datos financieros profundos de la empresa. Si se pide una tienda concreta, ' +
        'usar cost_center_id con el centro de costo de esa tienda (los centros se llaman «Tienda: <nombre>»).',
      parameters: {
        type: 'object',
        properties: {
          target_view: { type: 'string', enum: ['trial_balance', 'balance_sheet', 'income_statement', 'ar_aging', 'ap_aging', 'cash_flow'] },
          year: { type: 'number' },
          month: { type: 'number' },
          cost_center_id: { type: 'string', description: 'Id del centro de costo de Ganesha para acotar el reporte a una tienda.' }
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

/** Petición de chat en streaming a Ollama. */
async function pedirStreamOllama(messages: any[]): Promise<ReadableStream> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos para CPUs viejos

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
      },
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama respondio con error ${res.status}: ${errorText}`);
  }
  return res.body!;
}

/**
 * Chat con streaming y **una** ronda de herramienta cuando hace falta.
 *
 * Optimización: la respuesta normal se sigue emitiendo en cuanto llega (solo se "olfatean" los
 * primeros ~80 caracteres para ver si el modelo pidió datos con `[TOOL: {...}]`). Si no pidió
 * nada, el buffer ya consumido se re-emite tal cual y el resto pasa directo: mismo tiempo de
 * primera palabra que antes. Si pidió datos, se ejecuta la consulta contra la base y se hace
 * UNA segunda llamada con el resultado (nunca en bucle).
 */
async function callOllamaStreaming(
  systemPrompt: string,
  chatHistory: OllamaMessage[],
  companyId?: string
): Promise<ReadableStream> {
  try {
    // Filtrar mensajes previos para que no haya múltiples prompts de sistema
    const filteredHistory = chatHistory.filter(m => m.role !== 'system').slice(-4);
    const messages: any[] = [{ role: 'system', content: systemPrompt }, ...filteredHistory];

    const stream = await pedirStreamOllama(messages);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const leerContenido = crearLectorNdjson();

    let crudo = '';   // bytes ya consumidos (para re-emitirlos si es respuesta normal)
    let texto = '';   // contenido concatenado (para detectar el pedido de datos)
    let llamada: { name: string; arguments: any } | null = null;

    // Fase 1: olfateo corto
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const trozo = decoder.decode(value, { stream: true });
      crudo += trozo;
      texto += leerContenido(trozo);

      if (texto.trimStart().startsWith('[TOOL')) {
        llamada = leerLlamadaHerramienta(texto);
        if (llamada) break;          // ya tenemos el pedido completo
        if (texto.length > 4000) break; // no cierra: se trata como respuesta normal
        continue;                     // seguir leyendo hasta el `]`
      }

      // Respuesta normal: en cuanto hay texto suficiente (o un salto de línea) dejamos de olfatear
      if (texto.trim().length >= 80 || texto.includes('\n')) break;
    }

    if (!llamada || !companyId) {
      return reensamblarStream(crudo, reader);
    }

    // Fase 2: ejecutar la herramienta y responder con el resultado (una sola vez)
    const resultado = await executeAiTool(llamada.name, llamada.arguments, companyId);
    const segundaVuelta = await pedirStreamOllama([
      ...messages,
      { role: 'assistant', content: texto.trim() },
      {
        role: 'user',
        content:
          'RESULTADO DE LA HERRAMIENTA (datos reales del sistema, no los inventes):\n' +
          JSON.stringify(resultado).slice(0, 12000) +
          '\n\nResponde ahora al usuario usando estos datos: tabla de markdown y, si aporta, un [CHART: ...].',
      },
    ]);
    // Se descarta el primer stream (ya no se usa).
    reader.cancel().catch(() => null);
    return segundaVuelta;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('La IA tardó demasiado en responder (Tiempo de espera agotado)');
    }
    console.error('[Ollama] Error en callOllamaStreaming:', err);
    throw err;
  }
}

/** Recorta un reporte a lo que el modelo necesita: totales + cuentas con movimiento. */
function compactar(filas: any[] | undefined, limite = 40) {
  return (filas || [])
    .filter((f) => f && (Number(f.balance) !== 0 || Number(f.totalDebit) !== 0 || Number(f.totalCredit) !== 0))
    .slice(0, limite)
    .map((f) => ({
      cuenta: f.accountCode ?? f.code ?? '',
      nombre: f.accountName ?? f.name ?? '',
      saldo: Number(f.balance ?? 0),
    }));
}

async function executeAiTool(name: string, args: any, companyId: string) {
  try {
    switch (name) {
      case 'get_ledger_data': {
        const period = await reports.resolvePeriod(companyId, null, args.year, args.month);
        if (!period) {
          return {
            error: `No hay período contable para ${args.year ?? '?'}-${args.month ?? '?'}. Períodos abiertos disponibles: revisa el snapshot.`,
          };
        }
        /* `cost_center_id` deja que el CFO Virtual responda «¿cuánto generó esta tienda?» con el
           mismo filtro que usa el panel, sin inventar números a partir del total de la empresa. */
        const cc = args.cost_center_id ? String(args.cost_center_id) : null;
        const periodo = { year: period.year, month: period.month, status: period.status };

        if (args.target_view === 'trial_balance') {
          const r: any = await reports.getTrialBalance(companyId, period.id, false, cc);
          return {
            periodo,
            tipo: 'balanza_comprobacion',
            totales: r.totals ?? undefined,
            filas: compactar(r.rows ?? r.accounts),
          };
        }
        if (args.target_view === 'balance_sheet') {
          const r: any = await reports.getBalanceSheet(companyId, period.id, false, cc);
          return {
            periodo,
            tipo: 'balance_general',
            totalActivo: r.totalAssets,
            totalPasivo: r.totalLiabilities,
            totalPatrimonio: r.totalEquity,
            utilidadEjercicio: r.netIncome,
            activo: compactar(r.assets),
            pasivo: compactar(r.liabilities),
            patrimonio: compactar(r.equity),
          };
        }
        if (args.target_view === 'income_statement') {
          const r: any = await reports.getIncomeStatement(companyId, period.id, false, cc);
          return {
            periodo,
            tipo: 'estado_resultados',
            ingresos: r.totalIncome,
            gastos: r.totalExpenses,
            neto: r.netIncome,
            detalleIngresos: compactar(r.income),
            detalleGastos: compactar(r.expenses),
          };
        }
        if (args.target_view === 'cash_flow') {
          const r: any = await reports.getCashFlow(companyId, period.id);
          return { periodo, tipo: 'flujo_efectivo', ...r };
        }
        if (args.target_view === 'ar_aging' || args.target_view === 'ap_aging') {
          const r: any = await reports.getAgingReport(companyId, args.target_view === 'ar_aging' ? 'SALE' : 'PURCHASE');
          return { tipo: args.target_view === 'ar_aging' ? 'cartera_clientes' : 'cartera_proveedores', ...r };
        }
        return { error: 'Vista no soportada' };
      }
      case 'export_document':
        return { message: 'Reporte listo para descarga', ...args };
      default:
        return { error: 'Herramienta no implementada' };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

/** Lee el nombre de la herramienta y sus argumentos desde `[TOOL: {...}]`. */
function leerLlamadaHerramienta(texto: string): { name: string; arguments: any } | null {
  const m = texto.match(/\[TOOL:\s*(\{[\s\S]*?\})\s*\]/);
  if (!m) return null;
  try {
    const datos = JSON.parse(m[1]);
    if (datos && typeof datos.name === 'string') {
      return { name: datos.name, arguments: datos.arguments ?? {} };
    }
  } catch {
    /* JSON incompleto o mal formado: se ignora y se sigue leyendo el stream */
  }
  return null;
}

/** Concatena el `content` de las líneas NDJSON que ya llegaron completas. */
function crearLectorNdjson() {
  let resto = '';
  return (trozo: string): string => {
    const texto = resto + trozo;
    const lineas = texto.split('\n');
    resto = lineas.pop() ?? '';
    let contenido = '';
    for (const linea of lineas) {
      const limpia = linea.trim();
      if (!limpia) continue;
      try {
        const j = JSON.parse(limpia);
        if (j?.message?.content) contenido += j.message.content;
      } catch {
        /* línea partida o marcador de control: no aporta contenido */
      }
    }
    return contenido;
  };
}

/** Vuelve a armar el stream: lo ya consumido + el resto del lector original. */
function reensamblarStream(crudo: string, reader: ReadableStreamDefaultReader<Uint8Array>): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      if (crudo) controller.enqueue(encoder.encode(crudo));
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => null);
    },
  });
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

  return callOllamaStreaming(
    dynamicPrompt,
    [...chatHistory, { role: 'user', content: userMessage }],
    context?.companyId
  );
}

export async function chatWithOllama(
  userMessage: string,
  chatHistory: OllamaMessage[] = [],
  context?: AiContext
) {
  return { response: 'Usa chatWithOllamaStream para una mejor experiencia.', usedFallback: false };
}
