'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, ArrowRight, Lock, Mail, Eye, EyeOff, 
  ShieldCheck, Activity, Globe, Wifi, Clock, Zap,
  Fingerprint, Terminal
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GaneshaLoader } from '@/components/ui/ganesha-loader';

export function LoginPage() {
  const navigate = useAppStore((s) => s.navigate);
  const theme = useAppStore((s) => s.theme);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [systemTime, setSystemTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.post(AUTH.login, formData);
      const { user, token } = response;
      localStorage.setItem('auth_token', token);
      useAppStore.getState().login(user, token, user.companyId || (user.availableCompanies?.[0]?.id) || '');
      toast.success(`Acceso Autorizado.`);
    } catch (err: any) {
      toast.error(err.error || 'Obstáculo detectado.');
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-[1fr_550px] selection:bg-primary/40 relative overflow-hidden transition-colors duration-700",
      theme
    )}>
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      {/* --- LEFT: BRAND & MASCOT --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:flex flex-col p-16 relative bg-zinc-950/50 border-r border-white/5 overflow-hidden"
      >
         <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('landing')}>
               <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_0_30px_rgba(234,88,12,0.15)]">
                  <img src="/GaneshaLogo.png" alt="Logo" className="w-8 h-8" />
               </div>
               <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter uppercase leading-none">Ganesha<span className="text-primary">.</span></span>
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em]">Soberanía Tecnológica</span>
               </div>
            </div>

            <div className="mt-32 relative group">
               <div className="absolute inset-0 bg-primary/20 blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
               <motion.img 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  src="/personaje.png" 
                  alt="Mascota" 
                  className="relative z-10 w-full max-w-md mx-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
               />
            </div>

            <div className="mt-auto grid grid-cols-2 gap-8 relative z-10">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                     <Fingerprint className="w-4 h-4" /> Identidad Verificada
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Cada sesión es auditada forensemente por el motor de IA.</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                     <Terminal className="w-4 h-4" /> {systemTime}
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Conectado al núcleo central • Nicaragua • 2026</p>
               </div>
            </div>
         </div>
      </motion.div>

      {/* --- RIGHT: FORM SECTION --- */}
      <div className="relative flex flex-col items-center justify-center p-8 lg:p-20 z-10 bg-background/50 backdrop-blur-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] space-y-12"
        >
          <div className="space-y-4">
             <button onClick={() => navigate('landing')} className="flex items-center gap-2 text-zinc-500 hover:text-primary mb-8 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Volver al Inicio</span>
             </button>
             <div className="w-12 h-1 rounded-full bg-primary/20" />
             <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Acceder al <br/><span className="text-primary italic">Imperio.</span></h1>
             <p className="text-sm text-zinc-500 font-medium">Ingresa tus credenciales maestras para sincronizarte.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Protocolo Email</label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="admin@ganesha.com"
                  className="w-full h-16 bg-zinc-900/50 border border-white/5 text-white pl-16 rounded-[1.5rem] focus:border-primary transition-all text-sm font-bold tracking-normal placeholder:text-zinc-700"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-30 group-focus-within:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Llave Criptográfica</label>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-16 bg-zinc-900/50 border border-white/5 text-white pl-16 pr-16 rounded-[1.5rem] focus:border-primary transition-all text-sm font-bold placeholder:text-zinc-700"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-30 group-focus-within:opacity-100 transition-opacity" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-16 bg-primary text-black rounded-[1.5rem] font-black uppercase tracking-[0.5em] text-xs overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 border-none group"
            >
              <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative z-10 flex items-center justify-center gap-3">
                 {loading ? <Zap className="w-5 h-5 animate-spin" /> : <><span>Sincronizar</span> <ArrowRight className="w-4 h-4" /></>}
              </div>
            </button>
          </form>

          <div className="pt-10 border-t border-white/5 text-center space-y-6">
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.1em]">
              ¿Sin Acceso?{' '}
              <button onClick={() => navigate('register')} className="text-primary hover:underline underline-offset-4 font-black">Iniciar Registro</button>
            </p>
            
            <div className="flex justify-center gap-4">
               <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                  <Globe className="w-5 h-5 text-zinc-500" />
               </div>
               <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                  <ShieldCheck className="w-5 h-5 text-zinc-500" />
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- CINEMATIC LOADER --- */}
      <AnimatePresence>
        {loading && (
          <div className="fixed inset-0 z-[200]">
            <GaneshaLoader message="Sincronizando con el Núcleo..." />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
