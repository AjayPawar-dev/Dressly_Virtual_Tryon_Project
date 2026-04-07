import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MotionLabel = motion.label;
const MotionDiv = motion.div;

export function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  autoComplete,
  required = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hasValue = Boolean(value);
  const shouldFloat = isFocused || hasValue;

  return (
    <div className="space-y-2">
      <div className="relative">
        {Icon ? (
          <Icon
            className={cn(
              'pointer-events-none absolute left-4 top-[1.15rem] h-4 w-4 transition-colors duration-200',
              error
                ? 'text-brand-error'
                : isFocused
                ? 'text-primary-purple'
                : 'text-slate-400 dark:text-white/45'
            )}
          />
        ) : null}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={() => setIsFocused(true)}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'peer w-full rounded-2xl border bg-[#eef2f7] px-4 pb-3 pt-7 text-sm text-slate-900 outline-none transition-all duration-200',
            'placeholder:text-transparent shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
            'dark:bg-slate-950/55 dark:text-white',
            Icon && 'pl-12',
            error
              ? 'border-brand-error/60 ring-4 ring-brand-error/10'
              : isFocused
              ? 'border-primary-purple/55 ring-4 ring-primary-purple/12'
              : 'border-slate-300/85 hover:border-slate-400/85 dark:border-white/10 dark:hover:border-white/20'
          )}
          placeholder={label}
        />
        

        <MotionLabel
          htmlFor={inputId}
          animate={{
            y: shouldFloat ? -11 : 0,
            scale: shouldFloat ? 0.82 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={cn(
            'pointer-events-none absolute left-4 top-[1.15rem] origin-left text-sm leading-none transition-colors duration-200',
            Icon && 'left-12',
            error
              ? 'text-brand-error'
              : isFocused
              ? 'text-primary-purple'
              : 'text-slate-500 dark:text-white/55'
          )}
        >
          {label}
        </MotionLabel>
      </div>

      <MotionDiv
        initial={false}
        animate={{
          height: error ? 'auto' : 0,
          opacity: error ? 1 : 0,
        }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        {error ? (
          <p
            id={errorId}
            className="flex items-center gap-1.5 text-xs text-brand-error"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : null}
      </MotionDiv>
    </div>
  );
}
