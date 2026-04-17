'use client';

import { motion } from 'framer-motion';
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
  Calculator
} from 'lucide-react';
import { useState } from 'react';
import { PastelButton } from '@/components/ui/pastel-button';
import { VintageCard } from '@/components/ui/vintage-card';

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'GANESHA AI: Tu Asistente',
    description: 'Nuestra IA residente que responde preguntas complejas sobre tus finanzas y genera reportes con solo pedírselo.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Análisis Predictivo',
    description: 'Proyecta el flujo de caja futuro y detecta anomalías antes de que se conviertan en problemas.',
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: 'Automatización Inteligente',
    description: 'Clasificación automática de pólizas y facturas mediante aprendizaje profundo para ahorrar horas de trabajo.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Contabilidad Completa',
    description: 'Gestión integral de pólizas, cuentas y períodos con validación automática de partida doble.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Seguridad Empresarial',
    description: 'Auditoría completa con detección de fraude asistida por IA y trazabilidad total.',
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: 'Ecosistema en la Nube',
    description: 'Administra múltiples empresas con acceso total desde cualquier lugar y respaldo automático.',
  },
];

const benefits = [
  'Cumplimiento normativo DGI',
  'Procesamiento en tiempo real',
  'Interfaz intuitiva y moderna',
  'Soporte multi-moneda',
  'Integración bancaria',
  'Respaldo automático',
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] selection:bg-vintage-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-xl border-b border-vintage-100/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-vintage-700 via-vintage-800 to-vintage-900 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-vintage-900/10">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-playfair font-black text-vintage-900 tracking-tight">GANESHA</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-vintage-500 uppercase -mt-1">Accounting Suite</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-10">
              {['features', 'benefits', 'pricing'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => scrollToSection(item)} 
                  className="text-xs font-bold tracking-widest text-vintage-600 hover:text-vintage-900 transition-colors uppercase"
                >
                  {item === 'features' ? 'Características' : item === 'benefits' ? 'Beneficios' : 'Precios'}
                </button>
              ))}
              <div className="h-6 w-px bg-vintage-200 mx-2" />
              <button 
                onClick={() => window.location.href = '/'}
                className="text-xs font-bold tracking-widest text-vintage-800 hover:text-vintage-900 transition-colors uppercase"
              >
                Ingresar
              </button>
              <PastelButton size="sm" onClick={() => scrollToSection('contact')} className="px-8 shadow-xl shadow-vintage-900/10">
                Empieza Ahora
              </PastelButton>
            </div>

            <button className="lg:hidden p-2 rounded-xl bg-vintage-100/50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 lg:px-12 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-vintage-100/30 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-lavender/20 rounded-full blur-[100px] -ml-48 -mb-48" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col items-center text-center space-y-10 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-vintage-100 shadow-sm text-vintage-700 text-[11px] font-bold tracking-[0.15em] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-vintage-400" />
                La Nueva Era de la Contabilidad en Nicaragua
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-black text-vintage-900 leading-[1.05] tracking-tight">
                Gestión Inteligente. <br />
                <span className="italic text-vintage-500 font-medium">Sin Esfuerzo.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-vintage-600 max-w-2xl mx-auto leading-relaxed font-medium">
                GANESHA es el primer ERP con <span className="text-vintage-800 font-bold decoration-vintage-200 underline decoration-4 underline-offset-4">inteligencia artificial nativa</span> diseñado para transformar la complejidad contable en claridad estratégica.
              </p>

              <div className="flex flex-wrap justify-center gap-6 pt-4">
                <PastelButton size="lg" className="px-10 py-7 text-base rounded-2xl group shadow-2xl shadow-vintage-900/20" onClick={() => scrollToSection('contact')}>
                  Prueba Gratuita
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </PastelButton>
                <button className="flex items-center gap-4 px-8 py-4 rounded-2xl border-2 border-vintage-100 hover:bg-vintage-50 transition-all font-bold text-vintage-700 text-sm group">
                  <div className="w-10 h-10 rounded-full bg-vintage-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-vintage-700 fill-current" />
                  </div>
                  Explora la Demo
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full relative px-4"
            >
              <div className="relative z-10 p-2 md:p-4 rounded-[32px] bg-white shadow-[0_30px_100px_-20px_rgba(40,30,20,0.15)] border border-vintage-50">
                <div className="aspect-[16/9] bg-gradient-to-br from-[#FDFCF9] to-vintage-50 rounded-[24px] overflow-hidden flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PastelButton variant="outline" className="bg-white/90 backdrop-blur-md border-none scale-110">
                      Ver Recorrido Visual
                    </PastelButton>
                  </div>
                  
                  {/* Assistant Preview inside Mockup */}
                  <div className="flex flex-col items-center space-y-6 text-center max-w-md animate-float">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-vintage-600 to-vintage-900 flex items-center justify-center shadow-2xl">
                      <Bot className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-playfair font-bold text-vintage-900">GANESHA AI</p>
                      <p className="text-sm text-vintage-500 font-medium italic">"Analizando tus ingresos del trimestre..."</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating glass elements */}
              <motion.div
                animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -right-8 z-20 hidden md:block"
              >
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-vintage-400">Eficiencia</p>
                    <p className="text-lg font-playfair font-black text-vintage-900">+94%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-8 z-20 hidden md:block"
              >
                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-lavender/50 flex items-center justify-center text-vintage-800">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-vintage-400">Consultas</p>
                    <p className="text-lg font-playfair font-black text-vintage-900">Vía Chat</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl space-y-6">
              <span className="text-xs font-bold tracking-[0.3em] text-vintage-500 uppercase">La Plataforma Completa</span>
              <h2 className="text-4xl md:text-6xl font-playfair font-bold text-vintage-900 leading-tight">
                Tecnología que <br /> <span className="text-vintage-400 italic font-medium">eleva tu negocio.</span>
              </h2>
            </div>
            <p className="text-lg text-vintage-500 max-w-sm font-medium pb-2">
              Desde el cumplimiento con la DGI hasta auditorías avanzadas, diseñamos cada función para ser excepcional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="h-full p-10 rounded-[40px] border border-vintage-100 bg-[#FDFCF9] hover:bg-white hover:shadow-2xl hover:shadow-vintage-900/5 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-vintage-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-8 text-vintage-800 group-hover:bg-vintage-900 group-hover:text-white transition-colors duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-playfair font-bold text-vintage-900 mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-vintage-500 leading-relaxed font-medium text-sm group-hover:text-vintage-600 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section id="benefits" className="py-32 px-6 lg:px-12 bg-[#FDFCF9] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <span className="text-xs font-bold tracking-[0.3em] text-vintage-500 uppercase">Impacto Real</span>
              <h2 className="text-4xl md:text-6xl font-playfair font-bold text-vintage-900 leading-tight">
                Resultados que <br /> <span className="text-vintage-500 italic font-medium">hablan por sí mismos.</span>
              </h2>
              <p className="text-lg text-vintage-600 font-medium leading-relaxed">
                Nuestros clientes reportan una transformación radical en su eficiencia operativa desde el primer mes de implementación.
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="space-y-2">
                  <p className="text-4xl font-playfair font-black text-vintage-900">94%</p>
                  <p className="text-sm font-bold text-vintage-500 uppercase tracking-widest">Precisión IA</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-playfair font-black text-vintage-900">60%</p>
                  <p className="text-sm font-bold text-vintage-500 uppercase tracking-widest">Menos Tiempo</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-vintage-100/50 rounded-[48px] rotate-3 scale-95 -z-10" />
              <div className="p-10 md:p-12 rounded-[48px] bg-white shadow-2xl shadow-vintage-900/10 border border-vintage-50 space-y-10">
                {[
                  { label: "Automatización de Pólizas", value: "85%", color: "bg-success", icon: <TrendingUp className="w-5 h-5" /> },
                  { label: "Reducción de Errores", value: "95%", color: "bg-info", icon: <Shield className="w-5 h-5" /> },
                  { label: "Ahorro en Cierre Mensual", value: "60%", color: "bg-vintage-600", icon: <Cloud className="w-5 h-5" /> }
                ].map((stat, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stat.color}/10 text-vintage-800`}>{stat.icon}</div>
                        <p className="text-sm font-bold text-vintage-800 tracking-tight">{stat.label}</p>
                      </div>
                      <p className="text-2xl font-playfair font-black text-vintage-900">{stat.value}</p>
                    </div>
                    <div className="h-2.5 bg-vintage-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: stat.value }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.2 + (i * 0.2), ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full ${stat.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Minimalist & Elegant */}
      <section id="pricing" className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <span className="text-xs font-bold tracking-[0.3em] text-vintage-500 uppercase">Precios Transparentes</span>
            <h2 className="text-4xl md:text-6xl font-playfair font-bold text-vintage-900">Inversión en <span className="italic text-vintage-400 font-medium">Claridad.</span></h2>
            <p className="text-lg text-vintage-500 font-medium leading-relaxed">
              Planes diseñados para escalar con su organización. Sin cargos ocultos, solo valor excepcional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className={`h-full p-12 rounded-[40px] border transition-all duration-500 ${plan.highlighted ? 'border-vintage-900 bg-vintage-900 text-white shadow-2xl shadow-vintage-900/30' : 'border-vintage-100 bg-[#FDFCF9] hover:bg-white hover:shadow-xl'}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-vintage-400 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Recomendado
                    </div>
                  )}
                  <div className="mb-10">
                    <h3 className={`text-2xl font-playfair font-bold mb-3 ${plan.highlighted ? 'text-white' : 'text-vintage-800'}`}>{plan.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? 'text-vintage-400' : 'text-vintage-400'}`}>{plan.description}</p>
                  </div>
                  
                  <div className="mb-10">
                    <span className="text-5xl font-playfair font-black tracking-tight">{plan.price}</span>
                    <span className={`text-sm font-medium ${plan.highlighted ? 'text-vintage-400' : 'text-vintage-500'}`}>{plan.period}</span>
                  </div>

                  <ul className="space-y-5 mb-12">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-4">
                        <CheckCircle className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-vintage-400' : 'text-success'}`} />
                        <span className={`text-sm font-medium ${plan.highlighted ? 'text-vintage-100' : 'text-vintage-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <PastelButton 
                    variant={plan.highlighted ? 'default' : 'outline'} 
                    className={`w-full py-7 text-sm font-bold rounded-2xl transition-transform active:scale-95 ${plan.highlighted ? 'bg-white text-vintage-900 hover:bg-vintage-50' : 'border-2 border-vintage-200 hover:border-vintage-900 hover:bg-vintage-900 hover:text-white'}`}
                    onClick={() => scrollToSection('contact')}
                  >
                    Seleccionar Plan
                  </PastelButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Sophisticated */}
      <section id="contact" className="py-40 px-6 lg:px-12 bg-[#1A1A1A] text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-vintage-900 opacity-20 blur-[150px] rounded-full" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-5xl md:text-7xl font-playfair font-bold leading-tight">
              ¿Listo para el futuro de la <span className="text-vintage-400 italic font-medium">claridad financiera?</span>
            </h2>
            <p className="text-xl text-vintage-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Únase a las empresas líderes que ya están optimizando su gestión con GANESHA AI.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <PastelButton size="lg" className="px-12 py-8 text-base bg-white text-vintage-900 hover:bg-vintage-50 rounded-2xl shadow-2xl">
                Agenda tu Demo Privada
              </PastelButton>
              <button className="px-12 py-8 text-base font-bold text-white border-2 border-white/20 hover:border-white transition-all rounded-2xl">
                Contacto Ejecutivo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Elegant Dark */}
      <footer className="py-24 px-6 lg:px-12 bg-black text-vintage-500">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-playfair font-black text-white tracking-tight">GANESHA</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                Elevando la contabilidad nicaragüense mediante inteligencia artificial nativa y diseño excepcional.
              </p>
            </div>
            
            {[
              { title: "Plataforma", links: ["Características", "IA Ganesha", "Seguridad", "Precios"] },
              { title: "Empresa", links: ["Sobre Nosotros", "Carreras", "Prensa", "Contacto"] },
              { title: "Legal", links: ["Términos de Uso", "Privacidad", "Cookies", "Seguridad"] }
            ].map((col, i) => (
              <div key={i} className="space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white underline decoration-vintage-500 underline-offset-8">{col.title}</h4>
                <ul className="space-y-6">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <button className="text-sm font-bold hover:text-white transition-colors tracking-tight">{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] font-bold uppercase tracking-widest">
            <p>&copy; 2026 GANESHA SUITE. Todos los derechos reservados.</p>
            <p className="flex items-center gap-6">
              <span>Managua, Nicaragua</span>
              <span className="text-vintage-800">•</span>
              <span className="text-white">Hecho con Excelencia</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
