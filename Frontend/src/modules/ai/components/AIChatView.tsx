'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, AlertTriangle, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { formatCurrency } from '@/lib/utils/format';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; isLoading?: boolean; isError?: boolean; }

const quickPrompts = [
  '¿Cuál fue la utilidad del último trimestre?',
  '¿Cuánto debo a proveedores?',
  'Descarga la balanza de comprobación',
  '¿Cuáles son las facturas vencidas?',
  'Resumen del estado de resultados',
];

const mockResponses: Record<string, string> = {
  'utilidad': `📊 **Utilidad del Trimestre Q2 2025**

Basándome en los datos del sistema:

- **Ingresos Totales**: $2,850,000.00 MXN
- **Gastos Totales**: $1,920,000.00 MXN
- **Utilidad Neta**: $930,000.00 MXN
- **Margen de Utilidad**: 32.6%

📈 La utilidad representa un incremento del **12.3%** respecto al trimestre anterior ($828,000). Los principales drivers de crecimiento fueron los ingresos por servicios profesionales que aumentaron un 18%.

Los gastos de nómina representan el 44.3% del total, seguidos de servicios profesionales (16.7%) y arrendamiento (12.5%).`,
  'proveedores': `💰 **Saldo con Proveedores**

Según los datos del sistema:

| Proveedor | Saldo |
|-----------|-------|
| Ferremateriales López | $62,000.00 |
| SP García (Servicios) | $45,000.00 |
| Transportes Unidos de Yucatán | $85,000.00 |
| Papelería Central | $12,000.00 |
| **Total Cuentas por Pagar** | **$204,000.00** |

⚠️ **Nota**: Transportes Unidos de Yucatán tiene $85,000 pendientes con facturas que vencen en los próximos 15 días. Se recomienda programar el pago para evitar recargos.`,
  'balanza': `📋 **Balanza de Comprobación - Agosto 2025**

La balanza está cuadrada correctamente ✅

- **Total Debe**: $5,420,000.00
- **Total Haber**: $5,420,000.00
- **Diferencia**: $0.00

El reporte contiene 87 cuentas con movimiento. 

👉 Puedo preparar el archivo PDF para descarga. ¿Te gustaría que lo genere?`,
  'vencidas': `⚠️ **Facturas Vencidas**

Se encontraron **5 facturas** con estado vencido:

| # Factura | Cliente | Monto | Dias Vencida |
|-----------|---------|-------|-------------|
| FAC-2025-0065 | Constructora del Norte | $120,000 | 5 días |
| FAC-2025-0058 | Inmobiliaria del Golfo | $85,000 | 12 días |
| FAC-2025-0052 | Clínica Dental Sonrisa | $35,000 | 18 días |
| FAC-2025-0047 | Distribuidora del Sur | $95,000 | 25 días |
| **Total** | | **$335,000** | |

🔴 **Total por cobrar vencido**: $335,000.00 MXN

Recomendación: Enviar recordatorios de pago a Constructora del Norte y Inmobiliaria del Golfo como prioridad.`,
  'estado de resultados': `📈 **Estado de Resultados - Ene-Ago 2025**

**Ingresos:**
- Servicios profesionales: $2,200,000
- Ventas: $450,000
- Ingresos financieros: $200,000
- **Total Ingresos**: $2,850,000

**Gastos:**
- Nóminas: $850,000
- Servicios profesionales: $320,000
- Arrendamiento: $240,000
- Depreciación: $180,000
- Impuestos: $150,000
- Gastos administrativos: $180,000
- **Total Gastos**: $1,920,000

**Utilidad Bruta**: $2,160,000 (75.8%)
**Utilidad Neta**: $930,000 (32.6%) ✨`,
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(mockResponses)) {
    if (lower.includes(key)) return response;
  }
  return `Entiendo tu pregunta sobre "${message}".

En este momento estoy en modo demo y no puedo consultar los datos en tiempo real, pero en la versión completa podré:

1. 🔍 **Consultar datos financieros** en tiempo real
2. 📊 **Generar reportes** personalizados
3. 📋 **Crear pólizas** a partir de instrucciones
4. 💡 **Recomendar** acciones contables
5. 📥 **Exportar** información a PDF/Excel

¿Puedo ayudarte con algo más específico? Prueba preguntar sobre:
- Utilidad del trimestre
- Saldos con proveedores
- Facturas vencidas
- Estado de resultados`;
}

export function AIChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! 👋 Soy Gemma, tu asistente contable de IA. Puedo ayudarte a consultar datos financieros, generar reportes y responder preguntas sobre tu contabilidad.\n\n¿En qué puedo ayudarte hoy?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getMockResponse(text.trim());
      const aiMsg: Message = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-w-4xl mx-auto">
      {/* Chat header */}
      <VintageCard variant="glass" className="mb-4 flex-shrink-0" hover={false}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-vintage-300 to-vintage-500 flex items-center justify-center shadow-lg shadow-vintage-300/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-warning to-peach flex items-center justify-center shadow-sm"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
          </div>
          <div>
            <h3 className="font-playfair text-lg font-bold text-vintage-800">Gemma Contable</h3>
            <p className="text-xs text-vintage-500">Asistente IA • Especialista en contabilidad</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs text-success">En línea</span>
          </div>
        </div>
      </VintageCard>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl bg-vintage-50/50 border border-vintage-200/50 p-4 space-y-4 min-h-0">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-vintage-400 text-white rounded-br-md shadow-sm'
                    : 'bg-card border border-vintage-200 text-vintage-800 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.isError && <AlertTriangle className="w-4 h-4 inline mr-1 text-warning" />}
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-vintage-700 flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border border-vintage-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-5">
                  <motion.span className="w-2 h-2 bg-vintage-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.span className="w-2 h-2 bg-vintage-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                  <motion.span className="w-2 h-2 bg-vintage-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar flex-shrink-0">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt)}
              className="px-3 py-2 text-xs rounded-xl border border-vintage-200 text-vintage-600 hover:bg-vintage-100 hover:border-vintage-300 transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <Lightbulb className="w-3 h-3 text-warning" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="flex gap-2 mt-3 flex-shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre contabilidad, reportes o datos..."
          className="flex-1 px-4 py-3 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 focus:border-vintage-400 transition-all"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-vintage-300 to-vintage-400 text-white hover:from-vintage-400 hover:to-vintage-500 disabled:opacity-40 transition-all shadow-sm hover:shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
