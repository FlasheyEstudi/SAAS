'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, ArrowLeft, PlayCircle, BookOpen, CheckCircle2, 
  AlertCircle, FileText, ChevronRight, Zap, Sparkles,
  Smartphone, Monitor, ShieldCheck, PieChart, Users,
  CreditCard, Banknote, History, Lightbulb, MousePointer2,
  Lock, RefreshCcw, Download, Share2, MessageSquare,
  Layers, Plus, Search, Filter, MoreVertical, LayoutDashboard
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { cn } from '@/lib/utils';

// --- COMPONENTES MINI DE ALTA FIDELIDAD (Copiando el diseño real de la UI) ---

const MiniSidebar = () => (
  <div className="w-16 h-full bg-zinc-950 border-r border-white/5 flex flex-col items-center py-4 gap-4">
     <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40" />
     <div className="space-y-2 mt-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5" />
        ))}
     </div>
  </div>
);

const MiniHeader = () => (
  <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/50">
     <div className="flex gap-2">
        <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        <div className="w-8 h-1.5 bg-primary/20 rounded-full" />
     </div>
     <div className="flex gap-2 items-center">
        <div className="w-4 h-4 rounded-full bg-white/5" />
        <div className="w-20 h-1.5 bg-white/10 rounded-full" />
     </div>
  </div>
);

const FlowStep = ({ title, desc, children, stepNumber, active }: { title: string, desc: string, children: React.ReactNode, stepNumber: string, active: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className={cn(
      "grid lg:grid-cols-[1fr_450px] gap-12 items-start py-20 border-b border-white/5",
      !active && "opacity-40 grayscale pointer-events-none"
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
        <div className="flex gap-4">
           <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400">Tutorial</div>
           <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">Acción Core</div>
        </div>
     </div>
     <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-30 transition-opacity" />
        <div className="relative z-10 p-2 bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
           <div className="bg-zinc-900/80 rounded-[2rem] border border-white/5 overflow-hidden">
              <MiniHeader />
              <div className="flex h-64">
                 <MiniSidebar />
                 <div className="flex-1 p-4 overflow-hidden relative">
                    {children}
                 </div>
              </div>
           </div>
        </div>
     </div>
  </motion.div>
);

export function UserManualView() {
  const navigate = useAppStore((s) => s.navigate);
  const [currentSection, setCurrentSection] = useState(0);

  // Lógica de auto-avance para demostración
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSection(prev => (prev + 1) % 5);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground pb-40"
    >
      {/* Cabecera Dinámica */}
      <div className="sticky top-0 z-50 w-full backdrop-blur-3xl bg-background/80 border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('landing')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </button>
          <div className="flex items-center gap-3">
             <LayoutDashboard className="w-5 h-5 text-primary" />
             <span className="text-xs font-black uppercase tracking-tighter">Guía de Uso Ganesha ERP</span>
          </div>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-success" />
             <span className="text-[9px] font-black uppercase text-zinc-500">Documentación en Vivo</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24">
        
        {/* Sección Intro */}
        <section className="text-center space-y-10 mb-32">
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                 <Sparkles className="w-3 h-3" /> Flujo de Usuario v2.5
              </div>
              <h1 className="text-7xl lg:text-9xl font-black tracking-tighter leading-[0.8] uppercase">
                 Flujo de <br/><span className="text-primary italic">Trabajo.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-10 leading-relaxed font-medium">
                 Domina el ciclo de vida de tu empresa en Ganesha. Desde la configuración 
                 inicial hasta la auditoría forense con Inteligencia Artificial.
              </p>
           </motion.div>
        </section>

        {/* --- LOS PASOS DEL FLUJO --- */}

        <FlowStep 
          stepNumber="01" 
          title="Configuración de Empresa" 
          desc="Lo primero es definir tu identidad corporativa. Configura tu RUC, moneda base (C$ o $) y carga el catálogo de cuentas maestro."
          active={currentSection === 0}
        >
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <div className="w-20 h-2 bg-white/10 rounded-full" />
                 <Plus className="w-4 h-4 text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-10 rounded-xl bg-white/5 border border-white/5 flex items-center px-3">
                      <div className="w-12 h-1 bg-white/10 rounded-full" />
                   </div>
                 ))}
              </div>
              <div className="h-20 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                 <Smartphone className="w-4 h-4 text-zinc-600" />
                 <div className="text-[6px] text-zinc-600 uppercase font-black">Cargar Logo</div>
              </div>
           </div>
        </FlowStep>

        <FlowStep 
          stepNumber="02" 
          title="Gestión del Catálogo" 
          desc="Organiza tus finanzas. Crea cuentas de Activo, Pasivo, Patrimonio e Ingresos con jerarquía ilimitada."
          active={currentSection === 1}
        >
           <div className="space-y-2">
              <div className="h-8 bg-zinc-900 border border-white/5 rounded-lg flex items-center px-3 gap-2">
                 <Search className="w-3 h-3 text-zinc-600" />
                 <div className="w-20 h-1 bg-white/5 rounded-full" />
              </div>
              <div className="space-y-1">
                 {[
                   { l: '1.0.0 ACTIVO', c: 'text-success' },
                   { l: '1.1.0 DISPONIBLE', c: 'text-success/70' },
                   { l: '1.1.1 CAJA GENERAL', c: 'text-primary' },
                   { l: '2.0.0 PASIVO', c: 'text-red-500/70' }
                 ].map((item, i) => (
                   <div key={i} className="h-8 rounded-lg bg-white/5 flex items-center px-3 gap-3">
                      <Layers className={cn("w-3 h-3", item.c)} />
                      <span className="text-[8px] font-black font-mono text-zinc-400">{item.l}</span>
                   </div>
                 ))}
              </div>
           </div>
        </FlowStep>

        <FlowStep 
          stepNumber="03" 
          title="Ciclo de Facturación" 
          desc="Emite facturas legales de forma instantánea. El sistema genera el asiento contable en tiempo real y calcula los impuestos automáticamente."
          active={currentSection === 2}
        >
           <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="text-[10px] font-black text-primary">FACTURA #0012</div>
                    <div className="text-[6px] text-zinc-600">CLIENTE: ALFA CORP</div>
                 </div>
                 <div className="px-2 py-0.5 rounded bg-success/20 text-success text-[6px] font-black">PAGADA</div>
              </div>
              <div className="space-y-1">
                 <div className="flex justify-between text-[7px] text-zinc-500 font-bold border-b border-white/5 pb-1">
                    <span>DESCRIPCIÓN</span>
                    <span>TOTAL</span>
                 </div>
                 <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-zinc-400">Servicios Cloud</span>
                    <span className="text-white">C$ 1,200.00</span>
                 </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                 <div className="text-[6px] text-zinc-600">Total Neto</div>
                 <div className="text-[10px] font-black text-white">C$ 1,200.00</div>
              </div>
           </div>
        </FlowStep>

        <FlowStep 
          stepNumber="04" 
          title="Pólizas Contables" 
          desc="Para movimientos manuales o ajustes. Ganesha valida la partida doble: débitos deben ser iguales a créditos antes de permitir el registro."
          active={currentSection === 3}
        >
           <div className="space-y-4">
              <div className="h-8 bg-zinc-900 rounded-lg border border-white/5 flex items-center px-3 justify-between">
                 <div className="text-[8px] font-black text-zinc-500">PÓLIZA DE DIARIO #42</div>
                 <CheckCircle2 className="w-3 h-3 text-success" />
              </div>
              <div className="grid grid-cols-3 gap-1">
                 <div className="h-6 bg-white/5 rounded border border-white/5" />
                 <div className="h-6 bg-white/5 rounded border border-white/5" />
                 <div className="h-6 bg-white/5 rounded border border-white/5" />
              </div>
              <div className="space-y-1">
                 <div className="flex justify-between text-[6px] font-black px-2">
                    <span className="text-zinc-500">CUENTA</span>
                    <span className="text-zinc-500">DEBE</span>
                    <span className="text-zinc-500">HABER</span>
                 </div>
                 <div className="h-6 bg-primary/5 border border-primary/20 rounded flex items-center justify-between px-2 text-[7px] font-mono">
                    <span className="text-primary">BANCOS</span>
                    <span className="text-white">100.00</span>
                    <span className="text-zinc-600">0.00</span>
                 </div>
                 <div className="h-6 bg-white/5 border border-white/10 rounded flex items-center justify-between px-2 text-[7px] font-mono">
                    <span className="text-zinc-400">INGRESOS</span>
                    <span className="text-zinc-600">0.00</span>
                    <span className="text-white">100.00</span>
                 </div>
              </div>
           </div>
        </FlowStep>

        <FlowStep 
          stepNumber="05" 
          title="Auditoría Forense AI" 
          desc="Usa el lenguaje natural para analizar tu empresa. '¿Cuál es mi rentabilidad real?' o 'Detecta fugas en gastos' son comandos válidos."
          active={currentSection === 4}
        >
           <div className="flex flex-col gap-3">
              <div className="self-end bg-zinc-800 p-2 rounded-xl rounded-tr-none text-[8px] text-zinc-300 max-w-[80%]">
                 ¿Analiza los gastos del departamento de ventas?
              </div>
              <div className="self-start bg-primary/10 border border-primary/20 p-2 rounded-xl rounded-tl-none text-[8px] text-zinc-300 flex gap-2 items-start">
                 <Zap className="w-3 h-3 text-primary shrink-0" />
                 <div>
                    He detectado un gasto inusual en **combustible**. <br/>
                    Variación: <span className="text-red-500">+15%</span> vs Mes Anterior.
                 </div>
              </div>
              <div className="grid grid-cols-6 items-end gap-1 h-12 px-4">
                 {[40, 70, 50, 90, 60, 45].map((h, i) => (
                   <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h}%` }} />
                 ))}
              </div>
           </div>
        </FlowStep>

        {/* Tips de Supervivencia */}
        <section className="mt-64 space-y-16">
           <div className="text-center space-y-4">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Tips de <span className="text-primary italic">Expertos.</span></h2>
              <p className="text-muted-foreground">Domina Ganesha como un profesional.</p>
           </div>
           <div className="grid sm:grid-cols-3 gap-8">
              {[
                { t: 'Multi-Ventana', d: 'Puedes tener varias pestañas abiertas para comparar reportes en vivo.', i: <Monitor /> },
                { t: 'Atajos', d: 'Usa Ctrl+K para abrir el buscador global desde cualquier vista.', i: <Plus /> },
                { t: 'Seguridad', d: 'Nunca compartas tu API Key. Ganesha nunca te pedirá tu contraseña.', i: <ShieldCheck /> }
              ].map((tip, i) => (
                <VintageCard key={i} className="p-8 space-y-4 group">
                   <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {tip.i}
                   </div>
                   <h4 className="text-sm font-black uppercase tracking-tight">{tip.t}</h4>
                   <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{tip.d}</p>
                </VintageCard>
              ))}
           </div>
        </section>

        {/* CTA Global */}
        <section className="mt-64">
           <div className="p-20 rounded-[4rem] bg-zinc-950 border border-primary/20 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 space-y-8">
                 <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto border border-primary/30">
                    <Lightbulb className="w-10 h-10 text-primary" />
                 </div>
                 <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">¿Listo para <br/><span className="text-primary italic">Empezar?</span></h2>
                 <p className="text-muted-foreground max-w-lg mx-auto font-medium">Tu soberanía financiera te espera en el Dashboard principal.</p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <button onClick={() => navigate('dashboard')} className="h-16 px-12 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_10px_30px_rgba(234,88,12,0.2)]">
                       Ir al Dashboard
                    </button>
                    <button className="h-16 px-12 bg-zinc-900 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all">
                       Contactar Soporte
                    </button>
                 </div>
              </div>
           </div>
        </section>

        <footer className="mt-64 text-center pb-20">
           <div className="flex items-center justify-center gap-4 text-zinc-700">
              <Download className="w-4 h-4 hover:text-primary cursor-pointer transition-colors" />
              <Share2 className="w-4 h-4 hover:text-primary cursor-pointer transition-colors" />
              <div className="h-4 w-px bg-zinc-800" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">Manual Maestro Ganesha • 2026</span>
           </div>
        </footer>

      </div>
    </motion.div>
  );
}
