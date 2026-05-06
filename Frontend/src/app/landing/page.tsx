'use client';

import { useRef, useState, useEffect } from 'react';
import { 
  Bot, Sparkles, Zap, ShieldCheck, PieChart, Layers, 
  Clock, Globe, ArrowRight, Coins, Fingerprint,
  TrendingUp, Activity, FileText, ChevronRight, CheckCircle2,
  Lock, Server, Cpu, Database, MousePointer2, PlayCircle,
  Shield, Laptop, Smartphone, Binary, Braces, BookOpen,
  Infinity, Command, Terminal as TerminalIcon, Wrench
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VintageCard } from '@/components/ui/vintage-card';

export default function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const theme = useAppStore((s) => s.theme);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={cn(
      "relative min-h-[100dvh] bg-background text-foreground selection:bg-primary/40 overflow-x-hidden font-sans scroll-smooth transition-colors duration-700",
      theme
    )}>
      
      {/* --- FONDO CINEMÁTICO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[150px] rounded-full opacity-40" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary/5 blur-[150px] rounded-full opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* --- NAV --- */}
      <nav className={cn(
        "fixed top-0 left-0 w-full z-[100] px-6 transition-all duration-500",
        scrolled ? "py-4 bg-background/80 backdrop-blur-3xl border-b border-primary/10" : "py-8 bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(234,88,12,0.15)]">
               <img src="/GaneshaLogo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex flex-col">
               <span className="text-sm font-black tracking-tighter uppercase leading-none">Ganesha<span className="text-primary">.</span></span>
               <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-[0.3em]">Soberanía Digital</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
             {[
               { id: 'producto', label: 'Producto', action: () => scrollTo('core') },
               { id: 'seguridad', label: 'Seguridad', action: () => scrollTo('security') },
               { id: 'recursos', label: 'Recursos', action: () => navigate('documentation') },
               { id: 'soporte', label: 'Soporte', action: () => navigate('user-manual') }
             ].map(item => (
               <button key={item.id} onClick={item.action} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all relative group">
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
               </button>
             ))}
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('login')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">Entrar</button>
            <button onClick={() => navigate('register')} className="bg-primary text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(234,88,12,0.2)]">Comenzar</button>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-10 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-zinc-900/50 text-primary text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-xl">
              <Sparkles className="w-4 h-4" /> Estándar Empresarial Blindado
            </div>
            <h1 className="text-6xl lg:text-9xl font-black tracking-tighter leading-[0.8] uppercase">
              Control <br/><span className="text-primary italic">Absoluto.</span>
            </h1>
            <p className="text-muted-foreground text-xl lg:text-2xl max-w-xl leading-relaxed font-medium">
              Elimina obstáculos contables con el motor de inteligencia financiera más potente de Nicaragua.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-6">
              <button onClick={() => navigate('register')} className="h-16 px-12 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                 Empezar el Viaje <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => scrollTo('core')} className="h-16 px-12 rounded-2xl border border-primary/10 bg-card/40 backdrop-blur-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3">
                 Ver Producto
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="relative group hidden lg:block">
            <div className="absolute inset-0 bg-primary/20 blur-[150px] rounded-full animate-aura opacity-30" />
            <div className="relative z-10 p-10 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[4rem] backdrop-blur-3xl overflow-hidden">
               <img src="/personaje.png" alt="Mascota" className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- STATS --- */}
      <section className="py-24 bg-zinc-950 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-16 text-center">
          {[
            { n: '100%', l: 'Soberanía de Datos', i: <ShieldCheck /> },
            { n: '< 20ms', l: 'Respuesta del Motor', i: <Zap /> },
            { n: '256-bit', l: 'Encriptación Militar', i: <Lock /> },
            { n: '24/7', l: 'Auditoría Forense', i: <Activity /> },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">{m.i}</div>
              <div>
                 <div className="text-4xl font-black tracking-tighter mb-1">{m.n}</div>
                 <div className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">{m.l}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- MOOSHIKA (BACKEND) --- */}
      <section className="py-40 bg-background relative z-10 overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(234,88,12,0.1)_0%,transparent_70%)]" />
         <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_500px] gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
               <div className="inline-flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.4em]">
                  <Wrench className="w-5 h-5" /> Ingeniería de Precisión
               </div>
               <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">Mooshika: El <br/><span className="text-primary italic">Arquitecto.</span></h2>
               <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                  Arquitectura blindada con precisión quirúrgica para una libertad operativa total.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  {[
                    { i: <Cpu className="w-4 h-4"/>, t: 'Núcleo Agnóstico' },
                    { i: <Zap className="w-4 h-4"/>, t: 'Flujo Inmediato' },
                    { i: <Binary className="w-4 h-4"/>, t: 'ADN Blindado' }
                  ].map((feat, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center text-center gap-2">
                       <div className="text-primary">{feat.i}</div>
                       <div className="text-[9px] font-black uppercase tracking-widest text-white">{feat.t}</div>
                    </div>
                  ))}
               </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} initial={{ opacity: 0, rotate: 10 }} whileInView={{ opacity: 1, rotate: 0 }} viewport={{ once: true }} className="relative z-10 p-8 bg-zinc-900/50 border border-white/10 rounded-[5rem] backdrop-blur-3xl flex items-center justify-center">
               <img src="/logo_backend.png" className="w-full max-w-sm drop-shadow-2xl" />
            </motion.div>
         </div>
      </section>

      {/* --- PILLARS --- */}
      <section id="core" className="py-40 px-6 relative z-10 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter">Pilares del <span className="text-primary">Ecosistema.</span></h2>
              <p className="text-muted-foreground max-w-xl mx-auto font-medium">Arquitectura de grado empresarial diseñada para el crecimiento infinito.</p>
           </div>
           <div className="grid lg:grid-cols-3 gap-8">
              <VintageCard className="lg:col-span-2 p-12 bg-zinc-900/40 relative group overflow-hidden">
                 <Binary className="absolute -top-10 -right-10 w-64 h-64 text-primary opacity-5 group-hover:opacity-10 transition-opacity" />
                 <div className="relative z-10 space-y-8">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Bot className="w-8 h-8" /></div>
                    <div className="space-y-4">
                       <h3 className="text-4xl font-black uppercase tracking-tighter">Auditoría con IA Nativa</h3>
                       <p className="text-lg text-muted-foreground max-w-md font-medium">Detecta fugas, previene fraudes y genera insights estratégicos en segundos.</p>
                    </div>
                 </div>
              </VintageCard>
              <VintageCard className="p-12 hover:bg-primary group transition-all duration-700">
                 <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-black/10 group-hover:text-black"><Layers className="w-8 h-8" /></div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter group-hover:text-black mt-8">Multi-Empresa</h3>
                 <p className="text-muted-foreground group-hover:text-black/70 font-medium mt-4">Gestiona múltiples razones sociales desde un solo acceso seguro.</p>
              </VintageCard>
           </div>
        </div>
      </section>

      {/* --- SECURITY --- */}
      <section id="security" className="py-40 px-6 relative overflow-hidden bg-background z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <div className="inline-flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.4em]"><Lock className="w-5 h-5" /> Inexpugnable</div>
            <h2 className="text-5xl lg:text-8xl font-black tracking-tighter uppercase leading-none">Seguridad <br /><span className="text-primary italic">Absoluta.</span></h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium">Protocolos de encriptación militar para proteger el corazón de tu negocio.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { i: <ShieldCheck />, t: 'Firma HMAC' },
                { i: <Cpu />, t: 'Aislamiento' },
                { i: <Server />, t: 'SSL/TLS 1.3' },
                { i: <Database />, t: 'Logs Inmutables' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-primary/30 transition-all group">
                  <div className="text-primary">{item.i}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white">{item.t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[150px] rounded-full animate-aura opacity-30" />
            <div className="relative z-10 aspect-square bg-gradient-to-br from-white/5 to-transparent backdrop-blur-3xl border border-white/10 rounded-[5rem] flex items-center justify-center p-16 shadow-2xl">
               <img src="/GaneshaLogo.png" className="w-full opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-32 border-t border-white/5 bg-zinc-950 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-20">
            <div className="col-span-2 space-y-12">
               <div className="flex items-center gap-8">
                  <div className="relative w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center bg-zinc-900 shadow-xl">
                    <img src="/logo_backend.png" alt="Sello" className="w-12 h-12 object-contain" />
                  </div>
                  <div>
                     <div className="text-4xl font-black uppercase tracking-tighter leading-none">GANESHA<span className="text-primary">.</span></div>
                     <div className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Sello de Autenticidad</div>
                  </div>
               </div>
               <p className="text-zinc-500 text-sm max-w-sm leading-relaxed font-medium">El removedor de obstáculos para la empresa moderna.</p>
            </div>
            <div className="space-y-8">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">Plataforma</h4>
               <ul className="space-y-4 text-[10px] uppercase font-black text-zinc-400">
                  <li onClick={() => navigate('documentation')} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><FileText className="w-3 h-3" /> Documentación</li>
                  <li onClick={() => navigate('api-reference')} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><Braces className="w-3 h-3" /> Referencia API</li>
                  <li onClick={() => navigate('user-manual')} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><BookOpen className="w-3 h-3" /> Manual de Uso</li>
               </ul>
            </div>
            <div className="space-y-8">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">Legal</h4>
               <ul className="space-y-4 text-[10px] uppercase font-black text-zinc-400">
                  <li className="hover:text-primary cursor-pointer transition-colors">Privacidad</li>
                  <li className="hover:text-primary cursor-pointer transition-colors">Términos</li>
                  <li className="hover:text-primary cursor-pointer transition-colors">Cumplimiento</li>
               </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-20 border-t border-white/5">
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.6em]">Soberanía Digital • Nicaragua • 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
