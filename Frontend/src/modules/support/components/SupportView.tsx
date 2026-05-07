'use client';

import { motion } from 'framer-motion';
import { BookMarked, Terminal, HelpCircle, FileText, Code2, ShieldCheck, Zap, ArrowRight, Download, Cpu, Shield, Database } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { useAppStore } from '@/lib/stores/useAppStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function SupportView() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
      className="max-w-5xl mx-auto space-y-12 py-12"
    >
      {/* Header Soberano */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mx-auto shadow-[0_0_30px_rgba(234,88,12,0.1)]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase text-foreground">Núcleo de Conocimiento</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-[0.4em] font-bold">Protocolos de Ingeniería & Guía Maestra</p>
      </motion.div>

      {/* Main CTA: Manual de Élite */}
      <motion.div variants={itemVariants}>
        <VintageCard variant="premium" className="p-12 border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.15)_0%,transparent_70%)]" />
          <div className="relative z-10 grid md:grid-cols-[1fr_250px] gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <Cpu className="w-3 h-3" /> Acceso Nivel 01
              </div>
              <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Manual de <br /><span className="text-primary italic">Élite.</span></h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                La guía definitiva que combina el flujo de usuario con la arquitectura técnica del sistema. 
                Aprende a dominar cada módulo con fragmentos de código real y protocolos forenses.
              </p>
              <button 
                onClick={() => navigate('user-manual')}
                className="h-14 px-10 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(234,88,12,0.2)]"
              >
                Abrir Manual de Ingeniería <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex flex-col gap-4">
               {[
                 { i: <Code2 />, t: 'Lógica Core' },
                 { i: <Database />, t: 'Estructura DB' },
                 { i: <Zap />, t: 'Motores AI' }
               ].map((spec, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center gap-2 text-zinc-500 group-hover:text-primary transition-colors">
                    <div className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity">{spec.i}</div>
                    <span className="text-[8px] font-black uppercase tracking-widest">{spec.t}</span>
                 </div>
               ))}
            </div>
          </div>
        </VintageCard>
      </motion.div>

      {/* Info Cards Secundarias */}
      <div className="grid md:grid-cols-2 gap-6">
         <motion.div variants={itemVariants}>
            <VintageCard className="p-8 h-full bg-zinc-950/50 hover:border-primary/30 transition-all">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Terminal className="w-5 h-5 text-primary" />
                     <h3 className="text-sm font-black uppercase tracking-tight">API de Integración</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     Para desarrolladores: consulta los endpoints maestros y el protocolo de autenticación HMAC directamente dentro del manual.
                  </p>
                  <button onClick={() => navigate('user-manual')} className="text-[10px] font-black uppercase text-primary hover:underline">Ver Endpoints</button>
               </div>
            </VintageCard>
         </motion.div>

         <motion.div variants={itemVariants}>
            <VintageCard className="p-8 h-full bg-zinc-950/50 hover:border-primary/30 transition-all">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Download className="w-5 h-5 text-zinc-500" />
                     <h3 className="text-sm font-black uppercase tracking-tight">Recursos Offline</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     Descarga la versión PDF del manual para consultas sin conexión. Actualizado a la versión v2.5-Elite.
                  </p>
                  <button className="text-[10px] font-black uppercase text-zinc-500 cursor-not-allowed">Próximamente</button>
               </div>
            </VintageCard>
         </motion.div>
      </div>

      {/* Footer Support */}
      <motion.div variants={itemVariants} className="pt-12 text-center opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.4em]">Soporte Técnico Ganesha • Activo 24/7</p>
      </motion.div>
    </motion.div>
  );
}
