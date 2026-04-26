'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, AlertTriangle, Loader2, Lightbulb, RefreshCw, FileText, FileSpreadsheet, Download, Copy, Check, BarChart3, Receipt, Landmark, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { useAI, ChatMessage } from '../hooks/useAI';
import { useAppStore } from '@/lib/stores/useAppStore';
import { apiClient } from '@/lib/api/client';
import { REPORTS } from '@/lib/api/endpoints';
import { 
  exportBalanceSheetPDF, exportBalanceSheetExcel,
  exportIncomeStatementPDF, exportIncomeStatementExcel,
  exportTrialBalancePDF, exportTrialBalanceExcel,
  exportInvoicesPDF, exportInvoicesExcel,
  exportBanksPDF, exportBanksExcel
} from '@/lib/utils/export';
import { cn } from '@/lib/utils';

// Report types the assistant can generate
const REPORT_OPTIONS = [
  { id: 'trial_balance', label: 'Balanza de Comprobación', icon: ClipboardList, endpoint: REPORTS.trialBalance },
  { id: 'balance_sheet', label: 'Balance General', icon: BarChart3, endpoint: REPORTS.balanceSheet },
  { id: 'income_statement', label: 'Estado de Resultados', icon: Receipt, endpoint: REPORTS.incomeStatement },
];

const PERIOD_OPTIONS = [
  { id: 'current', label: 'Mes Actual' },
  { id: 'last', label: 'Mes Anterior' },
  { id: 'q1', label: 'Q1 (Ene-Mar)' },
  { id: 'q2', label: 'Q2 (Abr-Jun)' },
  { id: 'year', label: 'Año Completo' },
];

const FORMAT_OPTIONS = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
];

const quickPrompts = [
  '📊 Dame un reporte financiero',
  '📄 Descarga la balanza de comprobación',
  '💰 ¿Cuáles son las facturas vencidas?',
  '🏦 Estado de mis cuentas bancarias',
  '📈 Resumen del estado de resultados',
];

// Interaction types for guided flow
type InteractionType = 
  | { type: 'none' }
  | { type: 'select_report' }
  | { type: 'select_period'; reportId: string; reportLabel: string }
  | { type: 'select_format'; reportId: string; reportLabel: string; periodId: string; periodLabel: string }
  | { type: 'downloading'; reportId: string; reportLabel: string; periodLabel: string; format: string };

export function AIChatView() {
  const { messages, isTyping, status, sendMessage, checkStatus, clearConversation } = useAI() as any;
  const companyId = useAppStore((state) => state.companyId);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [interaction, setInteraction] = useState<InteractionType>({ type: 'none' });
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string; isAction?: boolean; downloadConfig?: any }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages, localMessages, interaction]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Detect report requests in user messages
  const detectReportRequest = (text: string): boolean => {
    const reportKeywords = ['reporte', 'report', 'descarga', 'descargar', 'download', 'generar', 'genera', 'dame', 'balanza', 'balance', 'estado de resultado', 'financiero'];
    const lowerText = text.toLowerCase();
    return reportKeywords.some(k => lowerText.includes(k));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');

    // Check if this is a report request
    if (detectReportRequest(userText)) {
      // Add user message to local messages
      setLocalMessages(prev => [...prev, { role: 'user', content: userText }]);
      // Add assistant response with report options
      setLocalMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '¿Qué reporte necesitas? Selecciona una opción:',
        isAction: true 
      }]);
      setInteraction({ type: 'select_report' });
      return;
    }

    // Normal message → send to AI backend
    await sendMessage(userText);
  };

  const handleSelectReport = (reportId: string, reportLabel: string) => {
    setLocalMessages(prev => [...prev, 
      { role: 'user', content: `Quiero: ${reportLabel}` },
      { role: 'assistant', content: `Perfecto. ¿De qué período necesitas el ${reportLabel}?`, isAction: true }
    ]);
    setInteraction({ type: 'select_period', reportId, reportLabel });
  };

  const handleSelectPeriod = (periodId: string, periodLabel: string) => {
    const inter = interaction as any;
    setLocalMessages(prev => [...prev,
      { role: 'user', content: periodLabel },
      { role: 'assistant', content: `¿En qué formato deseas el ${inter.reportLabel} (${periodLabel})?`, isAction: true }
    ]);
    setInteraction({ type: 'select_format', reportId: inter.reportId, reportLabel: inter.reportLabel, periodId, periodLabel });
  };

  const handleSelectFormat = async (format: string) => {
    const inter = interaction as any;
    const formatLabel = format.toUpperCase();
    setLocalMessages(prev => [...prev,
      { role: 'user', content: formatLabel },
      { role: 'assistant', content: `Generando ${inter.reportLabel} (${inter.periodLabel}) en ${formatLabel}... Un momento por favor.` }
    ]);
    setInteraction({ type: 'downloading', reportId: inter.reportId, reportLabel: inter.reportLabel, periodLabel: inter.periodLabel, format });

    try {
      // Fetch real data from API
      const reportConfig = REPORT_OPTIONS.find(r => r.id === inter.reportId);
      if (!reportConfig) throw new Error('Reporte no encontrado');

      const data = await apiClient.get<any>(reportConfig.endpoint);
      const companyName = 'GANESHA';

      // Execute the export
      if (inter.reportId === 'trial_balance') {
        const accounts = data?.accounts || data?.data || data || [];
        const totals = data?.totals || {};
        if (format === 'pdf') await exportTrialBalancePDF(accounts, companyName, inter.periodLabel, totals);
        else await exportTrialBalanceExcel(accounts, companyName, inter.periodLabel, totals);
      } else if (inter.reportId === 'balance_sheet') {
        const assets = data?.assets || [];
        if (format === 'pdf') await exportBalanceSheetPDF(assets, data?.liabilities, data?.equity, companyName, inter.periodLabel);
        else await exportBalanceSheetExcel(assets, data?.liabilities, data?.equity, companyName, inter.periodLabel);
      } else if (inter.reportId === 'income_statement') {
        if (format === 'pdf') await exportIncomeStatementPDF(data?.income || [], data?.expenses, data?.netIncome, companyName, inter.periodLabel);
        else await exportIncomeStatementExcel(data?.income || [], data?.expenses, data?.netIncome, companyName, inter.periodLabel);
      }

      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **${inter.reportLabel}** generado exitosamente en formato **${formatLabel}**.\n\nEl archivo se ha descargado automáticamente.\n\n¿Necesitas otro reporte o tienes alguna consulta?`,
        downloadConfig: { type: inter.reportId, format, label: inter.reportLabel }
      }]);
      toast.success(`${inter.reportLabel} descargado`);
    } catch (err) {
      console.error('Error generating report:', err);
      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ No se pudo generar el reporte. Esto puede ocurrir si no hay datos disponibles para el período seleccionado o si el servidor no respondió.\n\n¿Deseas intentar con otro reporte o período?`,
      }]);
      toast.error('Error al generar el reporte');
    }
    setInteraction({ type: 'none' });
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Merge backend messages with local guided messages
  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-w-4xl mx-auto px-2">
      {/* Header */}
      <VintageCard variant="glass" className="mb-4 flex-shrink-0 border-orange-500/10 shadow-lg shadow-orange-500/5" hover={false}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <motion.div 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-md border border-orange-200" 
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }} 
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-3 h-3 text-orange-500" />
            </motion.div>
          </div>
          <div>
            <h3 className="font-playfair text-lg font-bold text-vintage-800 dark:text-white flex items-center gap-2">
              GANESHA AI
              <span className="text-[9px] bg-orange-100 dark:bg-orange-950/30 text-orange-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black">Expert</span>
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest">Consultoría Financiera Inteligente</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border">
            <span className={cn("w-2 h-2 rounded-full", status === 'online' ? 'bg-success animate-pulse' : 'bg-warning')} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{status === 'online' ? 'Online' : 'Offline'}</span>
            <button onClick={checkStatus} className="p-1 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/30 text-orange-600 ml-1 transition-colors"><RefreshCw className="w-3 h-3" /></button>
          </div>
        </div>
      </VintageCard>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-3xl bg-vintage-50/30 dark:bg-zinc-950/20 border border-vintage-200/50 dark:border-white/5 p-4 sm:p-6 space-y-6 min-h-0 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {allMessages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/10 dark:to-orange-900/20 flex items-center justify-center mb-6 shadow-inner">
                <Bot className="w-10 h-10 text-orange-500/40" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-vintage-800 dark:text-white mb-2">GANESHA AI</h3>
              <p className="text-sm text-vintage-500 dark:text-zinc-500 max-w-sm leading-relaxed">
                Asistente financiero de tu empresa. Puedo generar reportes, analizar balances y responder consultas contables.
              </p>
            </motion.div>
          )}

          {allMessages.map((msg: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className={cn("flex group", msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/30 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-5 h-5 text-orange-500" />
                </div>
              )}
              
              <div className={cn(
                "relative max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm transition-all",
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-100 rounded-br-md border border-zinc-700' 
                  : 'bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-white/5 text-vintage-800 dark:text-zinc-200 rounded-bl-md'
              )}>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleCopy(msg.content, i)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copiar contenido"
                  >
                    {copiedId === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}

                {msg.isError && <AlertTriangle className="w-4 h-4 inline mr-2 text-warning" />}
                
                <div className={cn(
                    "markdown-content prose prose-sm dark:prose-invert max-w-none",
                    "prose-headings:font-playfair prose-headings:font-bold prose-headings:text-orange-600",
                    "prose-table:border prose-table:border-vintage-200 prose-th:px-3 prose-th:py-2 prose-th:bg-vintage-50 prose-td:px-3 prose-td:py-2"
                  )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Download success indicator */}
                {msg.downloadConfig && (
                  <div className="mt-4 pt-3 border-t border-vintage-100 dark:border-white/5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        {msg.downloadConfig.format === 'pdf' ? <FileText className="w-5 h-5 text-error" /> : <FileSpreadsheet className="w-5 h-5 text-success" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-vintage-800 dark:text-white">{msg.downloadConfig.label}</p>
                        <p className="text-[10px] text-zinc-500">{msg.downloadConfig.format.toUpperCase()} • Generado desde datos reales</p>
                      </div>
                      <Check className="w-5 h-5 text-success" />
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center ml-3 flex-shrink-0 mt-1 shadow-lg shadow-black/10 border border-zinc-700">
                  <User className="w-5 h-5 text-white/70" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Interactive action buttons — the guided flow */}
          {interaction.type === 'select_report' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/30 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-orange-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-[85%]">
                {REPORT_OPTIONS.map(r => (
                  <motion.button
                    key={r.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectReport(r.id, r.label)}
                    className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/30 rounded-2xl hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10 transition-all"
                  >
                    <r.icon className="w-8 h-8 text-orange-500" />
                    <span className="text-xs font-bold text-vintage-800 dark:text-white text-center">{r.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {interaction.type === 'select_period' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/30 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex flex-wrap gap-2 max-w-[85%]">
                {PERIOD_OPTIONS.map(p => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectPeriod(p.id, p.label)}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/30 rounded-xl text-xs font-bold text-vintage-800 dark:text-white hover:border-orange-400 hover:shadow-md transition-all"
                  >
                    {p.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {interaction.type === 'select_format' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/30 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex gap-3 max-w-[85%]">
                {FORMAT_OPTIONS.map(f => (
                  <motion.button
                    key={f.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectFormat(f.id)}
                    className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/30 rounded-2xl hover:border-orange-400 hover:shadow-lg transition-all"
                  >
                    <f.icon className={cn("w-6 h-6", f.id === 'pdf' ? 'text-error' : 'text-success')} />
                    <div className="text-left">
                      <p className="text-sm font-bold text-vintage-800 dark:text-white">{f.label}</p>
                      <p className="text-[10px] text-zinc-500">{f.id === 'pdf' ? 'Documento oficial' : 'Hoja de cálculo'}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {interaction.type === 'downloading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-orange-500/20"><Bot className="w-5 h-5 text-white animate-pulse" /></div>
              <div className="bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-white/5 rounded-3xl rounded-bl-md px-6 py-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Generando reporte...</span>
              </div>
            </motion.div>
          )}

          {/* Typing indicator for backend AI */}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-orange-500/20"><Bot className="w-5 h-5 text-white animate-pulse" /></div>
              <div className="bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-white/5 rounded-3xl rounded-bl-md px-6 py-4 shadow-sm flex items-center gap-2">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest animate-pulse">Pensando...</span>
                <div className="flex gap-1 items-center h-4 ml-1">
                  <motion.span className="w-1.5 h-1.5 bg-orange-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.span className="w-1.5 h-1.5 bg-orange-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                  <motion.span className="w-1.5 h-1.5 bg-orange-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick prompts */}
      {allMessages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar flex-shrink-0">
          {quickPrompts.map((prompt, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -2, backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setInput(prompt); }}
              disabled={isTyping}
              className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-2xl border border-divider bg-card/40 text-muted-foreground hover:text-orange-600 hover:border-orange-500/30 transition-all shadow-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Suggestions after a report is generated */}
      {interaction.type === 'none' && localMessages.length > 0 && localMessages[localMessages.length - 1]?.downloadConfig && (
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar flex-shrink-0">
          <motion.button whileHover={{ y: -2 }} onClick={() => { setLocalMessages(prev => [...prev, { role: 'user', content: 'Quiero otro reporte' }]); setInteraction({ type: 'select_report' }); setLocalMessages(prev => [...prev, { role: 'assistant', content: '¿Qué otro reporte necesitas?', isAction: true }]); }}
            className="px-4 py-2 text-[11px] font-bold rounded-xl border border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100 transition-all whitespace-nowrap"
          >📊 Otro reporte</motion.button>
          <motion.button whileHover={{ y: -2 }} onClick={() => { setInput('¿Cuáles son las facturas vencidas?'); }}
            className="px-4 py-2 text-[11px] font-bold rounded-xl border border-divider bg-card/40 text-muted-foreground hover:text-orange-600 transition-all whitespace-nowrap"
          >📄 Facturas vencidas</motion.button>
          <motion.button whileHover={{ y: -2 }} onClick={() => { setInput('Estado de mis cuentas bancarias'); }}
            className="px-4 py-2 text-[11px] font-bold rounded-xl border border-divider bg-card/40 text-muted-foreground hover:text-orange-600 transition-all whitespace-nowrap"
          >🏦 Cuentas bancarias</motion.button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative mt-2 flex-shrink-0 pb-2">
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
        <input 
          ref={inputRef} 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder={interaction.type !== 'none' ? 'Selecciona una opción arriba o escribe aquí...' : 'Consulta reportes, balances o gestión contable...'} 
          className="w-full pl-11 pr-14 py-4 text-sm bg-card dark:bg-zinc-900 border border-divider dark:border-white/5 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all shadow-xl" 
          disabled={isTyping || interaction.type === 'downloading'} 
        />
        <button 
          type="submit" 
          disabled={isTyping || !input.trim() || interaction.type === 'downloading'} 
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-40 transition-all shadow-lg shadow-orange-500/30"
        >
          {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
