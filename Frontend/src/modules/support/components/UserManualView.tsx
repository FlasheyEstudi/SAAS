'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, ArrowLeft, PlayCircle, BookOpen, CheckCircle2, 
  AlertCircle, FileText, ChevronRight, Zap, Sparkles,
  Smartphone, Monitor, ShieldCheck, PieChart, Users,
  CreditCard, Banknote, History, Lightbulb, MousePointer2,
  Lock, RefreshCcw, Download, Share2, MessageSquare,
  Layers, Plus, Search, Filter, MoreVertical, LayoutDashboard,
  Terminal, Code2, Cpu, Database, Binary, Shield, Boxes,
  GitBranch, Server, Globe, Calculator, Network, FileSpreadsheet,
  FileBox, GanttChartSquare, BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { cn } from '@/lib/utils';

// --- COMPONENTES DE CÓDIGO (Snippets Reales del Núcleo) ---

const CodeSnippet = ({ title, code, language = "typescript" }: { title: string, code: string, language?: string }) => (
  <div className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden my-6 group hover:border-primary/30 transition-all">
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</span>
      </div>
      <Terminal className="w-3 h-3 text-zinc-600" />
    </div>
    <pre className="p-6 font-mono text-[10px] text-primary/80 leading-relaxed overflow-x-auto custom-scrollbar bg-black/40">
      <code>{code}</code>
    </pre>
  </div>
);

const FlowStep = ({ title, desc, children, stepNumber, active, codeSnippet }: { title: string, desc: string, children?: React.ReactNode, stepNumber: string, active: boolean, codeSnippet?: { title: string, code: string } }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className={cn(
      "grid lg:grid-cols-[1fr_500px] gap-12 items-start py-20 border-b border-white/5",
      !active && "opacity-60 transition-opacity"
    )}
  >
     <div className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(234,88,12,0.3)]">
              {stepNumber}
           </div>
           <h3 className="text-3xl font-black uppercase tracking-tighter">{title}</h3>
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed font-medium">
           {desc}
        </p>
        
        {codeSnippet && (
          <CodeSnippet title={codeSnippet.title} code={codeSnippet.code} />
        )}

        <div className="flex gap-4">
           <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
             <Cpu className="w-3 h-3" /> Motor del Núcleo
           </div>
           <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
             <Shield className="w-3 h-3" /> Validación HMAC
           </div>
        </div>
     </div>
     
     <div className="relative group lg:sticky lg:top-32">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-30 transition-opacity" />
        <div className="relative z-10 p-2 bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
           <div className="bg-zinc-900/80 rounded-[2rem] border border-white/5 overflow-hidden min-h-[300px] flex items-center justify-center p-8">
              {children}
           </div>
        </div>
     </div>
  </motion.div>
);

export function UserManualView() {
  const navigate = useAppStore((s) => s.navigate);

  const setupCode = `// 1. Inicializar Empresa & Períodos
await db.company.create({ data: { name: 'Mi Imperio', taxId: '...' } });
await db.accountingPeriod.create({ 
  data: { companyId, year: 2024, month: 1, status: 'OPEN' } 
});

// 2. Cargar Catálogo (ADN Contable)
await db.account.createMany({ data: chartOfAccounts });`;

  const operationsCode = `// 3. Flujo Automático: Factura -> Póliza
const invoice = await db.invoice.create({ data: invoiceData });
const journal = await generateJournalFromInvoice(invoice.id); // Automatización Elite`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground pb-40"
    >
      {/* Cabecera Técnica */}
      <div className="sticky top-0 z-50 w-full backdrop-blur-3xl bg-background/80 border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('support')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
            <ArrowLeft className="w-4 h-4" /> Soporte
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Shield className="w-4 h-4 text-primary" />
             </div>
             <span className="text-xs font-black uppercase tracking-tighter italic">Guía de Soberanía v4.0</span>
          </div>
          <button 
            onClick={() => navigate('dashboard')}
            className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            Ir al Núcleo
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24">
        
        {/* HERO: EL MAPA DE RUTA */}
        <section className="space-y-16 mb-40">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em]">
                 <Zap className="w-3 h-3" /> Manual Maestro de Ingeniería
              </div>
              <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-[0.8] uppercase">
                 El Mapa <br/><span className="text-primary italic">Soberano.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed font-medium">
                 Bienvenido a la arquitectura de tu éxito. Ganesha Elite no es una herramienta, 
                 es un ecosistema interconectado. Sigue este mapa para dominar cada flujo de datos.
              </p>
           </div>

           {/* QUICK START CHECKLIST */}
           <VintageCard variant="premium" className="p-8 border-primary/20 bg-primary/5">
              <div className="grid md:grid-cols-4 gap-8">
                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">01. GENESIS</div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-primary" />
                       <span className="text-xs font-bold">Crea tu Empresa</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">02. ESTRUCTURA</div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-primary" />
                       <span className="text-xs font-bold">Abre Periodos & Cuentas</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">03. ACCION</div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-primary" />
                       <span className="text-xs font-bold">Registra Facturas/Pólizas</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">04. CIERRE</div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-primary" />
                       <span className="text-xs font-bold">Audita & Reporta</span>
                    </div>
                 </div>
              </div>
           </VintageCard>
        </section>

        {/* --- CAPITULOS --- */}

        <div className="space-y-40">
           
           {/* CAP 1: SETUP */}
           <FlowStep 
             stepNumber="CAP I" 
             title="Configuración de Sede" 
             desc="Tu soberanía comienza en el módulo 'Empresas'. Define tu moneda base (NIO/USD), carga tu logotipo y establece la estructura legal. El siguiente paso vital es 'Periodos Fiscales': Ganesha no permite datos huérfanos; cada movimiento debe vivir dentro de un mes abierto y controlado."
             active={true}
             codeSnippet={{
               title: "Inicialización del Sistema",
               code: setupCode
             }}
           >
              <div className="grid grid-cols-2 gap-4 w-full">
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <Globe className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Moneda</span>
                 </div>
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <Calculator className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Periodos</span>
                 </div>
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Catálogo</span>
                 </div>
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                    <Network className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Costos</span>
                 </div>
              </div>
           </FlowStep>

           {/* CAP 2: OPERACIONES */}
           <FlowStep 
             stepNumber="CAP II" 
             title="El Ciclo de Facturación" 
             desc="En 'Facturas', registras tus ventas y compras. Ganesha interconecta esto automáticamente con 'Terceros' para el control de cuentas por cobrar/pagar. Lo más potente: al validar una factura, puedes generar la póliza contable en 'Pólizas' con un solo clic, manteniendo la integridad de la partida doble."
             active={true}
             codeSnippet={{
               title: "Automatización de Pólizas",
               code: operationsCode
             }}
           >
              <div className="space-y-4 w-full">
                 <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-white/5 rounded-2xl">
                    <FileText className="w-6 h-6 text-primary" />
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                    <Users className="w-6 h-6 text-zinc-500" />
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                    <FileSpreadsheet className="w-6 h-6 text-success" />
                 </div>
                 <p className="text-[10px] text-zinc-500 italic text-center">Flujo: Factura ➡️ Tercero ➡️ Contabilidad</p>
              </div>
           </FlowStep>

           {/* CAP 3: TESORERIA */}
           <FlowStep 
             stepNumber="CAP III" 
             title="Tesorería & Activos" 
             desc="El módulo 'Bancos' es el termómetro de tu liquidez. Registra movimientos bancarios y concílialos con facturas existentes. Para inversiones a largo plazo, usa 'Activos Fijos', donde Ganesha calcula depreciaciones automáticas cada mes para que tus estados financieros siempre reflejen la realidad."
             active={true}
           >
              <div className="relative w-full aspect-video bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.1),transparent)]" />
                 <div className="flex gap-6">
                    <div className="flex flex-col items-center gap-2">
                       <CreditCard className="w-10 h-10 text-primary" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Bancos</span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex flex-col items-center gap-2">
                       <FileBox className="w-10 h-10 text-primary" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Activos</span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex flex-col items-center gap-2">
                       <GanttChartSquare className="w-10 h-10 text-primary" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Presupuestos</span>
                    </div>
                 </div>
              </div>
           </FlowStep>

           {/* CAP 4: INTELIGENCIA */}
           <FlowStep 
             stepNumber="CAP IV" 
             title="Inteligencia Forense" 
             desc="Antes del cierre, visita el 'Centro de Inteligencia'. Aquí Ganesha te alertará sobre facturas vencidas o periodos que olvidaste cerrar. Revisa los 'Reportes' (Balance, Estado de Resultados) y usa el modulo 'Auditoría' para ver quién hizo qué."
             active={true}
           >
              <div className="flex flex-col gap-4 w-full">
                 <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <div className="text-xs font-black uppercase tracking-widest">Auditoría 100% Integra</div>
                 </div>
                 <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-4">
                    <BarChart3 className="w-8 h-8 text-zinc-500" />
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Reportes Fiscales</div>
                 </div>
              </div>
           </FlowStep>

           {/* CAP 5: IA & MOVILIDAD (NUEVO) */}
           <FlowStep 
             stepNumber="CAP V" 
             title="IA Ganesha & Movilidad" 
             desc="La joya de la corona: el Asistente IA. Haz preguntas naturales como '¿Cuál es mi liquidez?' y Ganesha generará gráficas instantáneas. Además, con la v4.0, puedes descargar reportes 'PDF Pro' directamente desde tu móvil. El sistema adapta automáticamente las tablas y gráficas para que tu oficina sea tu teléfono."
             active={true}
             codeSnippet={{
               title: "Protocolo de IA Predictiva",
               code: "// Consultar salud financiera con IA\nconst analysis = await ganeshaAI.analyze(companyId);\nconst report = await analysis.exportToPDF({ quality: 'PRO', mobileOptimized: true });"
             }}
           >
              <div className="grid grid-cols-2 gap-4 w-full">
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group hover:border-primary/50 transition-colors">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase">IA Chat</span>
                 </div>
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group hover:border-primary/50 transition-colors">
                    <Smartphone className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Móvil Pro</span>
                 </div>
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group hover:border-primary/50 transition-colors">
                    <Download className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Reportes</span>
                 </div>
                 <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group hover:border-primary/50 transition-colors">
                    <PieChart className="w-8 h-8 text-primary/50" />
                    <span className="text-[9px] font-black uppercase">Auto-Charts</span>
                 </div>
              </div>
           </FlowStep>

        </div>

        {/* --- SOPORTE FINAL --- */}
        <section className="mt-64 text-center space-y-12">
           <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter">¿Listo para <span className="text-primary italic">Gobernar?</span></h2>
              <p className="text-muted-foreground">Tu imperio financiero merece la precisión de Ganesha Elite.</p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={() => navigate('dashboard')}
                className="h-16 px-12 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
              >
                 Iniciar Operaciones
              </button>
              <button 
                onClick={() => navigate('documentation')}
                className="h-16 px-12 bg-zinc-900 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
              >
                 Documentación API
              </button>
           </div>
        </section>

        <footer className="mt-64 text-center pb-20 opacity-30">
           <span className="text-[9px] font-black uppercase tracking-[0.6em]">Ganesha Sovereign Systems • v4.0 Maestro Edition</span>
        </footer>

      </div>
    </motion.div>
  );
}
