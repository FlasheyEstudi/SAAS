'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Bot, UserPlus, Sparkles, ArrowRight, ArrowLeft, Zap, ShieldCheck, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PastelButton } from '@/components/ui/pastel-button';
import { VintageCard } from '@/components/ui/vintage-card';
import { toast } from 'sonner';

export function RegisterPage() {
  const { navigate } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    company: '', 
    phone: '',
    password: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://192.168.0.110:3001/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('El camino está despejado: Cuenta creada exitosamente. Bienvenido a la abundancia.');
        navigate('login');
      } else {
        toast.error(result.message || 'Error en el ritual de registro');
      }
    } catch (err) {
      console.error('Register Error:', err);
      toast.error('Obstáculo de red: El servidor sagrado no responde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ganesha subtle */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none scale-110">
         <img 
            src="/images/ganesha_hero.png" 
            className="w-full h-full object-cover blur-md"
            alt="fondo"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <motion.button
        onClick={() => navigate('landing')}
        className="absolute top-8 left-8 flex items-center gap-2 text-zinc-600 hover:text-white transition-colors z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Regresar</span>
      </motion.button>

      <div className="w-full max-w-6xl z-10 flex flex-col-reverse lg:flex-row gap-12 items-center">
        {/* Formulario de Registro */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-3/5"
        >
          <VintageCard variant="premium" className="p-10 bg-zinc-950/60 border border-white/5 backdrop-blur-3xl shadow-2xl">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6 p-1">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <h1 className="text-4xl font-playfair font-bold text-white mb-2 uppercase tracking-tighter">Inicia tu Prosperidad</h1>
              <p className="text-[10px] text-amber-500/80 uppercase tracking-[0.4em] font-black">Registro maestro de Ganesha ERP</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Tu Nombre Completo</label>
                <Input
                  placeholder="Ej: Juan Pérez"
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-800"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Nombre de Empresa / Razón Social</label>
                <Input
                  placeholder="Empresa Alfa S.A."
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-800"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Portal (Email)</label>
                <Input
                  type="email"
                  placeholder="hola@ganesha.dev"
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-800"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Contacto (Teléfono)</label>
                <Input
                  placeholder="+505 1234 5678"
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-800"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Palabra de Poder (Clave)</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-800"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <PastelButton
                  type="submit"
                  className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-white/5 hover:bg-amber-400 hover:scale-[1.01] transition-all border-none"
                  disabled={loading}
                >
                  {loading ? 'Preparando Terreno...' : (
                    <div className="flex items-center gap-3">
                      <span>Solicitar Acceso a Ganesha</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </PastelButton>
              </div>
            </form>

            <p className="mt-8 text-center text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
              ¿Ya eres sabio?{' '}
              <button
                onClick={() => navigate('login')}
                className="text-amber-500 hover:text-amber-400 transition-colors"
              >
                Inicia Sesión aquí
              </button>
            </p>
          </VintageCard>
        </motion.div>

        {/* Sidebar de Beneficios en Registro */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="hidden lg:flex flex-col gap-10 lg:w-2/5 pl-12 border-l border-white/5"
        >
          <div className="space-y-4">
            <h3 className="text-white text-4xl font-playfair font-bold leading-tight">Inicia una nueva etapa corporativa</h3>
            <p className="text-zinc-500 text-sm font-medium">Ganesha escala contigo, desde un pequeño emprendimiento hasta una corporación global.</p>
          </div>
          
          <div className="grid gap-8">
            {[
              { icon: <Globe className="w-5 h-5 text-amber-500" />, t: 'Multi-Tenant Nativo', d: 'Gestiona subsidiarias o múltiples empresas con una sola mente.' },
              { icon: <ShieldCheck className="w-5 h-5 text-amber-500" />, t: 'Nube Inmutable', d: 'Tus auditorías nunca se pierden. Registro histórico eterno y protegido.' },
              { icon: <Zap className="w-5 h-5 text-amber-500" />, t: 'Alta Velocidad', d: 'De 1 a 10,000 agentes. Ganesha crece sin perder rendimiento.' }
            ].map((item, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 group hover:border-amber-500/20 transition-all">
                 <div className="mb-4">{item.icon}</div>
                 <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-2">{item.t}</h4>
                 <p className="text-zinc-500 text-xs leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-white/5">
               <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                         <Bot className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                         <div className="text-white font-bold text-sm tracking-tight">Activación Inmediata</div>
                         <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Tu primer período configurado en segundos</div>
                    </div>
               </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
