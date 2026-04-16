'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, BookOpen, Sparkles, User, Building2, Phone, CheckCircle, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';

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
    .refine(val => val === true, 'Debes aceptar los términos y condiciones'),
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

// ─── Password strength checker ───────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: 'Débil', color: 'bg-error' };
  if (score <= 4) return { score: 2, label: 'Media', color: 'bg-warning' };
  return { score: 3, label: 'Fuerte', color: 'bg-success' };
}

// ─── Component ───────────────────────────────────────────────
export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const passwordValue = watch('password');
  const passwordStrength = getPasswordStrength(passwordValue || '');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    
    try {
      // Hacer el request usando fetch hacia nuestro backend en el puerto 3001
      // Asumimos que NEXT_PUBLIC_API_URL es 'http://localhost:3001/api' (como en .env) o usamos la ruta absoluta para probar
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          password: data.password
        }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar.');
      }
      
      setRegistrationSuccess(true);
      toast.success('¡Registro exitoso! Ya puedes iniciar sesión con tu nueva cuenta.');
    } catch (error) {
      console.error('Error en registro:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar. Por favor intenta más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-vintage-50 via-cream/30 to-lavender/20">
        <motion.div
          className="relative z-10 w-full max-w-md mx-4 px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <VintageCard variant="glass" className="p-8 md:p-10 shadow-xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-success" />
            </motion.div>
            
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-vintage-900 mb-4">
              ¡Bienvenido a GANESHA!
            </h2>
            
            <p className="text-vintage-600 mb-6">
              Tu cuenta ha sido creada exitosamente. Hemos enviado un correo de verificación a tu email.
            </p>
            
            <div className="space-y-3">
              <PastelButton
                className="w-full"
                onClick={() => window.location.href = '/'}
              >
                Iniciar Sesión
              </PastelButton>
              
              <p className="text-xs text-vintage-500">
                ¿No recibiste el correo?{' '}
                <button className="text-vintage-700 hover:underline font-medium">
                  Reenviar
                </button>
              </p>
            </div>
          </VintageCard>
        </motion.div>
      </div>
    );
  }

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
        className="relative z-10 w-full max-w-2xl mx-4 px-4 py-8"
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
              Crear Cuenta GANESHA
            </h1>
            <p className="mt-1.5 text-sm text-vintage-600">
              Sistema de Gestión Contable Empresarial
            </p>
          </motion.div>

          {/* ── Security badges ── */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center justify-center gap-4 text-xs text-vintage-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Encriptado SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <Key className="w-3 h-3" />
                <span>Contraseña segura</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Verificación email</span>
              </div>
            </div>
          </motion.div>

          {/* ── Divider ── */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-vintage-200" />
              <span className="text-xs font-medium text-vintage-500 uppercase tracking-widest">
                Información de Registro
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
            {/* Name and Company */}
            <div className="grid md:grid-cols-2 gap-4">
              <FloatingInput
                label="Nombre completo"
                type="text"
                placeholder=""
                icon={<User className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name')}
              />
              
              <FloatingInput
                label="Empresa"
                type="text"
                placeholder=""
                icon={<Building2 className="w-4 h-4" />}
                error={errors.company?.message}
                {...register('company')}
              />
            </div>

            {/* Email and Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <FloatingInput
                label="Correo electrónico"
                type="email"
                placeholder=""
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              
              <FloatingInput
                label="Teléfono"
                type="tel"
                placeholder=""
                icon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Password */}
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
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {/* Password strength indicator */}
              {passwordValue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 space-y-1"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors',
                          level <= passwordStrength.score ? passwordStrength.color : 'bg-vintage-200'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-vintage-500">
                    Fortaleza: <span className={cn('font-medium', passwordStrength.score >= 3 ? 'text-success' : 'text-vintage-600')}>
                      {passwordStrength.label}
                    </span>
                  </p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <FloatingInput
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder=""
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vintage-500 hover:text-vintage-700 transition-colors p-1"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                {...register('terms')}
                className="mt-0.5 w-4 h-4 rounded border-vintage-300 text-vintage-600 focus:ring-vintage-500"
              />
              <label htmlFor="terms" className="text-xs text-vintage-600 leading-relaxed">
                Acepto los{' '}
                <button type="button" className="text-vintage-700 hover:underline font-medium">
                  términos y condiciones
                </button>
                {' '}y la{' '}
                <button type="button" className="text-vintage-700 hover:underline font-medium">
                  política de privacidad
                </button>
                {errors.terms?.message && (
                  <p className="text-error text-[10px] mt-1">{errors.terms.message}</p>
                )}
              </label>
            </div>

            {/* Error message */}
            <AnimatePresence mode="wait">
              {Object.keys(errors).length > 0 && (
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
                      Por favor corrige los errores del formulario.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <PastelButton
              type="submit"
              loading={isSubmitting}
              className={cn(
                'w-full h-12 text-sm font-semibold tracking-wide',
                'bg-gradient-to-r from-vintage-300 to-vintage-400',
                'hover:from-vintage-400 hover:to-vintage-500',
                'shadow-lg shadow-vintage-300/25',
                'transition-all duration-300'
              )}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
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

          {/* ── Login link ── */}
          <motion.p
            variants={itemVariants}
            className="text-center text-sm text-vintage-600"
          >
            ¿Ya tienes una cuenta?{' '}
            <button
              type="button"
              className="font-semibold text-vintage-500 hover:text-vintage-700 transition-colors hover:underline underline-offset-2"
              onClick={() => window.location.href = '/'}
            >
              Iniciar Sesión
            </button>
          </motion.p>
        </VintageCard>

        {/* ── Footer ── */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-center text-[11px] text-vintage-400"
        >
          © {new Date().getFullYear()} GANESHA · Todos los derechos reservados
        </motion.p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
