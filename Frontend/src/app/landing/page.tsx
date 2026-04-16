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
  Play
} from 'lucide-react';
import { useState } from 'react';
import { PastelButton } from '@/components/ui/pastel-button';
import { VintageCard } from '@/components/ui/vintage-card';

const features = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Contabilidad Completa',
    description: 'Gestión integral de pólizas, cuentas contables y períodos fiscales con validación automática de partida doble.',
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6" />,
    title: 'Reportes Financieros',
    description: 'Balanza de comprobación, estados financieros, flujos de efectivo y más con exportación profesional.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Seguridad Empresarial',
    description: 'Auditoría completa, control de accesos y trazabilidad de todas las operaciones del sistema.',
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: 'Multi-Compañía',
    description: 'Administra múltiples empresas desde una sola plataforma con separación total de datos.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Activos Fijos',
    description: 'Control y depreciación automática de activos fijos con métodos configurables.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Facturación',
    description: 'Gestión de facturas, clientes, proveedores y cálculo automático de impuestos.',
  },
];

const benefits = [
  'Cumplimiento normativo SAT',
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
    <div className="min-h-screen bg-gradient-to-b from-vintage-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-vintage-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vintage-600 to-vintage-800 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-playfair font-bold text-vintage-800">ContaERP</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm text-vintage-600 hover:text-vintage-800 transition-colors">Características</button>
              <button onClick={() => scrollToSection('benefits')} className="text-sm text-vintage-600 hover:text-vintage-800 transition-colors">Beneficios</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm text-vintage-600 hover:text-vintage-800 transition-colors">Precios</button>
              <PastelButton variant="outline" size="sm" onClick={() => window.location.href = '/'}>Iniciar Sesión</PastelButton>
              <PastelButton size="sm" onClick={() => scrollToSection('contact')}>Demo Gratis</PastelButton>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-vintage-100 py-4">
            <div className="flex flex-col gap-4 px-4">
              <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="text-left text-sm text-vintage-600">Características</button>
              <button onClick={() => { scrollToSection('benefits'); setMobileMenuOpen(false); }} className="text-left text-sm text-vintage-600">Beneficios</button>
              <button onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }} className="text-left text-sm text-vintage-600">Precios</button>
              <PastelButton variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/'}>Iniciar Sesión</PastelButton>
              <PastelButton size="sm" className="w-full" onClick={() => { scrollToSection('contact'); setMobileMenuOpen(false); }}>Demo Gratis</PastelButton>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vintage-100 text-vintage-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Sistema ERP Contable Empresarial
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-bold text-vintage-900 leading-tight">
                Contabilidad Inteligente para tu Empresa
              </h1>
              <p className="text-lg text-vintage-600 max-w-xl">
                Gestiona toda tu operación financiera con un sistema moderno, seguro y fácil de usar. 
                Desde pólizas hasta reportes financieros, todo en un solo lugar.
              </p>
              <div className="flex flex-wrap gap-4">
                <PastelButton size="lg" className="gap-2" onClick={() => scrollToSection('contact')}>
                  Comenzar Demo Gratis
                  <ArrowRight className="w-5 h-5" />
                </PastelButton>
                <PastelButton variant="outline" size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  Ver Video Demo
                </PastelButton>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-playfair font-bold text-vintage-800">500+</p>
                  <p className="text-sm text-vintage-500">Empresas confían</p>
                </div>
                <div className="w-px h-12 bg-vintage-200" />
                <div>
                  <p className="text-3xl font-playfair font-bold text-vintage-800">99.9%</p>
                  <p className="text-sm text-vintage-500">Uptime garantizado</p>
                </div>
                <div className="w-px h-12 bg-vintage-200" />
                <div>
                  <p className="text-3xl font-playfair font-bold text-vintage-800">24/7</p>
                  <p className="text-sm text-vintage-500">Soporte técnico</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <VintageCard className="p-6 shadow-2xl" hover={false}>
                <div className="aspect-video bg-gradient-to-br from-vintage-100 to-vintage-50 rounded-xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-vintage-600 to-vintage-800 flex items-center justify-center mx-auto">
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-playfair font-semibold text-vintage-800">Dashboard Interactivo</p>
                      <p className="text-sm text-vintage-500">Visualiza tus finanzas en tiempo real</p>
                    </div>
                  </div>
                </div>
              </VintageCard>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-vintage-500">Ingresos</p>
                    <p className="text-sm font-semibold text-vintage-800">+$125,430</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-vintage-500">Pólizas</p>
                    <p className="text-sm font-semibold text-vintage-800">1,234 este mes</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-vintage-900 mb-4">
              Todo lo que necesitas para tu contabilidad
            </h2>
            <p className="text-lg text-vintage-600 max-w-2xl mx-auto">
              Funcionalidades completas diseñadas para simplificar la gestión financiera de tu empresa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <VintageCard className="h-full p-6" hover>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vintage-100 to-vintage-200 flex items-center justify-center mb-4 text-vintage-700">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-playfair font-semibold text-vintage-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-vintage-600">{feature.description}</p>
                </VintageCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-vintage-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-vintage-900 mb-6">
                ¿Por qué elegir ContaERP?
              </h2>
              <p className="text-lg text-vintage-600 mb-8">
                Nuestro sistema está diseñado pensando en las necesidades reales de las empresas mexicanas, 
                cumpliendo con todas las normativas vigentes.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-vintage-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <VintageCard className="p-8" hover={false}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-vintage-500">Eficiencia Operativa</p>
                      <p className="text-3xl font-playfair font-bold text-vintage-800">+85%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                  <div className="h-2 bg-vintage-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '85%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-success rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-vintage-500">Reducción de Errores</p>
                      <p className="text-3xl font-playfair font-bold text-vintage-800">-95%</p>
                    </div>
                    <Shield className="w-8 h-8 text-info" />
                  </div>
                  <div className="h-2 bg-vintage-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '95%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-info rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-vintage-500">Tiempo de Cierre</p>
                      <p className="text-3xl font-playfair font-bold text-vintage-800">-60%</p>
                    </div>
                    <Cloud className="w-8 h-8 text-vintage-600" />
                  </div>
                  <div className="h-2 bg-vintage-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '60%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-vintage-600 rounded-full"
                    />
                  </div>
                </div>
              </VintageCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-vintage-900 mb-4">
              Planes flexibles para cada necesidad
            </h2>
            <p className="text-lg text-vintage-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu empresa. Todos incluyen prueba gratis de 14 días.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <VintageCard 
                  className={`h-full p-6 ${plan.highlighted ? 'ring-2 ring-vintage-400 shadow-xl' : ''}`}
                  hover
                >
                  {plan.highlighted && (
                    <div className="mb-4">
                      <span className="px-3 py-1 text-xs font-medium bg-vintage-100 text-vintage-700 rounded-full">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-playfair font-bold text-vintage-800 mb-2">{plan.name}</h3>
                  <p className="text-sm text-vintage-500 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-playfair font-bold text-vintage-900">{plan.price}</span>
                    <span className="text-vintage-500">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm text-vintage-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <PastelButton 
                    variant={plan.highlighted ? 'default' : 'outline'} 
                    className="w-full"
                    onClick={() => scrollToSection('contact')}
                  >
                    Comenzar Prueba Gratis
                  </PastelButton>
                </VintageCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-vintage-800 to-vintage-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-playfair font-bold text-white mb-6">
              ¿Listo para transformar tu contabilidad?
            </h2>
            <p className="text-lg text-vintage-200 mb-8 max-w-2xl mx-auto">
              Agenda una demostración gratuita y descubre cómo ContaERP puede optimizar 
              la gestión financiera de tu empresa.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <PastelButton size="lg" className="bg-white text-vintage-800 hover:bg-vintage-50">
                Agendar Demostración
              </PastelButton>
              <PastelButton variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Contactar Ventas
              </PastelButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-vintage-900 text-vintage-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vintage-500 to-vintage-700 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-playfair font-bold text-white">ContaERP</span>
              </div>
              <p className="text-sm">Sistema ERP contable empresarial para la gestión integral de tu negocio.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition-colors">Características</button></li>
                <li><button className="hover:text-white transition-colors">Precios</button></li>
                <li><button className="hover:text-white transition-colors">Actualizaciones</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition-colors">Nosotros</button></li>
                <li><button className="hover:text-white transition-colors">Contacto</button></li>
                <li><button className="hover:text-white transition-colors">Privacidad</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition-colors">Documentación</button></li>
                <li><button className="hover:text-white transition-colors">Ayuda</button></li>
                <li><button className="hover:text-white transition-colors">Estado</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-vintage-800 text-center text-sm">
            <p>&copy; 2025 ContaERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
