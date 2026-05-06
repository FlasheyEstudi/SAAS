'use client';

import { motion } from 'framer-motion';
import { BookMarked, Terminal, HelpCircle, FileText, Code2, ShieldCheck, Zap, ArrowRight, Download } from 'lucide-react';
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-foreground">Biblioteca Técnica</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Documentación Maestra & Recursos de Élite</p>
          </div>
        </div>
      </motion.div>

      {/* Main Bento Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Documentación Principal */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <VintageCard className="h-full p-8 relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                <FileText className="w-3 h-3" /> Guía Completa
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">Documentación Maestro</h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                Explora el funcionamiento profundo de Ganesha ERP. Desde la configuración inicial hasta protocolos avanzados de auditoría forense.
              </p>
              <div className="pt-4 flex gap-4">
                <button onClick={() => navigate('documentation')} className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:underline">
                  Leer Online <ArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:text-foreground">
                  Descargar PDF <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="absolute right-[-5%] bottom-[-5%] opacity-10 group-hover:opacity-20 transition-opacity">
              <BookMarked className="w-64 h-64" />
            </div>
          </VintageCard>
        </motion.div>

        {/* API Reference */}
        <motion.div variants={itemVariants}>
          <VintageCard className="h-full p-8 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <Terminal className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black tracking-tighter uppercase">API Reference</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Endpoints, autenticación HMAC y esquemas de datos. Todo lo necesario para integrar Ganesha con tu ecosistema.
              </p>
              <div className="pt-4">
                <button onClick={() => navigate('api-reference')} className="w-full text-left">
                  <div className="p-3 rounded-xl bg-black/40 font-mono text-[10px] text-primary/70 border border-primary/10 hover:border-primary/30 transition-all">
                    GET /api/v1/journal
                  </div>
                </button>
              </div>
            </div>
          </VintageCard>
        </motion.div>

        {/* Manual de Usuario */}
        <motion.div variants={itemVariants}>
          <VintageCard className="h-full p-8">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black tracking-tighter uppercase">Manual de Usuario</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Guía paso a paso para usuarios finales. Domina la facturación, bancos y reportes sin fricción.
              </p>
              <button onClick={() => navigate('user-manual')} className="w-full mt-4 h-11 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all">
                Abrir Manual
              </button>
            </div>
          </VintageCard>
        </motion.div>

        {/* Soporte Directo */}
        <motion.div variants={itemVariants} className="md:col-span-2">
           <div className="p-8 rounded-[2rem] bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex items-center justify-between group">
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tighter uppercase">¿Necesitas Ayuda Experta?</h3>
                <p className="text-muted-foreground text-sm">Nuestro equipo de soporte técnico está disponible 24/7 para remover cualquier obstáculo.</p>
              </div>
              <button className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                Contactar Soporte
              </button>
           </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
