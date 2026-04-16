'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { useAuth } from '@/modules/auth/hooks/useAuth';

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

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const blobVariants = {
  animate: (i: number) => ({
    y: [0, -15, 0, 10, 0],
    x: [0, 8, -5, 0, 0],
    rotate: [0, 5, -3, 2, 0],
    scale: [1, 1.03, 0.98, 1.01, 1],
    transition: {
      duration: 8 + i * 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

// ─── Component ───────────────────────────────────────────────
export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    clearError();
    login(data);
  };

  const handleQuickLogin = () => {
    clearError();
    login({ email: 'admin@contable.com', password: 'admin123' });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-vintage-50 via-cream/30 to-lavender/20">
      {/* ── Decorative background blobs ── */}
      <motion.div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-vintage-200/40 blur-3xl"
        variants={blobVariants}
        animate="animate"
        custom={0}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-lavender/40 blur-3xl"
        variants={blobVariants}
        animate="animate"
        custom={1}
      />
      <motion.div
        className="pointer-events-none absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-peach/40 blur-3xl"
        variants={blobVariants}
        animate="animate"
        custom={2}
      />
      <motion.div
        className="pointer-events-none absolute bottom-1/3 left-1/3 h-48 w-48 rounded-full bg-vintage-100/60 blur-2xl"
        variants={blobVariants}
        animate="animate"
        custom={3}
      />

      {/* ── Subtle pattern overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #8B7355 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Main card ── */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <VintageCard
          variant="glass"
          className="p-8 md:p-10 shadow-xl shadow-vintage-200/30"
        >
          {/* ── Branding ── */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <motion.div
              className="relative mb-4"
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-vintage-300 to-vintage-400 shadow-lg shadow-vintage-300/30">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-5 h-5 text-warning" />
              </motion.div>
            </motion.div>

            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-vintage-900 tracking-tight">
              Contable ERP
            </h1>
            <p className="mt-1.5 text-sm text-vintage-600">
              Sistema de Gestión Contable Empresarial
            </p>
          </motion.div>

          {/* ── Divider ── */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-vintage-200" />
              <span className="text-xs font-medium text-vintage-500 uppercase tracking-widest">
                Acceder
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-vintage-200" />
            </div>
          </motion.div>

          {/* ── Form ── */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email field */}
            <FloatingInput
              label="Correo electrónico"
              type="email"
              placeholder=""
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password field */}
            <div className="relative">
              <FloatingInput
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vintage-500 hover:text-vintage-700 transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence mode="wait">
              {(error || Object.keys(errors).length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-error">!</span>
                    </div>
                    <p className="text-xs text-error leading-relaxed">
                      {error || 'Por favor corrige los errores del formulario.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot password link */}
            <div className="text-right">
              <button
                type="button"
                className="text-xs text-vintage-500 hover:text-vintage-700 transition-colors hover:underline"
                onClick={() => toast.info('Función de recuperación próximamente disponible.')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit button */}
            <PastelButton
              type="submit"
              loading={isLoading}
              className={cn(
                'w-full h-12 text-sm font-semibold tracking-wide',
                'bg-gradient-to-r from-vintage-300 to-vintage-400',
                'hover:from-vintage-400 hover:to-vintage-500',
                'shadow-lg shadow-vintage-300/25',
                'transition-all duration-300'
              )}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </PastelButton>
          </motion.form>

          {/* ── Divider ── */}
          <motion.div variants={itemVariants} className="my-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-vintage-200" />
              <span className="text-xs text-vintage-400">o</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-vintage-200" />
            </div>
          </motion.div>

          {/* ── Quick demo access ── */}
          <motion.div variants={itemVariants}>
            <PastelButton
              type="button"
              variant="outline"
              className="w-full h-11 text-sm"
              onClick={handleQuickLogin}
              disabled={isLoading}
            >
              Acceso rápido demo
            </PastelButton>
            <p className="mt-2 text-center text-[11px] text-vintage-400">
              Inicia sesión automáticamente con una cuenta de demostración
            </p>
          </motion.div>

          {/* ── Register link ── */}
          <motion.p
            variants={itemVariants}
            className="mt-6 text-center text-sm text-vintage-600"
          >
            ¿No tienes una cuenta?{' '}
            <button
              type="button"
              className="font-semibold text-vintage-500 hover:text-vintage-700 transition-colors hover:underline underline-offset-2"
              onClick={() => toast.info('Registro próximamente disponible.')}
            >
              Solicitar acceso
            </button>
          </motion.p>
        </VintageCard>

        {/* ── Footer ── */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-center text-[11px] text-vintage-400"
        >
          © {new Date().getFullYear()} Contable ERP · Todos los derechos reservados
        </motion.p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
