'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AuthLayout } from './AuthLayout';

// ─── Validation schema ───────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(4, 'La contraseña debe tener al menos 4 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Animation variants ──────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ─── Component ───────────────────────────────────────────────
export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const { navigate } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    if (clearError) clearError();
    login({ ...data, companyId: '' });
  };

  const handleForgotPassword = () => {
    const emailValue = getValues('email');
    if (!emailValue) {
      toast.error('Por favor ingresa tu correo para recuperar la contraseña');
      return;
    }
    toast.promise(
      apiClient.post(AUTH.resetPassword('1'), { email: emailValue }),
      {
        loading: 'Enviando instrucciones de recuperación...',
        success: `Instrucciones enviadas a ${emailValue}`,
        error: 'Instrucciones enviadas o error de red'
      }
    );
  };

  const handleQuickLogin = () => {
    if (clearError) clearError();
    login({ email: 'admin@alpha.com.ni', password: 'Admin123!', companyId: '' });
  };

  return (
    <AuthLayout>
      <motion.div
        className="w-full max-w-md mx-auto"
        variants={containerVariants as any}
        initial="hidden"
        animate="visible"
      >
        <VintageCard
          variant="glass"
          className="p-8 md:p-10 shadow-2xl border-white/20 dark:border-zinc-800/50 backdrop-blur-2xl"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-4 ring-4 ring-primary/10">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-playfair text-3xl font-black text-foreground tracking-tight">
              Bienvenido
            </h1>
            <p className="mt-1 text-sm text-center text-muted-foreground font-medium">
              Ingresa a la Suite Contable <span className="text-primary font-bold">GANESHA</span>
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <FloatingInput
              label="Correo electrónico"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <FloatingInput
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Recordarme</span>
              </label>
              <button
                type="button"
                className="text-xs font-bold text-primary hover:underline underline-offset-4"
                onClick={handleForgotPassword}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence mode="wait">
              {(error || Object.keys(errors).length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-2">
                    <span className="text-xs text-destructive leading-relaxed">
                      {error || 'Por favor corrige los errores del formulario.'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <PastelButton
              type="submit"
              loading={isLoading}
              className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Iniciar Sesión
            </PastelButton>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                <span className="bg-card px-3 text-muted-foreground">Acceso Alternativo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="w-full h-12 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
              <span className="text-sm font-bold text-foreground">Acceso Demo Rápido</span>
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-success/10 text-[9px] font-black text-success uppercase tracking-widest">Demo</span>
            </button>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            ¿Eres nuevo aquí?{' '}
            <button
              type="button"
              className="font-bold text-primary hover:underline underline-offset-4"
              onClick={() => navigate('register')}
            >
              Crea una cuenta gratuita
            </button>
          </motion.p>
        </VintageCard>
        
        <motion.p
          variants={itemVariants}
          className="mt-8 text-center text-[11px] text-muted-foreground uppercase tracking-widest font-bold opacity-60"
        >
          © {new Date().getFullYear()} GANESHA · Excelencia Contable
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
}

export default LoginPage;
