'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, AlertTriangle, Loader2, Lightbulb, RefreshCw, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { useAI } from '../hooks/useAI';
import { 
  exportBalanceSheetPDF, exportBalanceSheetExcel,
  exportIncomeStatementPDF, exportIncomeStatementExcel,
  exportTrialBalancePDF, exportTrialBalanceExcel,
  exportInvoicesPDF, exportInvoicesExcel,
  exportBanksPDF, exportBanksExcel
} from '@/lib/utils/export';
import { formatCurrency } from '@/lib/utils/format';

const quickPrompts = [
  '¿Cuál fue la utilidad del último trimestre?',
  '¿Cuánto debo a proveedores?',
  'Descarga la balanza de comprobación',
  '¿Cuáles son las facturas vencidas?',
  'Resumen del estado de resultados',
];

export function AIChatView() {
  const { messages, isTyping, status, sendMessage, checkStatus } = useAI();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    await sendMessage(input.trim());
    setInput('');
  };

  const handleDownload = async (msg: any) => {
    const { type, format } = msg.metadata.downloadConfig;
    const companyName = 'GANESHA Compañía Demo';
    
    try {
      toast.loading('Generando archivo...');
      const data = msg.rawData || msg.metadata.downloadConfig.data || {}; 

      if (type === 'balance_sheet') {
        if (format === 'pdf') await exportBalanceSheetPDF(data, companyName);
        else await exportBalanceSheetExcel(data, companyName);
      } else if (type === 'income_statement') {
        if (format === 'pdf') await exportIncomeStatementPDF(data, companyName);
        else await exportIncomeStatementExcel(data, companyName);
      } else if (type === 'trial_balance') {
        if (format === 'pdf') await exportTrialBalancePDF(data, companyName);
        else await exportTrialBalanceExcel(data, companyName);
      } else {
        toast.error('Tipo de reporte no soportado para descarga directa');
      }
      toast.dismiss();
    } catch (err) {
      toast.dismiss();
      toast.error('Error al generar el archivo');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-w-4xl mx-auto">
      <VintageCard variant="glass" className="mb-4 flex-shrink-0" hover={false}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-vintage-300 to-vintage-500 flex items-center justify-center shadow-lg shadow-vintage-300/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <motion.div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-warning to-peach flex items-center justify-center shadow-sm" animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
          </div>
          <div>
            <h3 className="font-playfair text-lg font-bold text-vintage-800">GANESHA AI</h3>
            <p className="text-xs text-vintage-500">Asistente IA • Especialista en contabilidad</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-success animate-pulse-soft' : status === 'busy' ? 'bg-warning' : 'bg-error'}`} />
            <span className={`text-xs ${status === 'online' ? 'text-success' : status === 'busy' ? 'text-warning' : 'text-error'}`}>{status === 'online' ? 'En línea' : status === 'busy' ? 'Ocupado' : 'Sin conexión'}</span>
            <button onClick={checkStatus} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-600 ml-2" title="Verificar estado"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </VintageCard>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl bg-vintage-50/50 border border-vintage-200/50 p-4 space-y-4 min-h-0">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center py-12">
              <Bot className="w-16 h-16 text-vintage-300 mb-4" />
              <h3 className="text-lg font-playfair font-bold text-vintage-700 mb-2">¡Hola! Soy GANESHA</h3>
              <p className="text-sm text-vintage-500 max-w-md">Tu asistente contable de IA. Puedo ayudarte a consultar datos financieros, generar reportes y responder preguntas sobre tu contabilidad.</p>
            </motion.div>
          )}
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center mr-2 flex-shrink-0 mt-1"><Bot className="w-4 h-4 text-white" /></div>)}
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-vintage-400 text-white rounded-br-md shadow-sm' : 'bg-card border border-vintage-200 text-vintage-800 rounded-bl-md shadow-sm'}`}>
                {(msg as any).isError && <AlertTriangle className="w-4 h-4 inline mr-1 text-warning" />}
                {msg.content}
                
                {msg.metadata?.downloadConfig && (
                  <div className="mt-4 pt-3 border-t border-vintage-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-vintage-50 border border-vintage-200 shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-white border border-vintage-200 flex items-center justify-center">
                        {msg.metadata.downloadConfig.format === 'pdf' ? (
                          <FileText className="w-5 h-5 text-error" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-vintage-800 truncate">
                          Reporte: {msg.metadata.downloadConfig.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-[10px] text-vintage-500 uppercase tracking-tighter">
                          Formato {msg.metadata.downloadConfig.format.toUpperCase()} • Generado por AI
                        </p>
                      </div>
                      <PastelButton 
                        size="sm" 
                        className="gap-1.5 h-8 text-xs" 
                        onClick={() => handleDownload(msg)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </PastelButton>
                    </div>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (<div className="w-8 h-8 rounded-xl bg-vintage-700 flex items-center justify-center ml-2 flex-shrink-0 mt-1"><User className="w-4 h-4 text-white" /></div>)}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center mr-2 flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
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

      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar flex-shrink-0">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt)}
              disabled={isTyping || status !== 'online'}
              className="px-3 py-2 text-xs rounded-xl border border-vintage-200 text-vintage-600 hover:bg-vintage-100 hover:border-vintage-300 transition-all whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
            >
              <Lightbulb className="w-3 h-3 text-warning" />{prompt}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-3 flex-shrink-0">
        <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pregunta sobre contabilidad, reportes o datos..." className="flex-1 px-4 py-3 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 focus:border-vintage-400 transition-all" disabled={isTyping} />
        <button type="submit" disabled={isTyping || !input.trim()} className="px-4 py-3 rounded-xl bg-gradient-to-r from-vintage-300 to-vintage-400 text-white hover:from-vintage-400 hover:to-vintage-500 disabled:opacity-40 transition-all shadow-sm hover:shadow-md">
          {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
