'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Shield, 
  Cloud, 
  TrendingUp, 
  Users, 
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Play,
  Sparkles,
  Bot,
  Brain,
  MessageSquare,
  Calculator,
  ArrowUpRight,
  ChevronRight,
  Globe,
  Zap,
  Lock
} from 'lucide-react';
import { useState, useRef } from 'react';
import { PastelButton } from '@/components/ui/pastel-button';
import { VintageCard } from '@/components/ui/vintage-card';
import { useAppStore } from '@/lib/stores/useAppStore';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'GANESHA AI: Tu Asistente',
    description: 'Nuestra IA residente que responde preguntas complejas sobre tus finanzas y genera reportes con solo pedírselo.',
    color: 'primary'
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Análisis Predictivo',
    description: 'Proyecta el flujo de caja futuro y detecta anomalías antes de que se conviertan en problemas.',
    color: 'success'
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: 'Automatización Inteligente',
    description: 'Clasificación automática de pólizas y facturas mediante aprendizaje profundo para ahorrar horas de trabajo.',
    color: 'info'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Contabilidad Completa',
    description: 'Gestión integral de pólizas, cuentas y períodos con validación automática de partida doble.',
    color: 'warning'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Seguridad Empresarial',
    description: 'Auditoría completa con detección de fraude asistida por IA y trazabilidad total.',
    color: 'error'
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: 'Ecosistema en la Nube',
    description: 'Administra múltiples empresas con acceso total desde cualquier lugar y respaldo automático.',
    color: 'primary'
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$999',
    period: '/mes',
    description: 'Ideal para pequeñas empresas',
    features: ['1 empresa', '3 usuarios', 'Pólizas ilimitadas', 'Reportes básicos', 'Soporte email'],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$2,499',
    period: '/mes',
    description: 'Para empresas en crecimiento',
    features: ['5 empresas', '10 usuarios', 'Todo lo de Starter', 'Activos fijos', 'Conciliación bancaria', 'Soporte prioritario'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Personalizado',
    period: '',
    description: 'Soluciones corporativas',
    features: ['Empresas ilimitadas', 'Usuarios ilimitados', 'Todo lo de Professional', 'API dedicada', 'Implementación personalizada', 'Soporte 24/7'],
    highlighted: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useAppStore((s) => s.navigate);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background selection:bg-primary/30">
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-playfair font-black text-foreground tracking-tight">GANESHA</span>
                <span className="text-[9px] font-black tracking-[0.3em] text-muted-foreground uppercase -mt-1 opacity-70">Accounting Suite</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-10">
              {['features', 'benefits', 'pricing'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => scrollToSection(item)} 
                  className="text-[10px] font-black tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors uppercase"
                >
                  {item === 'features' ? 'Funciones' : item === 'benefits' ? 'Impacto' : 'Precios'}
                </button>
              ))}
              <div className="h-6 w-px bg-border mx-2" />
              <button 
                onClick={() => navigate('login')}
                className="text-[10px] font-black tracking-[0.2em] text-foreground hover:text-primary transition-colors uppercase"
              >
                Ingresar
              </button>
              <PastelButton size="sm" onClick={() => navigate('register')} className="px-8 shadow-xl shadow-primary/10">
                Empezar Grátis
              </PastelButton>
            </div>

            <button className="lg:hidden p-2 rounded-xl bg-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-background border-b border-border overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="text-left font-bold">Funciones</button>
                <button onClick={() => { scrollToSection('benefits'); setMobileMenuOpen(false); }} className="text-left font-bold">Impacto</button>
                <button onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }} className="text-left font-bold">Precios</button>
                <div className="h-px bg-border" />
                <button onClick={() => navigate('login')} className="text-left font-bold text-primary">Ingresar</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 lg:px-12 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-float-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] bg-accent/20 blur-[100px] rounded-full" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-success/10 blur-[80px] rounded-full animate-pulse-soft" />
        </div>

        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="max-w-7xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-card border border-border shadow-sm text-foreground text-[10px] font-black tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              IA Nativa para la Contabilidad Moderna
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-playfair font-black text-foreground leading-[0.95] tracking-tight">
              Excelencia <br />
              <span className="italic text-primary font-medium">Financiera.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Transformamos la complejidad contable en claridad estratégica mediante <span className="text-foreground font-black underline decoration-primary decoration-4 underline-offset-4">inteligencia artificial de vanguardia</span>.
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-6">
              <PastelButton size="lg" className="px-12 py-8 text-base rounded-2xl group shadow-2xl shadow-primary/20" onClick={() => navigate('register')}>
                Comenzar Gratis
                <ArrowUpRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </PastelButton>
              <button 
                onClick={() => navigate('login')}
                className="flex items-center gap-4 px-10 py-5 rounded-2xl bg-card border border-border hover:bg-muted transition-all font-black text-foreground text-xs tracking-widest uppercase group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-primary fill-current" />
                </div>
                Explorar Demo
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 relative max-w-6xl mx-auto px-4"
          >
             <div className="relative z-10 p-2 md:p-3 rounded-[40px] bg-card border border-border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]">
                <div className="aspect-[16/10] bg-muted rounded-[32px] overflow-hidden flex items-center justify-center relative inner-shadow">
                  {/* Mockup Content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
                  <div className="flex flex-col items-center gap-8 relative z-20">
                    <motion.div 
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] bg-primary flex items-center justify-center shadow-2xl"
                    >
                      <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </motion.div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-playfair font-black">GANESHA AI</h3>
                       <p className="text-sm font-medium italic opacity-60 tracking-wider">"Analizando tendencias de facturación..."</p>
                    </div>
                  </div>
                  
                  {/* Floating elements inside mockup */}
                  <div className="absolute top-1/4 left-10 p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-xl">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success" /></div>
                      <div>
                        <p className="text-[10px] font-bold opacity-50">CRECIMIENTO</p>
                        <p className="text-lg font-black">+240%</p>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
             
             {/* External floating badges */}
             <div className="absolute -top-12 -right-6 hidden lg:block">
               <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 6, repeat: Infinity }} className="bg-card/80 backdrop-blur-xl p-6 rounded-3xl border border-border shadow-2xl flex gap-4 items-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center"><Zap className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h4 className="text-sm font-black">ULTRA RÁPIDO</h4>
                    <p className="text-[10px] opacity-60">Procesamiento en MS</p>
                  </div>
               </motion.div>
             </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-40 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
            <div className="max-w-3xl space-y-6 text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Tecnología de Punta</span>
              <h2 className="text-5xl lg:text-7xl font-playfair font-black text-foreground leading-[1.1]">
                Diseñado para <br /> <span className="italic opacity-40 font-medium">trascender límites.</span>
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-sm lg:text-right font-medium leading-relaxed">
              Cada módulo ha sido forjado con precisión matemática y visión estratégica para su negocio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="h-full p-12 rounded-[48px] bg-card border border-border hover:border-primary transition-all duration-700 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
                  
                  <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-10 text-white shadow-xl transition-all duration-500", `bg-${f.color || 'primary'}`)}>
                    {f.icon}
                  </div>
                  
                  <h3 className="text-2xl font-playfair font-black mb-4">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium mb-8">
                    {f.description}
                  </p>
                  
                  <div className="mt-auto flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-500 text-primary">
                    Leer más <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / Impact */}
      <section id="benefits" className="py-40 px-6 lg:px-12 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
           <div className="space-y-10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Prueba de Valor</span>
              <h2 className="text-5xl lg:text-7xl font-playfair font-black leading-[1.1]">
                El impacto que <br /> <span className="italic opacity-40 font-medium">su empresa merece.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                No vendemos software, entregamos soberanía sobre sus datos financieros y tiempo para lo que realmente importa: <span className="text-foreground font-bold">crecer.</span>
              </p>
              
              <div className="grid grid-cols-2 gap-12 pt-4">
                {[
                  { val: '99.9%', label: 'Disponibilidad' },
                  { val: '+80%', label: 'Eficiencia' }
                ].map((s, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-5xl font-playfair font-black text-primary">{s.val}</p>
                    <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
           </div>

           <div className="relative">
              <div className="absolute inset-x-4 inset-y-10 bg-primary/10 rounded-[64px] rotate-2 -z-10" />
              <div className="p-12 sm:p-16 rounded-[64px] bg-card border border-border shadow-3xl space-y-12 backdrop-blur-md">
                 {[
                   { icon: <TrendingUp className="w-5 h-5" />, label: 'Automatización Inteligente', val: '92%' },
                   { icon: <Globe className="w-5 h-5" />, label: 'Acceso Global Real-time', val: '100%' },
                   { icon: <Lock className="w-5 h-5" />, label: 'Seguridad Militar SSL', val: 'MAX' }
                 ].map((item, i) => (
                   <div key={i} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">{item.icon}</div>
                          <span className="text-xs font-black tracking-tight uppercase">{item.label}</span>
                        </div>
                        <span className="text-2xl font-playfair font-black">{item.val}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: item.val === 'MAX' ? '100%' : item.val }}
                          transition={{ duration: 1.5, delay: i * 0.2 }}
                          className="h-full bg-primary" 
                        />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-40 px-6 lg:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inversión Inteligente</span>
            <h2 className="text-5xl lg:text-7xl font-playfair font-black">Planes <span className="italic opacity-40 font-medium">Premium.</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Precios transparentes diseñados para escalar con su éxito.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {pricingPlans.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative group rounded-[48px] p-12 border transition-all duration-700",
                  p.highlighted 
                    ? "bg-foreground text-background border-foreground shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] scale-105 z-10" 
                    : "bg-card border-border hover:border-primary"
                )}
              >
                {p.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white border-2 border-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl">
                    Gold Standard
                  </div>
                )}
                
                <h3 className="text-3xl font-playfair font-black mb-2">{p.name}</h3>
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-10", p.highlighted ? "text-primary" : "text-muted-foreground")}>{p.description}</p>
                
                <div className="mb-10">
                  <span className="text-5xl font-playfair font-black">{p.price}</span>
                  <span className="text-sm font-medium opacity-60 ml-2">{p.period}</span>
                </div>

                <ul className="space-y-6 mb-12">
                   {p.features.map((f, ji) => (
                     <li key={ji} className="flex gap-4 items-center">
                        <CheckCircle className={cn("w-5 h-5 shrink-0", p.highlighted ? "text-primary" : "text-success")} />
                        <span className="text-sm font-medium opacity-80">{f}</span>
                     </li>
                   ))}
                </ul>

                <PastelButton 
                  variant={p.highlighted ? 'default' : 'outline'}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black text-xs tracking-widest uppercase",
                    p.highlighted ? "bg-white text-black hover:bg-muted" : "border-2"
                  )}
                  onClick={() => p.highlighted ? navigate('register') : scrollToSection('contact')}
                >
                  Empezar ahora
                </PastelButton>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-48 px-6 lg:px-12 bg-foreground text-background relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[180px] rounded-full pointer-events-none" />
         
         <div className="max-w-4xl mx-auto text-center relative z-10 space-y-12">
            <h2 className="text-6xl md:text-8xl font-playfair font-black leading-none tracking-tight">
               Evolucione hacia la <br /> <span className="text-primary italic font-medium">maestría financiera.</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
               Únase al club exclusivo de empresas nicaragüenses que ya operan a la velocidad de la luz.
            </p>
            <div className="flex flex-wrap justify-center gap-8 pt-4">
               <PastelButton size="lg" className="px-14 py-8 bg-white text-black hover:bg-primary hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-3xl" onClick={() => navigate('register')}>
                  Solicitar Acceso
               </PastelButton>
               <button className="px-12 py-8 border-2 border-white/20 rounded-2xl font-black text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all">
                  Contacto Directo
               </button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 lg:px-12 bg-black text-muted-foreground">
         <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-20 pb-20 border-b border-white/5">
                <div className="space-y-8 lg:col-span-1">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-playfair font-black text-white tracking-tight">GANESHA</span>
                   </div>
                   <p className="text-sm font-medium leading-relaxed opacity-60">
                      Redefiniendo el estándar empresarial con inteligencia artificial y diseño disruptivo.
                   </p>
                </div>

                {['Plataforma', 'Asistencia', 'Legal'].map((col, i) => (
                  <div key={i} className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white underline decoration-primary underline-offset-8 decoration-2">{col}</h4>
                    <ul className="space-y-6">
                      {['Función A', 'Función B', 'Función C', 'Función D'].map((l, j) => (
                        <li key={j}><button className="text-[11px] font-bold tracking-widest uppercase hover:text-white transition-colors">{l}</button></li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>

            <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] font-black uppercase tracking-[0.3em]">
               <p>© 2026 GANESHA ENTERPRISE. Todos los derechos reservados.</p>
               <div className="flex gap-8 items-center">
                  <span className="text-white">Hecho en Nicaragua</span>
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  <span className="opacity-40">Privacy Policy</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
