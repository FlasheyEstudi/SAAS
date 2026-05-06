'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Input } from '@/components/ui/input';
import { PastelButton } from '@/components/ui/pastel-button';
import { Sparkles, ArrowLeft, ShieldCheck, Mail, Lock, Building, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/schemas/auth';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { motion } from 'framer-motion';

export function RegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
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
      toast.success('Cuenta creada exitosamente. Bienvenido.');
      navigate('login');
    } catch (err: any) {
      toast.error(err.error || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col lg:flex-row overflow-hidden font-sans selection:bg-primary/30">
      {/* Lado Izquierdo: Arte Minimalista */}
      <motion.div 
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[45%] relative bg-foreground/[0.02] items-center justify-center overflow-hidden border-r border-primary/5"
      >
        <div className="absolute inset-0 mandala-bg opacity-20 scale-110 rotate-180" />
        
        <div className="relative z-10 flex flex-col items-center text-center p-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="relative mb-8"
          >
            <div className="absolute inset-[-60px] bg-primary/10 blur-[100px] rounded-full animate-aura" />
            <motion.img 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              src="/personaje.png" 
              className="w-[400px] h-auto object-contain relative z-10 drop-shadow-[0_0_100px_rgba(var(--primary-rgb),0.3)]"
              alt="Ganesha Creator"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-sm space-y-4"
          >
            <h2 className="text-4xl font-playfair font-bold text-foreground leading-none tracking-tighter uppercase">
              Crea tu <span className="text-primary italic font-normal">Imperio.</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Únete a la red de empresas más prósperas del mundo.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Lado Derecho: Formulario Compacto Premium */}
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-[55%] flex flex-col relative bg-background h-full overflow-y-auto"
      >
        {/* Header del Formulario */}
        <div className="p-4 sm:p-6 flex justify-between items-center">
           <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Regresar</span>
          </motion.button>
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Registro Seguro</span>
             <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 xl:px-24 w-full max-w-4xl mx-auto pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-foreground mb-1 tracking-tighter uppercase leading-none">Iniciación</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black">Comienza tu viaje hacia la abundancia</p>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleSubmit} 
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Nombre Completo</label>
              <div className="relative group">
                <Input
                  placeholder="Tu Nombre"
                  className="h-13 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-11 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Portal de Email</label>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  className="h-13 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-11 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Empresa</label>
              <div className="relative group">
                <Input
                  placeholder="Nombre de Negocio"
                  className="h-13 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-11 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Teléfono</label>
              <div className="relative group">
                <Input
                  placeholder="+505 ..."
                  className="h-13 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-11 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Llave Maestra</label>
              <div className="relative group">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-13 bg-muted/20 border-primary/10 text-foreground placeholder:text-muted-foreground/30 pl-11 rounded-xl focus:bg-card focus:ring-1 focus:ring-primary/30 transition-all border shadow-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <PastelButton
                type="submit"
                className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.4em] text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all border-none"
                disabled={loading}
              >
                {loading ? (
                  <span>Creando...</span>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                     <span>Crear mi Cuenta</span>
                     <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </PastelButton>
            </div>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
              ¿Ya eres un iniciado?{' '}
              <button
                onClick={() => navigate('login')}
                className="text-primary hover:underline underline-offset-4 decoration-2 transition-all"
              >
                Inicia sesión aquí
              </button>
            </p>
          </motion.div>
        </div>

        {/* Footer del Formulario */}
        <div className="p-6 mt-auto text-center border-t border-primary/5">
           <span className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.5em] font-black">Ganesha Enterprise System © 2026</span>
        </div>
      </motion.div>
    </div>
  );
}
