'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Input } from '@/components/ui/input';
import { PastelButton } from '@/components/ui/pastel-button';
import { Sparkles, ArrowLeft, ShieldCheck, Zap, Globe, ArrowRight, UserPlus, Mail, Lock, Building } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', business: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Lado Izquierdo: El Inicio del Viaje */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-foreground/[0.02] items-center justify-center p-20 border-r border-primary/5">
        <div className="absolute inset-0 mandala-bg opacity-30" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] -translate-x-1/2 translate-y-1/2 animate-pulse" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: -50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <img 
            src="/personaje.png" 
            className="w-[550px] h-auto object-contain animate-float drop-shadow-[0_0_80px_rgba(var(--primary-rgb),0.3)] mb-12"
            alt="Ganesha Character"
          />
          
          <div className="max-w-md">
            <h2 className="text-5xl font-playfair font-bold text-foreground mb-6 leading-tight tracking-tighter">
              Inicia tu <span className="text-primary italic">Transformación.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium mb-12">
              Únete a un ecosistema donde la prosperidad es la norma y los obstáculos son solo oportunidades de aprendizaje.
            </p>
            
            <div className="space-y-6">
                {[
                  { icon: <ShieldCheck className="w-5 h-5 text-primary" />, t: 'Confianza Absoluta', d: 'Tus datos, tu imperio, nuestra bóveda.' },
                  { icon: <Zap className="w-5 h-5 text-primary" />, t: 'Acción Inmediata', d: 'Configuración lista en menos de 5 minutos.' }
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-card border border-primary/5 text-left group hover:border-primary/20 transition-all">
                    <div className="p-4 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {f.icon}
                    </div>
                    <div>
                       <div className="text-foreground font-bold text-sm tracking-tight">{f.t}</div>
                       <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.3em]">{f.d}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lado Derecho: Formulario de Iniciación */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 relative overflow-y-auto">
        <motion.button
          onClick={() => navigate('landing')}
          className="absolute top-12 left-12 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Regresar</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg py-12"
        >
          <div className="flex flex-col items-center mb-16 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.4em] mb-8">
                <UserPlus className="w-4 h-4" />
                Nueva Cuenta de Prosperidad
             </div>
             <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4 tracking-tighter uppercase">Crear Perfil</h1>
             <p className="text-[10px] text-muted-foreground uppercase tracking-[0.6em] font-black">Tu primer paso hacia el éxito sin obstáculos</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Nombre Sagrado</label>
              <div className="relative">
                <Input
                  placeholder="Tu Nombre"
                  className="h-16 bg-muted/30 border-primary/5 text-foreground placeholder:text-muted-foreground/30 pl-14 px-6 rounded-2xl focus:bg-card transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Portal de Email</label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  className="h-16 bg-muted/30 border-primary/5 text-foreground placeholder:text-muted-foreground/30 pl-14 px-6 rounded-2xl focus:bg-card transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Tu Imperio (Empresa)</label>
              <div className="relative">
                <Input
                  placeholder="Nombre de Negocio"
                  className="h-16 bg-muted/30 border-primary/5 text-foreground placeholder:text-muted-foreground/30 pl-14 px-6 rounded-2xl focus:bg-card transition-all"
                  value={formData.business}
                  onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  required
                />
                <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Llave Maestra</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-16 bg-muted/30 border-primary/5 text-foreground placeholder:text-muted-foreground/30 pl-14 px-6 rounded-2xl focus:bg-card transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <PastelButton
              type="submit"
              className="md:col-span-2 w-full h-20 bg-primary text-primary-foreground font-black uppercase tracking-[0.5em] text-[10px] shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all border-none mt-4"
              disabled={loading}
            >
              {loading ? (
                <span>Manifestando realidad...</span>
              ) : (
                <div className="flex items-center justify-center gap-3">
                   <span>Comenzar mi Imperio</span>
                   <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </PastelButton>
          </form>

          <div className="mt-16 text-center">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
              ¿Ya eres un iniciado?{' '}
              <button
                onClick={() => navigate('login')}
                className="text-primary hover:underline underline-offset-4 decoration-2"
              >
                Entra aquí
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
