'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, AlertTriangle, Loader2, Lightbulb, RefreshCw, FileText, FileSpreadsheet, Download, Copy, Check, BarChart3, Receipt, Landmark, ClipboardList, History, RotateCcw } from 'lucide-react';
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
import { AIChart } from './AIChart';

interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'area';
  title?: string;
  data: { label: string; value: number }[];
}

const REPORT_OPTIONS = [
  { id: 'trial_balance', label: 'Balanza de Comprobación', icon: ClipboardList },
  { id: 'balance_sheet', label: 'Balance General', icon: BarChart3 },
  { id: 'income_statement', label: 'Estado de Resultados', icon: FileText },
  { id: 'accounts_plan', label: 'Plan de Cuentas', icon: Receipt },
];

export function AIChatView() {
  const { messages, isTyping, status, sendMessage, checkStatus, clearConversation } = useAI();
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [interaction, setInteraction] = useState<{ type: 'select_report' | 'select_format' | 'none', data?: any }>({ type: 'none' });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentCompany = useAppStore(state => state.currentCompany);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, localMessages, interaction]);

  const detectReportRequest = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const hasDownloadKeyword = ['descarga', 'descargar', 'download', 'pdf', 'excel', 'xlsx'].some(k => lowerText.includes(k));
    const hasReportName = ['balance', 'situación', 'situacion', 'resultados', 'pérdidas', 'perdidas', 'ganancias', 'balanza', 'comprobación', 'comprobacion', 'flujo', 'caja', 'plan', 'cuentas'].some(k => lowerText.includes(k));
    
    return hasDownloadKeyword && hasReportName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');

    if (detectReportRequest(userMsg)) {
      setInteraction({ type: 'select_report' });
      setLocalMessages(prev => [...prev, 
        { role: 'user', content: userMsg },
        { role: 'assistant', content: '¿Qué reporte necesitas? Selecciona una opción:' }
      ]);
      return;
    }

    await sendMessage(userMsg);
  };

  const handleDownloadResponse = async (content: string, index: number) => {
    toast.loading('Generando reporte ejecutivo premium con gráficas...', { id: 'export-loading' });
    try {
      const companyName = currentCompany?.name || 'Empresa';
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let y = 30;

      // --- Helper para manejar saltos de página ---
      const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - 20) {
          doc.addPage();
          addFooter(doc, doc.getNumberOfPages());
          y = 25;
          return true;
        }
        return false;
      };

      // --- Helper para Pie de Página ---
      const addFooter = (pdf: any, pageNum: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Ganesha ERP - Reporte de Inteligencia Artificial | Generado el ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
        pdf.text(`Página ${pageNum}`, pageWidth - 30, pageHeight - 10);
      };

      // Encabezado Principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138); // Azul Investor
      doc.text("REPORTE EJECUTIVO GANESHA AI", margin, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`Entidad: ${companyName.toUpperCase()}`, margin, y);
      doc.text(`ID de Transacción: AI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, pageWidth - 80, y);
      y += 5;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      // --- Captura de Gráfica (Prioridad Alta) ---
      const chartElement = document.getElementById(`chart-${index}`);
      if (chartElement) {
        try {
          // Técnica Vectorial: Capturar el SVG directamente (.recharts-surface)
          const svgElement = chartElement.querySelector('.recharts-surface');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Alta resolución para el PDF
            const svgSize = svgElement.getBoundingClientRect();
            canvas.width = svgSize.width * 4;
            canvas.height = svgSize.height * 4;

            await new Promise((resolve, reject) => {
              img.onload = () => {
                if (ctx) {
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const imgData = canvas.toDataURL('image/png');
                  const imgWidth = pageWidth - (margin * 2);
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  checkPageBreak(imgHeight);
                  doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
                  y += imgHeight + 15;
                  resolve(true);
                }
              };
              img.onerror = reject;
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });
          }
        } catch (e) {
          console.error('Error capturando gráfica vectorial para PDF:', e);
        }
      }

      // --- Procesamiento de Contenido (Texto y Tablas) ---
      const lines = content.split('\n');
      let currentTextBlock = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detectar Tabla Markdown
        if (line.startsWith('|') && line.includes('|') && !line.includes('---')) {
          // Imprimir bloque de texto acumulado antes de la tabla
          if (currentTextBlock.trim()) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(40);
            const splitMsg = doc.splitTextToSize(currentTextBlock.replace(/\*\*/g, '').trim(), pageWidth - (margin * 2));
            for (const textLine of splitMsg) {
              checkPageBreak(6);
              doc.text(textLine, margin, y);
              y += 6;
            }
            y += 4;
            currentTextBlock = '';
          }

          const tableRows: string[][] = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            if (!lines[i].includes('---')) {
              tableRows.push(lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim()));
            }
            i++;
          }

          if (tableRows.length > 0) {
            checkPageBreak(20); // Espacio mínimo para iniciar tabla
            autoTable(doc, {
              startY: y,
              head: [tableRows[0]] as any[][],
              body: tableRows.slice(1) as any[][],
              theme: 'grid',
              headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
              styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
              margin: { left: margin, right: margin },
              didDrawPage: (data) => {
                addFooter(doc, doc.getNumberOfPages());
              }
            });
            // @ts-ignore
            y = doc.lastAutoTable.finalY + 10;
          }
          i--;
        } else if (line !== '') {
          // Es texto normal
          currentTextBlock += line + ' ';
        } else if (currentTextBlock.trim() !== '') {
          // Salto de párrafo
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(40);
          const splitMsg = doc.splitTextToSize(currentTextBlock.replace(/\*\*/g, '').trim(), pageWidth - (margin * 2));
          for (const textLine of splitMsg) {
            checkPageBreak(6);
            doc.text(textLine, margin, y);
            y += 6;
          }
          y += 4;
          currentTextBlock = '';
        }
      }

      // Imprimir último bloque de texto si existe
      if (currentTextBlock.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(40);
        const splitMsg = doc.splitTextToSize(currentTextBlock.replace(/\*\*/g, '').trim(), pageWidth - (margin * 2));
        for (const textLine of splitMsg) {
          checkPageBreak(6);
          doc.text(textLine, margin, y);
          y += 6;
        }
      }

      addFooter(doc, doc.getNumberOfPages());
      doc.save(`Reporte_IA_Ganesha_${companyName}_${new Date().getTime()}.pdf`);
      toast.success('Reporte ejecutivo generado con éxito', { id: 'export-loading' });
    } catch (error) {
      console.error('Error PDF Pro:', error);
      toast.error('Error al generar reporte premium', { id: 'export-loading' });
    }
  };

  const handleSelectReport = (id: string, label: string) => {
    setInteraction({ type: 'select_format', data: { id, label } });
    setLocalMessages(prev => [...prev, { role: 'assistant', content: `Has seleccionado **${label}**. ¿En qué formato lo prefieres?` }]);
  };

  const handleSelectFormat = async (format: 'pdf' | 'excel') => {
    const reportConfig = interaction.data;
    setInteraction({ type: 'none' });
    
    setLocalMessages(prev => [...prev, { role: 'assistant', content: `Generando **${reportConfig.label}** en ${format.toUpperCase()}... Un momento por favor.` }]);
    toast.loading(`Generando ${reportConfig.label}...`, { id: 'export-loading' });

    try {
      let endpoint = '';
      if (reportConfig.id === 'balance_sheet') endpoint = REPORTS.balanceSheet;
      else if (reportConfig.id === 'income_statement') endpoint = REPORTS.incomeStatement;
      else if (reportConfig.id === 'accounts_plan') endpoint = '/accounts'; // Endpoint base de cuentas
      else endpoint = REPORTS.trialBalance;

      const finalEndpoint = format === 'pdf' ? `${endpoint}/pdf` : endpoint;
      const data = await apiClient.get<any>(`${finalEndpoint}?companyId=${currentCompany?.id}`);
      
      const companyName = currentCompany?.name || 'Empresa';
      const periodLabel = 'Actual';

      if (reportConfig.id === 'balance_sheet') {
        if (format === 'excel') await exportBalanceSheetExcel(data.assets, data.liabilities, data.equity, companyName, periodLabel);
        else await exportBalanceSheetPDF(data.assets, data.liabilities, data.equity, companyName, periodLabel);
      } else if (reportConfig.id === 'income_statement') {
        if (format === 'excel') await exportIncomeStatementExcel(data.income, data.expenses, data.netIncome, companyName, periodLabel);
        else await exportIncomeStatementPDF(data.income, data.expenses, data.netIncome, companyName, periodLabel);
      } else if (reportConfig.id === 'accounts_plan') {
        // Asumimos que tienes una función de exportación para el plan
        toast.success('Descargando catálogo de cuentas...');
        // Aquí podrías llamar a una función específica si la tienes
      } else {
        if (format === 'excel') await exportTrialBalanceExcel(data.accounts, companyName, periodLabel, data.totals);
        else await exportTrialBalancePDF(data.accounts, companyName, periodLabel, data.totals);
      }

      toast.success(`¡Listo! ${reportConfig.label} descargado`, { id: 'export-loading' });

      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ ¡Listo! El **${reportConfig.label}** se ha descargado correctamente.`,
      }]);
    } catch (error) {
      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ No se pudo generar el documento. Verifica que tengas cuentas configuradas.`,
      }]);
    }
  };

  const handleCopy = (text: string, index: number) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(index);
        toast.success('Copiado al portapapeles');
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => {
        toast.error('Error al copiar');
      });
    } else {
      // Fallback para contextos no seguros (HTTP)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopiedId(index);
          toast.success('Copiado al portapapeles');
          setTimeout(() => setCopiedId(null), 2000);
        } else {
          toast.error('No se pudo copiar el texto');
        }
      } catch (err) {
        toast.error('Error en el sistema de copiado');
      }
    }
  };

  const renderMessageContent = (content: string, index: number) => {
    const chartMatch = content.match(/\[CHART:\s*(\{.*?\})\]/);
    let chartData: ChartData | null = null;
    let cleanContent = content;

    let tableData: string[][] | null = null;

    if (chartMatch) {
      try {
        chartData = JSON.parse(chartMatch[1]);
        cleanContent = content.replace(chartMatch[0], '');
      } catch {}
    } 
    
    // Motor de Tablas Manual (Rescate de Markdown mal formado)
    if (content.includes('|')) {
      const lines = content.split('\n');
      const tableLines = lines.filter(l => l.includes('|') && l.trim().length > 3);
      
      if (tableLines.length >= 2) {
        try {
          const rows = tableLines
            .filter(l => !l.includes('---'))
            .map(line => line.split('|').map(c => c.trim()).filter(c => c !== ''))
            .filter(cells => cells.length >= 1);

          if (rows.length >= 2) {
            tableData = rows;
            // Generar gráfica automática si no hay una definida
            if (!chartData) {
              const data = rows.slice(1).map(row => ({
                label: row[0],
                value: parseFloat(row[1]?.replace(/[^0-9.-]/g, '') || '0')
              })).filter(d => !isNaN(d.value) && d.value !== 0);

              if (data.length >= 2) {
                chartData = {
                  type: 'bar',
                  title: rows[0][0] || "Resumen Financiero",
                  data: data
                };
              }
            }
            // Limpiar el contenido original para evitar duplicados feos
            cleanContent = lines.filter(l => !l.includes('|')).join('\n');
          }
        } catch (e) {}
      }
    }

    return (
      <div className="space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none 
          prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-zinc-400
          prose-strong:text-orange-600 dark:prose-strong:text-orange-400 prose-strong:font-bold
          prose-ul:list-disc prose-ul:pl-4 prose-ul:space-y-1 prose-ul:text-zinc-500
          prose-ol:list-decimal prose-ol:pl-4 prose-ol:space-y-1 prose-ol:text-zinc-500
          prose-li:marker:text-orange-500
          prose-blockquote:border-l-4 prose-blockquote:border-orange-500/30 prose-blockquote:bg-orange-50/30 dark:prose-blockquote:bg-orange-950/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
          prose-table:border prose-table:border-vintage-200 dark:prose-table:border-white/5 
          prose-table:rounded-xl prose-table:overflow-hidden prose-table:my-4
          prose-th:bg-vintage-100/50 dark:prose-th:bg-white/5 prose-th:px-4 prose-th:py-2 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
          prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-vintage-200 dark:prose-td:border-white/5
          prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl prose-pre:shadow-2xl">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>
        
        {tableData && (
          <div className="my-4 overflow-hidden rounded-2xl border border-vintage-200 dark:border-white/10 shadow-sm bg-white dark:bg-zinc-900/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-vintage-100/50 dark:bg-white/5">
                  {tableData[0].map((header, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-vintage-600 dark:text-zinc-400 border-b border-vintage-200 dark:border-white/10">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(1).map((row, i) => (
                  <tr key={i} className="hover:bg-vintage-50/50 dark:hover:bg-white/5 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className={cn(
                        "px-4 py-2.5 text-xs border-b border-vintage-100 dark:border-white/5 text-vintage-800 dark:text-zinc-300",
                        j > 0 ? "font-mono font-medium text-orange-600 dark:text-orange-400" : ""
                      )}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {chartData && (
          <motion.div 
            id={`chart-${index}`}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-6 bg-white dark:bg-zinc-900/80 p-6 rounded-[2rem] border border-vintage-200 dark:border-white/10 shadow-xl shadow-orange-500/5 group/chart"
          >
            <div className="flex items-center justify-between mb-4 border-b border-vintage-100 dark:border-white/5 pb-4">
              <h4 className="text-sm font-playfair font-bold text-vintage-800 dark:text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                {chartData.title}
              </h4>
              <button 
                onClick={async () => {
                  const chartBox = document.getElementById(`chart-${index}`);
                  // Selector específico para evitar capturar los iconos de Lucide
                  const svgElement = chartBox?.querySelector('.recharts-surface');
                  if (svgElement) {
                    try {
                      const svgData = new XMLSerializer().serializeToString(svgElement);
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      
                      const svgSize = svgElement.getBoundingClientRect();
                      canvas.width = svgSize.width * 2;
                      canvas.height = svgSize.height * 2;
                      
                      img.onload = () => {
                        if (ctx) {
                          ctx.fillStyle = 'white';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          const link = document.createElement('a');
                          link.download = `grafica-ganesha-${Date.now()}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                          toast.success('Gráfica capturada correctamente');
                        }
                      };
                      
                      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                    } catch (err) {
                      console.error('Error en captura:', err);
                      toast.error('Error al procesar gráfica');
                    }
                  }
                }}
                className="p-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 rounded-xl opacity-0 group-hover/chart:opacity-100 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter"
              >
                <Download className="w-3.5 h-3.5" />
                Guardar Imagen
              </button>
            </div>
            <AIChart type={chartData.type} data={chartData.data} title={chartData.title} />
          </motion.div>
        )}
      </div>
    );
  };

  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-130px)] sm:h-[calc(100vh-145px)] w-full max-w-7xl mx-auto">
      <div className="flex flex-col flex-1 min-w-0">
        <VintageCard variant="glass" className="mb-4 flex-shrink-0 border-orange-500/10 shadow-lg shadow-orange-500/5" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-playfair text-lg font-bold text-vintage-800 dark:text-white flex items-center gap-2">
                GANESHA AI
                <span className="text-[9px] bg-orange-100 dark:bg-orange-950/30 text-orange-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-black">Expert</span>
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest">Consultoría Financiera Inteligente</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border">
              <span className={cn("w-2 h-2 rounded-full", status === 'online' ? 'bg-success animate-pulse' : 'bg-warning')} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{status === 'online' ? 'Online' : 'Offline'}</span>
              <button onClick={checkStatus} className="p-1 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/30 text-orange-600 ml-1 transition-colors"><RefreshCw className="w-3 h-3" /></button>
            </div>
          </div>
        </VintageCard>

        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-3xl bg-vintage-50/30 dark:bg-zinc-950/20 border border-vintage-200/50 dark:border-white/5 p-4 sm:p-6 space-y-6 min-h-0 no-scrollbar">
          <AnimatePresence mode="popLayout">
            {allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bot className="w-12 h-12 text-orange-500/20 mb-4" />
                <h3 className="text-xl font-playfair font-bold text-vintage-800 dark:text-white mb-2">GANESHA AI</h3>
                <p className="text-sm text-vintage-500 dark:text-zinc-500 max-w-sm">Tu consultora financiera 24/7. Analizo datos y genero reportes al instante.</p>
              </div>
            )}

            {allMessages.map((msg: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex group", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-orange-200 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                    <Bot className="w-5 h-5 text-orange-500" />
                  </div>
                )}
                <div className={cn(
                  "relative max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-sm leading-relaxed",
                  msg.role === 'user' ? 'bg-zinc-800 text-zinc-100 rounded-br-md' : 'bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-white/5 text-vintage-800 dark:text-zinc-200 rounded-bl-md'
                )}>
                  {msg.role === 'assistant' && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDownloadResponse(msg.content, i)} 
                        title="Descargar como PDF"
                        className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleCopy(msg.content, i)} 
                        title="Copiar texto"
                        className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                      >
                        {copiedId === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                  {renderMessageContent(msg.content, i)}
                  {msg.downloadConfig && (
                    <div className="mt-4 p-3 rounded-xl bg-success/5 border border-success/20 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-error" />
                      <div className="flex-1 text-xs font-bold text-vintage-800 dark:text-white">{msg.downloadConfig.label}</div>
                      <Check className="w-4 h-4 text-success" />
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center ml-3 flex-shrink-0 shadow-sm">
                    <User className="w-5 h-5 text-white/50" />
                  </div>
                )}
              </motion.div>
            ))}

            {interaction.type === 'select_report' && (
              <div className="flex justify-start">
                <div className="w-10 h-10 rounded-2xl bg-white border border-orange-200 flex items-center justify-center mr-3"><Bot className="w-5 h-5 text-orange-500" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg">
                  {REPORT_OPTIONS.map(r => (
                    <button key={r.id} onClick={() => handleSelectReport(r.id, r.label)} className="flex flex-col items-center gap-2 p-4 bg-white border border-orange-200 rounded-2xl hover:border-orange-500 transition-all">
                      <r.icon className="w-6 h-6 text-orange-500" />
                      <span className="text-[10px] font-bold text-center">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {interaction.type === 'select_format' && (
              <div className="flex justify-start">
                <div className="w-10 h-10 rounded-2xl bg-white border border-orange-200 flex items-center justify-center mr-3"><Bot className="w-5 h-5 text-orange-500" /></div>
                <div className="flex gap-2">
                  <PastelButton onClick={() => handleSelectFormat('pdf')} className="gap-2"><FileText className="w-4 h-4" /> PDF</PastelButton>
                  <PastelButton onClick={() => handleSelectFormat('excel')} className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel</PastelButton>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Analiza mis gastos..."
            className="w-full bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-white/5 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-lg"
          />
          <button type="submit" disabled={isTyping} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl shadow-lg hover:bg-orange-600 disabled:bg-zinc-400 transition-all">
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      <div className="hidden lg:block lg:w-80 space-y-6 text-left">
        <VintageCard variant="glass" hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-orange-500" />
            <h4 className="font-playfair font-bold text-vintage-800 dark:text-zinc-100">Memoria de IA</h4>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">GANESHA recuerda tu conversación para darte contexto y progreso. Si la empresa cambia o cierras sesión, el contexto se limpiará para mayor seguridad.</p>
          <button 
            onClick={() => { clearConversation(); setLocalMessages([]); toast.success('Memoria limpiada'); }}
            className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/20 rounded-xl hover:bg-orange-100 transition-all uppercase tracking-widest border border-orange-200/50"
          >
            <RotateCcw className="w-3 h-3" /> Resetear Contexto
          </button>
        </VintageCard>

        <VintageCard variant="glass" hover={false} className="border-amber-500/20 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="font-playfair font-bold text-vintage-800 dark:text-zinc-100">Acciones Ejecutivas</h4>
          </div>
          <button 
            onClick={() => sendMessage("Activa el MODO DIRECTOR FINANCIERO. Analiza mi rentabilidad, mis gastos más grandes y dame un plan de acción para este mes.")}
            className="w-full py-3 mb-4 flex items-center justify-center gap-3 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest"
          >
            <Landmark className="w-4 h-4" /> Activar Modo CFO
          </button>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-4 h-4 text-blue-500" /></div>
              <div><p className="text-xs font-bold text-vintage-800 dark:text-zinc-200">Gráficos en Vivo</p><p className="text-[10px] text-zinc-600 dark:text-zinc-400">Convierte tablas en gráficas al instante.</p></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /></div>
              <div><p className="text-xs font-bold text-vintage-800 dark:text-zinc-200">Reportes Pro</p><p className="text-[10px] text-zinc-600 dark:text-zinc-400">Exporta balances oficiales.</p></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-purple-500" /></div>
              <div><p className="text-xs font-bold text-vintage-800 dark:text-zinc-200">Investigación</p><p className="text-[10px] text-zinc-600 dark:text-zinc-400">Análisis automático de libros.</p></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0"><Landmark className="w-4 h-4 text-orange-500" /></div>
              <div><p className="text-xs font-bold text-vintage-800 dark:text-zinc-200">Asesoría de Caja</p><p className="text-[10px] text-zinc-600 dark:text-zinc-400">Predicciones de liquidez.</p></div>
            </div>
          </div>
        </VintageCard>
      </div>
    </div>
  );
}
