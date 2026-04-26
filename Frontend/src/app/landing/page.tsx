'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap, TrendingUp, ChevronRight, BookOpen, ShieldCheck, MousePointer2, PieChart, Layers, Clock, Globe } from 'lucide-react';
import { PastelButton } from '@/components/ui/pastel-button';
import { useAppStore } from '@/lib/stores/useAppStore';

export default function LandingPage() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 overflow-x-hidden font-sans">
      {/* Navbar Abstracto */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-2xl shadow-orange-500/20">
              <span className="text-xl">G</span>
            </div>
            <div className="flex flex-col">
              <span className="font-playfair text-2xl font-bold tracking-tighter leading-none">GANESHA</span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500/80 font-bold">Remover of Obstacles</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('login')} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Entrar</button>
            <PastelButton onClick={() => navigate('register')} size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 border-none px-6 py-5 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/10 hover:scale-105 transition-transform">
              Unirse a la Prosperidad
            </PastelButton>
          </div>
        </div>
      </nav>

      {/* Hero: El Conocimiento es Poder */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-orange-500/10 via-purple-500/5 to-transparent blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-8">
              <Sparkles className="w-4 h-4" />
              Sabiduría Analítica Basada en IA
            </div>
            <h1 className="text-6xl lg:text-8xl font-playfair font-bold leading-[0.9] mb-8">
              Elimina los <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 italic">Obstáculos</span> de tu Negocio.
            </h1>
            <p className="text-lg text-zinc-400 mb-12 max-w-xl leading-relaxed font-medium">
              Inspirado en la antigua sabiduría y potenciado por tecnología de vanguardia. GANESHA procesa el caos de los datos para despejar el camino hacia tu éxito financiero.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <PastelButton onClick={() => navigate('register')} size="lg" className="h-16 px-10 bg-white text-black border-none hover:bg-amber-400 transition-colors group tracking-widest font-black uppercase text-xs">
                Iniciar Proyecto
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </PastelButton>
              <button className="h-16 px-10 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-xs font-black tracking-widest uppercase text-zinc-400 hover:text-white">
                Ver Filosofía
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }} 
            animate={{ opacity: 1, scale: 1, rotate: 0 }} 
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(245,158,11,0.15)] bg-zinc-900/50 backdrop-blur-3xl p-1">
              <img 
                src="/images/ganesha_hero.png"
                className="w-full h-auto rounded-[1.8rem] object-contain"
                alt="Ganesha Digital Deity"
              />
            </div>
            {/* Elementos Sagrados flotando */}
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 blur-[80px] rounded-full" />
            <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 blur-[80px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Franja de Métricas / Confianza */}
      <section className="py-12 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em]">
           <div>100% cloud native</div>
           <div>Zero data loss</div>
           <div>AI Powered auditing</div>
           <div>Multi-company engine</div>
        </div>
      </section>

      {/* ¿Por qué usar GANESHA? - Funciones Maestras */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
               <div>
                    <h2 className="text-5xl font-playfair font-bold mb-8 leading-tight">
                         Más que un software, es un <span className="text-amber-500">Asesor Sagrado</span> para tus finanzas.
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                         Diseñamos Ganesha para empresas que ya no se conforman con hojas de cálculo estáticas. Queremos que tus números hablen, predigan y te protejan.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-8 text-left">
                         {[
                              { icon: <PieChart className="w-5 h-5" />, t: 'Reportes Predictivos', d: 'Gráficos que no solo muestran el hoy, sino el mañana.' },
                              { icon: <Layers className="w-5 h-5" />, t: 'Estructura Multi-Nivel', d: 'Plan de cuentas infinito para empresas multinacionales.' },
                              { icon: <Clock className="w-5 h-5" />, t: 'Cierres en Segundos', d: 'Automatizamos el cierre mensual para que disfrutes tu tiempo.' },
                              { icon: <Globe className="w-5 h-5" />, t: 'Moneda Universal', d: 'Múltiples divisas con tipos de cambio integrados en tiempo real.' },
                         ].map((f, i) => (
                              <div key={i}>
                                   <div className="text-amber-500 mb-2">{f.icon}</div>
                                   <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{f.t}</h4>
                                   <p className="text-zinc-500 text-xs">{f.d}</p>
                              </div>
                         ))}
                    </div>
               </div>
               <div className="relative group">
                    <div className="absolute inset-0 bg-amber-500/10 blur-[100px] group-hover:bg-amber-500/20 transition-all" />
                    <div className="relative p-8 rounded-[3rem] bg-zinc-900/80 border border-white/10 backdrop-blur-3xl overflow-hidden aspect-video flex items-center justify-center">
                         <div className="flex flex-col items-center">
                              <Bot className="w-16 h-16 text-amber-500 animate-pulse" />
                              <div className="mt-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">IA Activa: Analizando Transacciones...</div>
                         </div>
                         {/* Abstract UI decor */}
                         <div className="absolute top-10 right-10 w-24 h-1 bg-white/5 rounded-full" />
                         <div className="absolute bottom-10 left-10 w-32 h-1 bg-white/5 rounded-full" />
                    </div>
               </div>
          </div>

          <div className="text-center mb-24">
            <h2 className="text-4xl lg:text-6xl font-playfair font-bold mb-6 italic">Filosofía de <span className="text-amber-500 font-normal not-italic">Eficiencia</span></h2>
            <p className="text-zinc-500 max-w-2xl mx-auto font-medium">No vendemos software. Vendemos la paz mental de saber que tu negocio está en orden.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Bot className="w-8 h-8 text-primary" />, title: 'Sabiduría IA', desc: 'Consultas en tiempo real con Ganesha AI para dudas contables complejas.', sub: 'Inteligencia' },
              { icon: <Zap className="w-8 h-8 text-orange-500" />, title: 'Ceros Obstáculos', desc: 'Algoritmos que auto-concilian movimientos bancarios con pólizas.', sub: 'Fluidez' },
              { icon: <TrendingUp className="w-8 h-8 text-emerald-500" />, title: 'Prosperidad', desc: 'Identificación automática de fugas de capital y oportunidades de ahorro.', sub: 'Buena Fortuna' },
              { icon: <BookOpen className="w-8 h-8 text-sky-500" />, title: 'Registro Sagrado', desc: 'Pólizas contables generadas automáticamente desde tus facturas.', sub: 'Escritura' },
              { icon: <MousePointer2 className="w-8 h-8 text-amber-500" />, title: 'Dominio del Caos', desc: 'Panel de control con KPIs financieros configurables por departamento.', sub: 'Mente Enfocada' },
              { icon: <ShieldCheck className="w-8 h-8 text-purple-500" />, title: 'Soberanía Total', desc: 'Nube privada y back-ups diarios. Tu tesoro está seguro.', sub: 'Protección' },
            ].map((pillar, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10, backgroundColor: 'rgba(255,255,255,0.03)' }}
                className="p-10 rounded-[3rem] border border-white/5 bg-white/[0.01] transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {pillar.icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{pillar.sub}</div>
                <h3 className="text-xl font-bold mb-4">{pillar.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 relative overflow-hidden">
           <div className="absolute inset-0 bg-primary/5 -z-10" />
           <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-5xl font-playfair font-bold mb-8">¿Listo para remover los obstáculos?</h2>
                <p className="text-lg text-zinc-400 mb-12">Únete a cientos de empresas que ya transformaron su contabilidad en una ventaja estratégica.</p>
                <div className="flex justify-center gap-6">
                     <PastelButton onClick={() => navigate('register')} size="lg" className="h-20 px-16 bg-amber-500 text-black border-none font-black uppercase tracking-widest text-xs shadow-3xl shadow-amber-500/20">
                          Crear Cuenta Gratis
                     </PastelButton>
                </div>
           </div>
      </section>

      {/* Footer místico */}
      <footer className="py-24 border-t border-white/5 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-8">
           <div className="w-6 h-px bg-white/10" />
           <span className="font-playfair italic text-zinc-400">GANESHA ENTERPRISE SYSTEM</span>
           <div className="w-6 h-px bg-white/10" />
        </div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mb-4">Que la prosperidad guíe tus números</p>
        <p className="text-xs text-zinc-700">© 2026 Reservados todos los derechos. Hecho por mentes brillantes para el éxito global.</p>
      </footer>
    </div>
  );
}
