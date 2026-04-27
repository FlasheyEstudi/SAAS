'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Bot, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PastelButton } from '@/components/ui/pastel-button';
import { VintageCard } from '@/components/ui/vintage-card';
import { toast } from 'sonner';

import { loginSchema } from '@/lib/schemas/auth';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';

export function LoginPage() {
  const { navigate, login: storeLogin } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: 'admin@alpha.com.ni', password: 'Admin123!' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorDetails(null);

    // 1. Zod Validation (100/100)
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      // 2. Proceso de Login vía ApiClient blindado
      const result = await apiClient.post(AUTH.login, formData);

      if (result.user) {
        const { user } = result;
        storeLogin(user, '', user.companyId || (user.availableCompanies?.[0]?.id));
        toast.success('Sabiduría aceptada. Bienvenido de vuelta.');
      } else {
        toast.error('La llave no encaja (Credenciales inválidas)');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      const msg = err.error || 'Obstáculo de red: No se pudo alcanzar el servidor sagrado.';
      toast.error(msg);
      setErrorDetails(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ganesha subtle */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <img 
            src="/images/ganesha_hero.png" 
            className="w-full h-full object-cover blur-sm"
            alt="fondo"
         />
         <div className="absolute inset-0 bg-black/60" />
      </div>

      <motion.button
        onClick={() => navigate('landing')}
        className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Volver Portal</span>
      </motion.button>

      <div className="w-full max-w-6xl z-10 flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
        {/* Lado Informativo de Valor */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="hidden lg:flex flex-col gap-8 pr-12 border-r border-white/5"
        >
          <div className="space-y-4">
            <h2 className="text-white text-4xl font-playfair font-bold leading-tight uppercase tracking-tighter">
              ¿Por qué entrar hoy a <span className="text-amber-500">Ganesha</span>?
            </h2>
            <p className="text-zinc-400 text-lg font-medium">
              Tu contabilidad ya no es un registro del pasado, es una guía para el futuro.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { t: 'Seguridad Divina', d: 'Encriptación de grado bancario para cada transacción.' },
              { t: 'Visión 360°', d: 'Conoce tu flujo de caja en tiempo real, sin esperas.' },
              { t: 'IA Accountant', d: 'Nuestra inteligencia detecta el 99.7% de errores antes de que ocurran.' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <div>
                  <h4 className="text-white font-bold text-sm tracking-wide uppercase">{f.t}</h4>
                  <p className="text-zinc-500 text-xs mt-1">{f.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="italic text-zinc-400 text-sm">
              "Ganesha ha reducido mis tiempos de cierre mensual de 5 días a solo 3 horas. Es realmente el removedor de obstáculos."
            </p>
            <p className="mt-4 text-amber-500 text-xs font-bold uppercase tracking-widest">— CEO, Fintech Nicaragua</p>
          </div>
        </motion.div>

        {/* Formulario de Login */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <VintageCard variant="premium" className="p-10 bg-zinc-950/40 border border-white/5 backdrop-blur-3xl">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-playfair font-bold text-white mb-2 tracking-tight transition-all">Mente Enfocada</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Acceso a la Prosperidad</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Portal de Acceso (Email)</label>
                <Input
                  type="email"
                  placeholder="usuario@ganesha.dev"
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700 font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Llave de Sabiduría</label>
                  <button type="button" className="text-[9px] font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest">Recuperar</button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  variant="premium"
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <PastelButton
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-orange-500/20 hover:scale-[1.02] border-none"
                disabled={loading}
              >
                {loading ? 'Removiendo Obstáculos...' : (
                  <div className="flex items-center gap-2">
                    <span>Desbloquear Camino</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </PastelButton>
            </form>

            <p className="mt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              ¿No eres parte de la abundancia?{' '}
              <button
                onClick={() => navigate('register')}
                className="text-amber-500 hover:text-amber-400"
              >
                Crea tu perfil ahora
              </button>
            </p>
          </VintageCard>
        </motion.div>
      </div>

      <div className="mt-12 flex items-center gap-3 opacity-20 hover:opacity-50 transition-opacity">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Soberanía Financiera Garantizada</span>
      </div>
    </div>
  );
}
