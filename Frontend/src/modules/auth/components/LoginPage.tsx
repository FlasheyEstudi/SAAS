'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Input } from '@/components/ui/input';
import { PastelButton } from '@/components/ui/pastel-button';
import { Sparkles, ArrowLeft, ShieldCheck, Zap, Globe, ArrowRight, Lock, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const moveX = (clientX - window.innerWidth / 2) / 30;
      const moveY = (clientY - window.innerHeight / 2) / 30;
      mouseX.set(moveX);
      mouseY.set(moveY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.post(AUTH.login, formData);
      
      const { user, token } = response;
      
      // Guardar token para el apiClient
      localStorage.setItem('auth_token', token);
      
      useAppStore.getState().login(
        user, 
        token,
        user.companyId || (user.availableCompanies?.[0]?.id) || ''
      );
      
      toast.success(`Bienvenido, ${user.name}. El camino está despejado.`);
    } catch (err: any) {
      toast.error(err.error || 'Obstáculo detectado: Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col lg:flex-row overflow-auto font-sans selection:bg-primary/30">
      {/* Lado Izquierdo: Arte Minimalista */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-foreground/[0.02] items-center justify-center overflow-hidden border-r border-primary/5">
        <div className="absolute inset-0 mandala-bg opacity-30 scale-110" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        <motion.div 
          style={{ x: springX, y: springY }}
          className="relative z-10 flex flex-col items-center text-center p-12"
        >
          <div className="relative mb-8">
            <div className="absolute inset-[-40px] bg-primary/10 blur-[80px] rounded-full animate-aura" />
            <img 
              src="/personaje.png" 
              className="w-[450px] h-auto object-contain relative z-10 drop-shadow-[0_0_80px_rgba(var(--primary-rgb),0.3)] animate-float"
              alt="Ganesha Master"
            />
          </div>
          
          <div className="max-w-md space-y-4">
            <h2 className="text-5xl font-playfair font-bold text-foreground leading-none tracking-tighter">
              Claridad <span className="text-primary italic font-normal">Infinita.</span>
            </h2>
            <p className="text-base text-muted-foreground font-medium leading-relaxed">
              "El conocimiento es el removedor de todos los obstáculos."
            </p>
          </div>
        </motion.div>
      </div>

      {/* Lado Derecho: Formulario Compacto Premium */}
      <div className="w-full lg:w-[45%] flex flex-col relative bg-background h-full">
        {/* Header del Formulario */}
        <div className="p-4 sm:p-8 flex justify-between items-center">
           <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Inicio</span>
          </button>
          <img src="/GaneshaLogo.png" className="w-10 h-10 object-contain drop-shadow-lg" alt="Logo" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 xl:px-24 max-w-2xl mx-auto w-full pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-foreground mb-2 tracking-tighter uppercase">Bienvenido</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black">Acceso a tu sistema de prosperidad</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Portal de Email</label>
              </div>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="usuario@ganesha.dev"
                  className="h-14 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-12 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Llave de Sabiduría</label>
                <button type="button" className="text-[8px] font-bold text-primary hover:opacity-70 transition-opacity uppercase tracking-widest">¿Olvidaste?</button>
              </div>
              <div className="relative group">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-14 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-12 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
              </div>
            </div>

            <PastelButton
              type="submit"
              className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.4em] text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all border-none mt-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                   <span>Entrar al Sistema</span>
                   <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </PastelButton>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
              ¿Nuevo aquí?{' '}
              <button
                onClick={() => navigate('register')}
                className="text-primary hover:underline underline-offset-4 decoration-2 transition-all"
              >
                Crea tu cuenta
              </button>
            </p>
          </div>
        </div>

        {/* Footer del Formulario */}
        <div className="p-8 mt-auto text-center border-t border-primary/5">
           <span className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.5em] font-black">Ganesha Enterprise System © 2026</span>
        </div>
      </div>
    </div>
  );
}
