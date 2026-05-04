'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Bot, Sparkles, Zap, ChevronRight, ShieldCheck, PieChart, Layers, Clock, Globe, ArrowRight, Coins } from 'lucide-react';
import { PastelButton } from '@/components/ui/pastel-button';
import { useAppStore } from '@/lib/stores/useAppStore';

export default function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background mandala-bg text-foreground selection:bg-primary/30 overflow-x-hidden font-sans scroll-smooth">
      {/* Navbar Minimalista Premium */}
      <nav className="fixed top-0 w-full z-[100] px-4 sm:px-8 py-4 sm:py-6 backdrop-blur-2xl bg-background/40 border-b border-primary/5">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:scale-125 transition-transform duration-500" />
              <img src="/GaneshaLogo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-playfair text-xl sm:text-2xl font-bold tracking-tighter leading-none">GANESHA</span>
              <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.4em] sm:tracking-[0.6em] text-primary font-black">Removedor de Obstáculos</span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
             <a href="#sabiduria" className="hover:text-primary transition-colors">Sabiduría</a>
             <a href="#ia" className="hover:text-primary transition-colors">Ganesha AI</a>
             <a href="#prosperidad" className="hover:text-primary transition-colors">Prosperidad</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={() => navigate('login')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Entrar</button>
            <PastelButton 
              onClick={() => navigate('register')} 
              className="bg-primary text-primary-foreground border-none px-4 sm:px-8 py-3 sm:py-6 text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              Comenzar
            </PastelButton>
          </div>
        </div>
      </nav>

      {/* Hero Section: El Despertar de la Riqueza */}
      <section className="relative min-h-screen flex items-center pt-24 sm:pt-40 overflow-hidden px-4 sm:px-8 lg:px-24">
        <div className="max-w-[1800px] mx-auto grid lg:grid-cols-2 gap-16 items-center z-10 w-full">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-start text-left"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-10 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Soberanía Financiera Absoluta
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl sm:text-7xl md:text-[9rem] font-playfair font-bold leading-[0.85] tracking-tighter mb-6 sm:mb-10 text-foreground"
            >
              Remueve <br />
              los <span className="italic font-normal text-primary">Obstáculos.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed font-medium mb-8 sm:mb-16 drop-shadow-sm"
            >
              No permitas que la complejidad detenga tu crecimiento. GANESHA fusiona IA con sabiduría para que tu camino sea siempre claro y próspero.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.8 }}
               className="flex flex-col sm:flex-row gap-8"
            >
              <PastelButton onClick={() => navigate('register')} className="h-16 sm:h-24 px-8 sm:px-16 bg-primary text-primary-foreground border-none font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs shadow-[0_20px_60px_rgba(var(--primary-rgb),0.35)] hover:translate-y-[-5px] transition-all">
                Reclamar mi Éxito
              </PastelButton>
              <button className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground hover:text-primary transition-all group">
                Ver Filosofía <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[150px] rounded-full animate-aura scale-110" />
            <img 
              src="/personaje.png" 
              className="w-full max-w-[800px] h-auto object-contain animate-float drop-shadow-[0_0_120px_rgba(var(--primary-rgb),0.4)] relative z-10"
              alt="Ganesha Master"
            />
          </motion.div>
        </div>

        {/* Efecto de fondo sutil */}
        <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none -z-0" />
      </section>

      {/* Experiencia de Datos (Métricas) */}
      <section className="relative z-20 py-16 sm:py-32 border-y border-primary/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { n: '100%', l: 'Arquitectura Cloud' },
            { n: '256ms', l: 'Latencia IA' },
            { n: '∞', l: 'Escalabilidad' },
            { n: '99.9%', l: 'Paz Mental' },
          ].map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl sm:text-4xl md:text-6xl font-playfair font-bold text-primary mb-2 tracking-tighter">{m.n}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">{m.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pilares de Sabiduria (Features) */}
      <section id="sabiduria" className="py-20 sm:py-60 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-32 text-center">
             <div className="inline-block p-4 rounded-3xl bg-primary/5 mb-8">
                <Coins className="w-10 h-10 text-primary" />
             </div>
             <h2 className="text-3xl sm:text-6xl md:text-8xl font-playfair font-bold mb-8 tracking-tighter">La Sabiduría Integrada</h2>
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Cada función ha sido forjada para eliminar la fricción de tu crecimiento.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Bot className="w-8 h-8" />, t: 'IA Nativa', d: 'No es un plugin, es el corazón del sistema. Análisis contable profundo en segundos.' },
              { icon: <Zap className="w-8 h-8" />, t: 'Conciliación Zen', d: 'El sistema fluye con tus bancos. Las diferencias desaparecen automáticamente.' },
              { icon: <ShieldCheck className="w-8 h-8" />, t: 'Bóveda Cuántica', d: 'Tus datos son sagrados. Seguridad extrema para la soberanía de tu información.' },
              { icon: <Layers className="w-8 h-8" />, t: 'Multi-Tenant', d: 'Gestiona un imperio. Infinitas empresas bajo un control unificado y fluido.' },
              { icon: <Globe className="w-8 h-8" />, t: 'Mente Global', d: 'Multimoneda real. No importa donde estés, Ganesha habla tu idioma financiero.' },
              { icon: <Clock className="w-8 h-8" />, t: 'Tiempo Eterno', d: 'Automatizamos el 80% de tus tareas diarias para que recuperes tu vida.' },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-6 sm:p-12 rounded-[2rem] sm:rounded-[4rem] border border-primary/5 bg-card hover:bg-muted/50 transition-all duration-500 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-6 tracking-tight text-foreground">{f.t}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{f.d}</p>
                <div className="mt-10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Explorar Sabiduría <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* IA Showcase: Ganesha AI */}
      <section id="ia" className="py-20 sm:py-40 bg-foreground/[0.03] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse scale-110" />
            <div className="relative aspect-square rounded-[3rem] sm:rounded-[6rem] overflow-hidden border border-primary/10 bg-card/50 backdrop-blur-3xl flex items-center justify-center p-6 sm:p-12">
               <motion.img 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                  src="/personaje.png" 
                  className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)]" 
               />
               <div className="absolute inset-0 border border-primary/20 rounded-[6rem] animate-pulse pointer-events-none" />
            </div>
          </div>

          <div>
             <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.4em] mb-10">
                <Bot className="w-4 h-4" />
                Soberanía Tecnológica
             </div>
             <h2 className="text-3xl sm:text-6xl md:text-8xl font-playfair font-bold mb-6 sm:mb-10 leading-tight tracking-tighter">
                Tu Asesor de <br />
                <span className="text-primary italic font-normal">Buen Augurio.</span>
             </h2>
             <p className="text-xl text-muted-foreground leading-relaxed font-medium mb-12">
                Ganesha AI no solo responde preguntas, anticipa soluciones. Detecta ineficiencias antes de que se conviertan en obstáculos y te guía hacia decisiones prósperas basadas en datos puros.
             </p>
             <div className="grid grid-cols-2 gap-8">
                {[
                  { t: 'IA Generativa', d: 'Consultas en lenguaje natural.' },
                  { t: 'Predictivo', d: 'Flujos de caja proyectados.' },
                  { t: 'Auditoría', d: 'Detección automática de fraudes.' },
                  { t: 'Soporte', d: 'Tu guía personal 24/7.' }
                ].map((item, idx) => (
                  <div key={idx} className="border-l border-primary/20 pl-6">
                    <div className="text-foreground font-bold text-sm uppercase tracking-widest mb-1">{item.t}</div>
                    <div className="text-muted-foreground text-xs">{item.d}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* CTA Final: El Despertar */}
      <section id="prosperidad" className="py-32 sm:py-80 flex flex-col items-center text-center px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[200px] animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-5xl">
          <h2 className="text-4xl sm:text-7xl md:text-[10rem] font-playfair font-bold leading-none tracking-tighter mb-8 sm:mb-16">
            Remueve los <br />
            <span className="text-primary italic">Obstáculos.</span>
          </h2>
          <p className="text-base sm:text-2xl text-muted-foreground mb-10 sm:mb-20 max-w-2xl mx-auto leading-relaxed">
            La abundancia financiera no es suerte, es arquitectura. Comienza a construir tu imperio hoy mismo con GANESHA.
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <PastelButton onClick={() => navigate('register')} className="h-16 sm:h-24 px-10 sm:px-20 bg-primary text-primary-foreground border-none font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[10px] sm:text-xs shadow-[0_20px_60px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-all">
              Reclamar mi Éxito
            </PastelButton>
          </div>
        </div>
      </section>

      {/* Footer Final */}
      <footer className="py-32 border-t border-primary/5 text-center bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                 <img src="/GaneshaLogo.png" className="w-12 h-12 grayscale brightness-200 opacity-20" />
                 <span className="font-playfair text-xl font-bold tracking-[0.4em] text-muted-foreground opacity-30">GANESHA ENTERPRISE SYSTEM</span>
              </div>
              <div className="h-px w-20 bg-primary/20" />
              <div className="text-[9px] font-black uppercase tracking-[0.6em] text-muted-foreground/60 leading-relaxed">
                El Conocimiento es el inicio. La acción es el Camino. <br />
                © 2026 Reservados todos los derechos.
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
