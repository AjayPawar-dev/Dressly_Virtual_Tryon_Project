import { motion } from 'framer-motion';
import { Loader2, Lock, Mail } from 'lucide-react';
import { AuthInput } from '@/components/auth/AuthInput';
import { cn } from '@/lib/utils';

const spring = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
};

const MotionForm = motion.form;
const MotionButton = motion.button;
const MotionSpan = motion.span;

export function SignInForm({
  values,
  visibleErrors,
  loading,
  disabled,
  onSubmit,
  onFieldChange,
  onFieldBlur,
}) {
  const isDisabled = loading || disabled;

  return (
    <MotionForm
      key="signin-form"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
    >
      <AuthInput
        label="Email"
        type="email"
        value={values.email}
        onChange={(event) => onFieldChange('email', event.target.value)}
        onBlur={() => onFieldBlur('email')}
        error={visibleErrors.email}
        icon={Mail}
        autoComplete="email"
        required
      />

      <AuthInput
        label="Password"
        type="password"
        value={values.password}
        onChange={(event) => onFieldChange('password', event.target.value)}
        onBlur={() => onFieldBlur('password')}
        error={visibleErrors.password}
        icon={Lock}
        autoComplete="current-password"
        required
      />

      <MotionButton
        type="submit"
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : { scale: 1.015, y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.95 }}
        transition={spring}
        className={cn(
          'relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white',
          'bg-gradient-primary shadow-[0_12px_24px_rgba(131,74,176,0.22)] transition-all duration-200',
          'hover:shadow-[0_18px_32px_rgba(131,74,176,0.30)]',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none'
        )}
      >
        <MotionSpan
          className="absolute inset-0 bg-white/0"
          whileTap={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
        />
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span className="relative">Sign In</span>
      </MotionButton>
    </MotionForm>
  );
}
