'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, BookOpen, Sparkles, User, Building2, Phone, CheckCircle, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { useAppStore } from '@/lib/stores/useAppStore';
import { AuthLayout } from './AuthLayout';

// ─── Validation schema ───────────────────────────────────────
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  company: z
    .string()
    .min(1, 'El nombre de la empresa es obligatorio')
    .min(3, 'El nombre de la empresa debe tener al menos 3 caracteres'),
  phone: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^[0-9+\-\s()]{8,}$/, 'Ingresa un teléfono válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  terms: z
    .boolean()
    .refine(val => val === true, 'Debes aceptar los términos'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Animation variants ──────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any },
  },
};

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-destructive' };
  if (score <= 3) return { score: 2, label: 'Media', color: 'bg-warning' };
  return { score: 3, label: 'Fuerte', color: 'bg-success' };
}

export function RegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
  });

  const passwordValue = watch('password');
  const strength = getPasswordStrength(passwordValue || '');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(AUTH.register, {
        name: data.name,
        email: data.email,
        company: data.company,
        phone: data.phone,
        password: data.password
      });
      setSuccess(true);
      toast.success('¡Cuenta creada! Revisa tu correo.');
    } catch (error: any) {
      toast.error(error?.error || 'Error al registrarse');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md mx-auto px-4">
          <VintageCard variant="glass" className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-playfair font-black text-foreground mb-4">¡Casi listo!</h2>
            <p className="text-muted-foreground mb-8">Hemos enviado un enlace de activación a tu correo electrónico. Por favor verifícalo para comenzar.</p>
            <PastelButton className="w-full h-12" onClick={() => navigate('login')}>Ir al Inicio</PastelButton>
          </VintageCard>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        className="w-full max-w-2xl mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <VintageCard
          variant="glass"
          className="p-8 md:p-10 shadow-2xl border-white/20 dark:border-zinc-800/50 backdrop-blur-2xl"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <h1 className="font-playfair text-3xl font-black text-foreground tracking-tight">Crea tu Cuenta</h1>
            <p className="text-sm text-muted-foreground mt-1">Únete a la nueva generación contable</p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FloatingInput label="Tu Nombre" icon={<User className="w-4 h-4" />} error={errors.name?.message} {...register('name')} />
              <FloatingInput label="Nombre de Empresa" icon={<Building2 className="w-4 h-4" />} error={errors.company?.message} {...register('company')} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FloatingInput label="Correo" type="email" icon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
              <FloatingInput label="Teléfono" type="tel" icon={<Phone className="w-4 h-4" />} error={errors.phone?.message} {...register('phone')} />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <FloatingInput
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordValue && (
                <div className="px-1 space-y-1.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className={cn('h-1.5 flex-1 rounded-full transition-all', lvl <= strength.score ? strength.color : 'bg-muted')} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seguridad: <span className={cn(strength.score === 3 ? 'text-success' : 'text-foreground')}>{strength.label}</span></p>
                </div>
              )}

              <FloatingInput
                label="Confirmar Contraseña"
                type="password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="flex items-start gap-3 p-2">
              <input type="checkbox" id="terms" {...register('terms')} className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                Acepto los <button type="button" className="text-primary font-bold hover:underline">términos de servicio</button> y la <button type="button" className="text-primary font-bold hover:underline">política de datos</button>.
              </label>
            </div>

            <PastelButton type="submit" loading={isSubmitting} className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20">
              Registrar mi Cuenta
            </PastelButton>
          </motion.form>

          <motion.p variants={itemVariants} className="mt-8 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <button type="button" onClick={() => navigate('login')} className="font-bold text-primary hover:underline underline-offset-4">Inicia Sesión</button>
          </motion.p>
        </VintageCard>
      </motion.div>
    </AuthLayout>
  );
}

export default RegisterPage;
