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
  const [showWelcome, setShowWelcome] = useState(true);
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
    setShowWelcome(false);

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

  const handleExportFullChat = async () => {
    toast.loading('Generando historial de chat premium...', { id: 'export-full' });
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const doc = new jsPDF();
      const companyName = currentCompany?.name || 'Empresa';
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let y = 30;

      // Header
      doc.setFillColor(30, 58, 138); // Blue
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GANESHA AI - HISTORIAL DE CONSULTORÍA', margin, 15);
      doc.setFontSize(8);
      doc.text(`Empresa: ${companyName.toUpperCase()} | Fecha: ${new Date().toLocaleString()}`, margin, 20);

      const allMsgs = [...messages, ...localMessages];
      
      for (let i = 0; i < allMsgs.length; i++) {
        const msg = allMsgs[i];
        
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }

        // Role Indicator
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.text(msg.role === 'user' ? 'CLIENTE:' : 'GANESHA AI:', margin, y);
        y += 5;

        // Content
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const splitText = doc.splitTextToSize(msg.content.replace(/\[CHART:.*?\]/g, '[Gráfica Generada]'), pageWidth - (margin * 2));
        doc.text(splitText, margin, y);
        y += (splitText.length * 5) + 10;

        // If message has charts, try to capture them
        if (msg.content.includes('[CHART')) {
          const chartBlocks = Array.from(msg.content.matchAll(/\[CHART:?[\s\S]*?\]/g));
          for (let j = 0; j < chartBlocks.length; j++) {
            const chartEl = document.getElementById(`chart-${i}-${j}`);
            if (chartEl) {
              try {
                // Add a small delay to ensure chart is rendered
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const { toPng } = await import('html-to-image');
                const imgData = await toPng(chartEl, { 
                  quality: 0.95,
                  backgroundColor: '#ffffff',
                  pixelRatio: 2,
                  cacheBust: true,
                });
                
                const imgWidth = pageWidth - (margin * 2);
                const imgHeight = (chartEl.offsetHeight * imgWidth) / chartEl.offsetWidth;

                if (y + imgHeight > pageHeight - 20) {
                  doc.addPage();
                  y = 20;
                }

                doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 10;
              } catch (err) {
                console.error('Error capturando gráfica en exportación total:', err);
              }
            }
          }
          y += 5;
        }
      }

      const fileName = `Reporte_GaneshaAI_${Date.now()}.pdf`;
      // Use native save() instead of Blob/saveAs to avoid "klob" issues
      doc.save(fileName);
      
      toast.success('Historial exportado con éxito', { id: 'export-full' });
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar historial', { id: 'export-full' });
    }
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

      // --- Captura de Gráficas (Soporte para Gráficas Explícitas y Auto-generadas) ---
      for (let j = 0; j < 3; j++) {
        const chartId = `chart-${index}-${j}`;
        const chartEl = document.getElementById(chartId);
        
        if (chartEl) {
          try {
            // Espera mayor para móviles
            await new Promise(resolve => setTimeout(resolve, 600));
            
            const { toCanvas } = await import('html-to-image');
            // Capturamos con toCanvas que es más estable en dispositivos móviles
            const canvas = await toCanvas(chartEl, { 
              backgroundColor: '#ffffff',
              pixelRatio: 1.5, // Balance entre calidad y memoria en móvil
              filter: (node) => {
                const tagName = node.tagName ? node.tagName.toLowerCase() : '';
                // Filtramos botones y decoraciones para una imagen limpia
                return tagName !== 'button' && !node.classList?.contains('animate-pulse');
              },
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Tamaño optimizado: Máximo 140mm de ancho para que no se vea "gigante"
            const maxImgWidth = 140;
            let imgWidth = pageWidth - (margin * 2);
            if (imgWidth > maxImgWidth) imgWidth = maxImgWidth;
            
            const imgHeight = (chartEl.offsetHeight * imgWidth) / chartEl.offsetWidth;
            const xOffset = (pageWidth - imgWidth) / 2; // Centrado horizontal

            checkPageBreak(imgHeight + 10);
            doc.addImage(imgData, 'JPEG', xOffset, y, imgWidth, imgHeight);
            y += imgHeight + 15;
          } catch (err) {
            console.error(`Error capturando gráfica ${chartId}:`, err);
          }
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
      
      const fileName = `Analisis_GaneshaAI_${Date.now()}.pdf`;
      // Use native save() to avoid "klob" issues
      doc.save(fileName);

      toast.success('Análisis exportado con éxito', { id: 'export-loading' });
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
    let chartDatas: ChartData[] = [];
    let cleanContent = content;

    // Extracción robusta de bloques [CHART ... ]
    let pos = 0;
    const startTag = "[CHART";
    while ((pos = cleanContent.indexOf(startTag, pos)) !== -1) {
      let bracketCount = 0;
      let endPos = -1;
      
      for (let i = pos; i < cleanContent.length; i++) {
        if (cleanContent[i] === '[') bracketCount++;
        else if (cleanContent[i] === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            endPos = i;
            break;
          }
        }
      }

      if (endPos !== -1) {
        const fullTag = cleanContent.substring(pos, endPos + 1);
        const innerContent = fullTag.replace(/^\[CHART:?\s*/, '').replace(/\]$/, '').trim();
        
        try {
          const data = JSON.parse(innerContent);
          if (data && (data.type as string) === 'circle') data.type = 'pie';
          chartDatas.push(data);
          cleanContent = cleanContent.replace(fullTag, '');
          // No incrementamos pos porque acabamos de recortar el string
        } catch (e) {
          console.error('[AIChat] Error parsing chart JSON. Inner:', innerContent, e);
          pos = endPos + 1;
        }
      } else {
        pos += startTag.length;
      }
    }

    let tableData: string[][] | null = null;
    
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
            if (chartDatas.length === 0) {
              const data = rows.slice(1).map(row => ({
                label: row[0],
                value: parseFloat(row[1]?.replace(/[^0-9.-]/g, '') || '0')
              })).filter(d => !isNaN(d.value) && d.value !== 0);

              if (data.length >= 2) {
                chartDatas.push({
                  type: 'bar',
                  title: rows[0][0] || "Resumen Financiero",
                  data: data
                });
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
          prose-p:leading-relaxed prose-p:text-muted-foreground
          prose-strong:text-primary prose-strong:font-bold
          prose-ul:list-disc prose-ul:pl-4 prose-ul:space-y-1 prose-ul:text-muted-foreground/80
          prose-ol:list-decimal prose-ol:pl-4 prose-ol:space-y-1 prose-ol:text-muted-foreground/80
          prose-li:marker:text-primary
          prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
          prose-table:border prose-table:border-border/50 
          prose-table:rounded-xl prose-table:overflow-hidden prose-table:my-4
          prose-th:bg-muted dark:prose-th:bg-white/5 prose-th:px-4 prose-th:py-2 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
          prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border/50
          prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:shadow-2xl">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>
        
        {tableData && (
          <div className="my-4 overflow-hidden rounded-2xl border border-border shadow-sm bg-card/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted">
                  {tableData[0].map((header, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(1).map((row, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className={cn(
                        "px-4 py-2.5 text-xs border-b border-border/50 text-foreground",
                        j > 0 ? "font-mono font-medium text-primary" : ""
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

        {chartDatas.map((chart, chartIdx) => (
          <motion.div 
            key={chartIdx}
            id={`chart-${index}-${chartIdx}`}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-6 bg-card p-6 rounded-[2rem] border border-border shadow-xl shadow-primary/5 group/chart"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {chart.title}
              </h4>
              <button 
                onClick={async () => {
                  const chartBox = document.getElementById(`chart-${index}-${chartIdx}`);
                  if (chartBox) {
                    try {
                      toast.loading('Preparando imagen...', { id: 'chart-snap' });
                      const { toPng } = await import('html-to-image');
                      
                      const dataUrl = await toPng(chartBox, { 
                        quality: 1,
                        backgroundColor: '#ffffff',
                        pixelRatio: 4
                      });
                      
                      const link = document.createElement('a');
                      link.download = `ganesha-analisis-${chart.title?.toLowerCase().replace(/\s+/g, '-') || 'grafica'}.png`;
                      link.href = dataUrl;
                      link.click();
                      toast.success('Gráfica descargada', { id: 'chart-snap' });
                    } catch (err) {
                      console.error('Capture Error:', err);
                      toast.error('Error al generar imagen', { id: 'chart-snap' });
                    }
                  }
                }}
                className="p-2 bg-primary/10 text-primary rounded-xl opacity-0 group-hover/chart:opacity-100 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter"
              >
                <Download className="w-3.5 h-3.5" />
                Guardar Imagen
              </button>
            </div>
            <AIChart type={chart.type} data={chart.data} title={chart.title} />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] max-w-7xl mx-auto px-4 sm:px-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Chat Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                Asistente Ganesha AI
                <span className={cn(
                  "flex h-2 w-2 rounded-full",
                  status === 'online' ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
              </h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {status === 'online' ? 'Inteligencia Financiera Elite' : 'Reconectando con Ganesha...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportFullChat}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-primary flex items-center gap-2 text-xs font-bold"
              title="Exportar Todo el Chat"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <button 
              onClick={clearConversation}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              title="Limpiar conversación"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth no-scrollbar"
        >
          {showWelcome && messages.length === 0 && localMessages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto py-12 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-6 flex items-center justify-center shadow-inner">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2 font-playfair">¡Bienvenido a Ganesha AI!</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Tu consultor financiero personal. ¿En qué puedo apoyarte hoy?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {[
                  "¿Cuál es mi utilidad neta este mes?",
                  "Dime mis 5 gastos principales",
                  "¿Cómo está mi balance de bancos?",
                  "Genera un reporte de situación financiera"
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      handleSubmit({ preventDefault: () => {} } as any);
                    }}
                    className="p-4 text-xs font-bold text-left bg-card/80 border border-border rounded-2xl hover:border-primary transition-all hover:shadow-xl group backdrop-blur-sm"
                  >
                    <span className="text-primary/40 group-hover:text-primary mr-2">✦</span>
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {[...messages, ...localMessages].map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                className={cn(
                  "flex items-start gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  msg.role === 'user' ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={cn(
                  "relative max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl shadow-sm border",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none" 
                    : "bg-card/90 backdrop-blur-md border-border/50 rounded-tl-none text-foreground"
                )}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {renderMessageContent(msg.content, idx)}
                  </div>

                  {msg.role === 'assistant' && !isTyping && (
                    <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-3">
                      <button 
                        onClick={() => handleDownloadResponse(msg.content, idx)}
                        className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF Pro
                      </button>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copiado'); }}
                        className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shadow-inner">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
                <div className="px-5 py-3 bg-muted/50 backdrop-blur-sm rounded-2xl rounded-tl-none border border-border/50">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </motion.div>
            )}

            {interaction.type === 'select_report' && (
              <div className="flex justify-start pl-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {REPORT_OPTIONS.map(r => (
                    <button 
                      key={r.id} 
                      onClick={() => handleSelectReport(r.id, r.label)} 
                      className="flex items-center gap-3 p-4 bg-card/80 border border-border rounded-2xl hover:border-primary hover:shadow-xl transition-all text-left backdrop-blur-sm group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <r.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {interaction.type === 'select_format' && (
              <div className="flex justify-start pl-14">
                <div className="flex gap-3">
                  <PastelButton onClick={() => handleSelectFormat('pdf')} className="gap-2 h-12 px-6 rounded-2xl shadow-lg hover:scale-105 bg-primary text-primary-foreground border-none"><FileText className="w-4 h-4" /> PDF Ejecutivo</PastelButton>
                  <PastelButton onClick={() => handleSelectFormat('excel')} className="gap-2 h-12 px-6 rounded-2xl shadow-lg hover:scale-105 bg-accent text-accent-foreground border-none"><FileSpreadsheet className="w-4 h-4" /> Excel Profesional</PastelButton>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-card/60 backdrop-blur-md border-t border-border/50">
          <form onSubmit={handleSubmit} className="relative group max-w-3xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta a la IA sobre tus finanzas..."
              className="w-full bg-background border border-input rounded-[1.5rem] py-5 pl-7 pr-16 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-xl placeholder:text-muted-foreground/50"
            />
            <button 
              type="submit" 
              disabled={isTyping} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:scale-105 disabled:bg-muted transition-all"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-bold">Potenciado por Ganesha Enterprise AI Engine</p>
        </div>
      </div>

      {/* Right Sidebar - Desktop Only */}
      <div className="hidden lg:flex flex-col w-80 space-y-6">
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-foreground">Memoria de IA</h4>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">La IA mantiene el contexto de tu empresa actual para darte respuestas personalizadas y profundas.</p>
          <div className="p-3 bg-muted rounded-xl border border-border mb-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground">
              <Landmark className="w-3.5 h-3.5" /> {currentCompany?.name}
            </div>
          </div>
          <button 
            onClick={() => { clearConversation(); setLocalMessages([]); toast.success('Memoria limpiada'); }}
            className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black text-primary bg-background border border-primary/20 rounded-xl hover:bg-muted transition-all uppercase tracking-widest"
          >
            <RotateCcw className="w-3 h-3" /> Resetear Memoria
          </button>
        </div>

        <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
            <h4 className="font-bold">Acciones CFO Pro</h4>
          </div>
          <p className="text-[10px] text-primary-foreground/70 mb-4 leading-relaxed">Activa análisis profundos de rentabilidad y proyecciones de flujo de caja automáticas.</p>
          <button 
            onClick={() => sendMessage("Activa el MODO DIRECTOR FINANCIERO. Analiza mi rentabilidad, mis gastos más grandes y dame un plan de acción para este mes.")}
            className="w-full py-4 mb-4 flex items-center justify-center gap-3 text-xs font-black text-primary bg-background rounded-xl hover:scale-105 transition-all shadow-lg uppercase tracking-widest"
          >
            Modo CFO Pro
          </button>
          <div className="space-y-3 opacity-90">
            {[
              { icon: BarChart3, t: "Gráficos", d: "Visualiza tus datos" },
              { icon: FileSpreadsheet, t: "Reportes", d: "Excel y PDF oficial" },
              { icon: Receipt, t: "Gastos", d: "Detección de anomalías" }
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><item.icon className="w-4 h-4" /></div>
                <div><p className="text-xs font-bold">{item.t}</p><p className="text-[9px] opacity-60">{item.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
