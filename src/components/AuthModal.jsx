import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

const AUTH_DRAFT_KEY = 'dressly-auth-draft-v1';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createEmptyValues() {
  return {
    name: '',
    email: '',
    password: '',
  };
}

function createDefaultDraft() {
  return {
    mode: 'signin',
    values: createEmptyValues(),
  };
}

function readAuthDraft() {
  const fallback = createDefaultDraft();

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawDraft = window.localStorage.getItem(AUTH_DRAFT_KEY);

    if (!rawDraft) {
      return fallback;
    }

    const parsedDraft = JSON.parse(rawDraft);

    return {
      mode: parsedDraft?.mode === 'signup' ? 'signup' : 'signin',
      values: {
        ...fallback.values,
        name:
          typeof parsedDraft?.values?.name === 'string'
            ? parsedDraft.values.name
            : '',
        email:
          typeof parsedDraft?.values?.email === 'string'
            ? parsedDraft.values.email
            : '',
        password:
          typeof parsedDraft?.values?.password === 'string'
            ? parsedDraft.values.password
            : '',
      },
    };
  } catch {
    return fallback;
  }
}

function clearStoredDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_DRAFT_KEY);
}

function validateValues(mode, values) {
  const errors = {
    name: '',
    email: '',
    password: '',
  };
  const trimmedEmail = values.email.trim();

  if (mode === 'signup') {
    if (!values.name.trim()) {
      errors.name = 'Enter your full name.';
    } else if (values.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
  }

  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.24, ease: 'easeInOut' },
};

const modalMotion = {
  initial: { opacity: 0, y: 50, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 28, scale: 0.98 },
  transition: { duration: 0.26, ease: 'easeInOut' },
};

const buttonSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
};

const MotionButton = motion.button;
const MotionDiv = motion.div;
const MotionSpan = motion.span;

export function AuthModal({ isOpen, onClose, onSuccess }) {
  const [draft, setDraft] = useState(() => readAuthDraft());
  const [touched, setTouched] = useState({});
  const [activeAction, setActiveAction] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const mode = draft.mode;
  const values = draft.values;
  const isBusy = activeAction !== null;

  const validationErrors = useMemo(
    () => validateValues(mode, values),
    [mode, values]
  );

  const visibleErrors = useMemo(
    () =>
      Object.entries(validationErrors).reduce((accumulator, [field, message]) => {
        if (touched[field] && message) {
          accumulator[field] = message;
        }

        return accumulator;
      }, {}),
    [touched, validationErrors]
  );

  const isFormValid = useMemo(
    () => Object.values(validationErrors).every((message) => !message),
    [validationErrors]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      AUTH_DRAFT_KEY,
      JSON.stringify({ mode, values })
    );
  }, [mode, values]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        setTouched({});
        setError('');
        setNotice('');
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isBusy, isOpen, onClose]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value,
      },
    }));
    setError('');
    setNotice('');
  };

  const handleFieldBlur = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleModeChange = (nextMode) => {
    if (isBusy || nextMode === mode) {
      return;
    }

    setDraft((current) => ({
      ...current,
      mode: nextMode,
    }));
    setTouched({});
    setError('');
    setNotice('');
  };

  const handleClose = () => {
    if (isBusy) {
      return;
    }

    setTouched({});
    setError('');
    setNotice('');
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    setTouched((current) => ({
      ...current,
      email: true,
      password: true,
      ...(mode === 'signup' ? { name: true } : {}),
    }));

    if (!isFormValid) {
      setError('Please correct the highlighted fields before continuing.');
      return;
    }

    const normalizedEmail = values.email.trim().toLowerCase();
    const trimmedName = values.name.trim();

    setError('');
    setNotice('');
    setActiveAction('credentials');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await signUp(
          normalizedEmail,
          values.password,
          trimmedName ? { full_name: trimmedName } : {}
        );

        if (signUpError) {
          throw signUpError;
        }

        if (data?.session) {
          clearStoredDraft();
          setDraft(createDefaultDraft());
          setTouched({});
          onSuccess?.();
          return;
        }

        setNotice(
          'Check your inbox for the verification email, then sign in to continue.'
        );
        setDraft((current) => ({
          mode: 'signin',
          values: {
            ...current.values,
            email: normalizedEmail,
            password: '',
          },
        }));
        setTouched({});
        return;
      }

      const { error: signInError } = await signIn(
        normalizedEmail,
        values.password
      );

      if (signInError) {
        throw signInError;
      }

      clearStoredDraft();
      setDraft(createDefaultDraft());
      setTouched({});
      onSuccess?.();
    } catch (authError) {
      setError(authError?.message || 'Authentication failed. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBusy) {
      return;
    }

    setError('');
    setNotice('');
    setActiveAction('google');

    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        throw googleError;
      }
    } catch (authError) {
      setError(authError?.message || 'Google sign in failed. Please try again.');
      setActiveAction(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100]">
          <MotionButton
            type="button"
            aria-label="Close authentication modal"
            onClick={handleClose}
            disabled={isBusy}
            className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-md"
            {...backdropMotion}
          />

          <div className="flex min-h-screen items-center justify-center p-4">
            <MotionDiv
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              aria-describedby="auth-modal-description"
              className={cn(
                'relative z-[101] w-full max-w-md overflow-hidden rounded-[28px] border border-white/12 bg-white/88 p-6 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.30)] backdrop-blur-2xl',
                'dark:bg-slate-950/82 dark:text-white sm:p-7'
              )}
              {...modalMotion}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={isBusy}
                className={cn(
                  'absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/65 text-slate-500 transition-all duration-200',
                  'hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-purple/20 bg-primary-purple/8 px-3 py-1 text-xs font-medium text-primary-purple">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure access to saved try-ons
                </div>

                <div className="space-y-2">
                  <h2
                    id="auth-modal-title"
                    className="font-display text-[2rem] font-bold tracking-[-0.02em] text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.32)] dark:text-slate-50 dark:drop-shadow-[0_8px_22px_rgba(15,23,42,0.55)] sm:text-[2.15rem]"
                  >
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p
                    id="auth-modal-description"
                    className="max-w-sm text-sm leading-6 text-slate-700 dark:text-white/78"
                  >
                    {mode === 'signin'
                      ? 'Sign in to generate, save, and download your try-ons without losing your progress.'
                      : 'Create an account to save sessions, revisit looks, and keep downloads in one place.'}
                  </p>
                </div>
              </div>

              <MotionButton
                type="button"
                whileHover={isBusy ? undefined : { scale: 1.015, y: -1 }}
                whileTap={isBusy ? undefined : { scale: 0.95 }}
                transition={buttonSpring}
                onClick={handleGoogleSignIn}
                disabled={isBusy}
                className={cn(
                  'relative mb-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all duration-200',
                  'hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]',
                  'disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/85 dark:text-white'
                )}
              >
                <MotionSpan
                  className="absolute inset-0 bg-primary-purple/0"
                  whileTap={{ backgroundColor: 'rgba(124,58,237,0.08)' }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                />
                
                {activeAction === 'google' ? (
                  <Loader2 className="relative h-4 w-4 animate-spin" />
                ) : (
                  <svg className="relative h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="relative">
                  {activeAction === 'google'
                    ? 'Redirecting to Google...'
                    : 'Continue with Google'}
                </span>
              </MotionButton>

              <div className="relative mb-5 mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="rounded-full bg-white px-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:bg-slate-950 dark:text-white/40">
                    or continue with email
                  </span>
                </div>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {error ? (
                  <MotionDiv
                    key={`error-${error}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="mb-4 rounded-2xl border border-brand-error/25 bg-brand-error/10 px-4 py-3 text-sm text-brand-error"
                  >
                    {error}
                  </MotionDiv>
                ) : notice ? (
                  <MotionDiv
                    key={`notice-${notice}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{notice}</span>
                  </MotionDiv>
                ) : null}
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>
                {mode === 'signin' ? (
                  <SignInForm
                    values={values}
                    visibleErrors={visibleErrors}
                    loading={activeAction === 'credentials'}
                    disabled={!isFormValid}
                    onSubmit={handleSubmit}
                    onFieldChange={handleFieldChange}
                    onFieldBlur={handleFieldBlur}
                  />
                ) : (
                  <SignUpForm
                    values={values}
                    visibleErrors={visibleErrors}
                    loading={activeAction === 'credentials'}
                    disabled={!isFormValid}
                    onSubmit={handleSubmit}
                    onFieldChange={handleFieldChange}
                    onFieldBlur={handleFieldBlur}
                  />
                )}
              </AnimatePresence>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-white/55">
                  {mode === 'signin'
                    ? "New here? Create an account without losing what's already typed."
                    : 'Already have an account? Sign in with the same email.'}
                </p>

                <MotionButton
                  type="button"
                  whileHover={isBusy ? undefined : { x: 1 }}
                  whileTap={isBusy ? undefined : { scale: 0.97 }}
                  transition={buttonSpring}
                  onClick={() =>
                    handleModeChange(mode === 'signin' ? 'signup' : 'signin')
                  }
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-purple transition-colors hover:text-violet-500 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {mode === 'signin' ? 'Create account' : 'Back to sign in'}
                  <ArrowRight className="h-4 w-4" />
                </MotionButton>
              </div>
            </MotionDiv>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
