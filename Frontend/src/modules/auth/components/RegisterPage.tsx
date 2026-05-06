'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, ArrowRight, Lock, Mail, User, Building, 
  Phone, ShieldCheck, Check, X, Sparkles, Server, Zap,
  Globe, Laptop, Smartphone, Binary
} from 'lucide-react';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/schemas/auth';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function RegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const theme = useAppStore((s) => s.theme);
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

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      await apiClient.post(AUTH.register, formData);
      toast.success('Cuenta creada exitosamente.');
      navigate('login');
    } catch (err: any) {
      toast.error(err.error || 'Error en el registro.');
      setLoading(false);
    }
  };

  const pass = formData.password;
  const hasUppercase = /[A-Z]/.test(pass);
  const hasLowercase = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasMinLength = pass.length >= 8;

  return (
    <div className={cn(
      "h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-[480px_1fr] selection:bg-primary/40 relative overflow-hidden transition-colors duration-700",
      theme
    )}>
      
      {/* --- FONDO CINEMÁTICO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      {/* --- IZQUIERDA: MARCA Y MASCOTA --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:flex flex-col p-12 relative bg-zinc-950/50 border-r border-white/5 overflow-hidden justify-between"
      >
         <div className="relative z-10">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('landing')}>
               <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_0_30px_rgba(234,88,12,0.15)]">
                  <img src="/logo_ganesha.png" alt="Logo" className="w-6 h-6" onError={(e) => e.currentTarget.src = "/GaneshaLogo.png"} />
               </div>
               <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tighter uppercase leading-none">Ganesha<span className="text-primary">.</span></span>
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.3em]">Constructor de Imperios</span>
               </div>
            </div>

            <div className="mt-16 space-y-8">
               <h2 className="text-3xl font-black tracking-tighter uppercase leading-tight">Inicia tu <br /><span className="text-primary italic">Expansión.</span></h2>
               <div className="space-y-6">
                  {[
                    { i: <Zap className="w-5 h-5"/>, t: 'Activación Inmediata', d: 'Tu núcleo listo en menos de 60 segundos.' },
                    { i: <ShieldCheck className="w-5 h-5"/>, t: 'Arquitectura Segura', d: 'Protección HMAC y aislamiento de datos.' },
                    { i: <Binary className="w-5 h-5"/>, t: 'IA Nativa', d: 'Llama 3.2 lista para auditar tus movimientos.' }
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-4 group">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          {feat.i}
                       </div>
                       <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-white">{feat.t}</div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium mt-1">{feat.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="relative group pt-10">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-10 group-hover:opacity-30 transition-opacity" />
            <img 
               src="/mascota.png" 
               alt="Mascota" 
               className="relative z-10 w-full max-w-[220px] mx-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-80"
               onError={(e) => e.currentTarget.src = "/personaje.png"}
            />
         </div>
      </motion.div>

      {/* --- DERECHA: SECCIÓN DEL FORMULARIO (SIN SCROLL) --- */}
      <div className="relative flex flex-col items-center justify-center p-6 lg:p-12 z-10 bg-background/50 backdrop-blur-3xl overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[500px] space-y-8"
        >
          <div className="space-y-3">
             <button onClick={() => navigate('landing')} className="flex items-center gap-2 text-zinc-500 hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Regresar</span>
             </button>
             <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">Nueva <br/><span className="text-primary italic">Identidad.</span></h1>
             <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Define los parámetros de tu imperio.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Tu Nombre</label>
              <div className="relative group">
                <input
                  placeholder="Administrador"
                  className="w-full h-12 bg-zinc-900/50 border border-white/5 text-white pl-12 rounded-[1rem] focus:border-primary transition-all text-[10px] font-bold uppercase tracking-widest placeholder:text-zinc-800"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Email Maestro</label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="ceo@empresa.com"
                  className="w-full h-12 bg-zinc-900/50 border border-white/5 text-white pl-12 rounded-[1rem] focus:border-primary transition-all text-[10px] font-bold uppercase tracking-widest placeholder:text-zinc-800"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Razón Social</label>
              <div className="relative group">
                <input
                  placeholder="Nombre de Empresa"
                  className="w-full h-12 bg-zinc-900/50 border border-white/5 text-white pl-12 rounded-[1rem] focus:border-primary transition-all text-[10px] font-bold uppercase tracking-widest placeholder:text-zinc-800"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Teléfono</label>
              <div className="relative group">
                <input
                  placeholder="+505 ..."
                  className="w-full h-12 bg-zinc-900/50 border border-white/5 text-white pl-12 rounded-[1rem] focus:border-primary transition-all text-[10px] font-bold uppercase tracking-widest placeholder:text-zinc-800"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Llave de Acceso</label>
              <div className="relative group">
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full h-14 bg-zinc-900/50 border border-white/5 text-white pl-12 rounded-[1.2rem] focus:border-primary transition-all text-xs font-bold placeholder:text-zinc-800"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-30" />
              </div>
              <div className="flex flex-wrap gap-4 px-1">
                {[
                  { label: '8+ Caracteres', valid: hasMinLength },
                  { label: 'Mayúscula', valid: hasUppercase },
                  { label: 'Número', valid: hasNumber }
                ].map((req, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all",
                    req.valid ? "text-primary" : "text-zinc-700"
                  )}>
                    {req.valid ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />} {req.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-14 bg-primary text-black rounded-[1.2rem] font-black uppercase tracking-[0.5em] text-[10px] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 border-none"
              >
                <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <span>Consolidar Imperio</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </form>

          <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em]">
              ¿Ya estás en el nucleo?{' '}
              <button onClick={() => navigate('login')} className="text-primary hover:underline underline-offset-4 font-black">Entrar aquí</button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* --- CARGADOR CINEMÁTICO --- */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-3xl flex flex-col items-center justify-center"
          >
             <div className="space-y-8 flex flex-col items-center">
                <div className="relative">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                     className="w-48 h-48 rounded-full border border-primary/20 border-t-primary"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <motion.img 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        src="/logo_ganesha.png" 
                        className="w-20 h-20"
                        onError={(e) => e.currentTarget.src = "/GaneshaLogo.png"}
                      />
                   </div>
                </div>
                <h2 className="text-xl font-black uppercase tracking-[0.6em] text-primary animate-pulse">Expandiendo Horizonte</h2>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
