import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const spring = {
  type: 'spring',
  stiffness: 420,
  damping: 24,
};

const MotionButton = motion.button;
const MotionSpan = motion.span;
const MotionParagraph = motion.p;

export function DownloadButton({
  imageUrl,
  filename = 'dressly-tryon-result.jpg',
  className,
}) {
  const [status, setStatus] = useState('idle');
  const [rippleKey, setRippleKey] = useState(0);
  const resetTimerRef = useRef(0);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    setStatus('idle');
    setRippleKey(0);
  }, [imageUrl]);

  const scheduleReset = () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setStatus('idle');
    }, 2200);
  };

  const handleDownload = async () => {
    if (!imageUrl || status === 'loading') {
      return;
    }

    setRippleKey((current) => current + 1);
    setStatus('loading');

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error('Could not download the image.');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1200);

      setStatus('success');
      scheduleReset();
    } catch {
      setStatus('error');
      scheduleReset();
    }
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const statusMessage = isLoading
    ? 'Preparing download'
    : isSuccess
    ? 'Download complete'
    : isError
    ? 'Download failed'
    : 'Ready to download';

  return (
    <div className="w-full">
      <MotionButton
        type="button"
        whileHover={isLoading ? undefined : { scale: 1.02, y: -1 }}
        whileTap={isLoading ? undefined : { scale: 0.95 }}
        transition={spring}
        onClick={handleDownload}
        disabled={!imageUrl || isLoading}
        className={cn(
          'relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3 text-sm font-semibold text-white',
          'transition-all duration-300',
          isSuccess
            ? 'bg-emerald-500 shadow-[0_14px_28px_rgba(16,185,129,0.28)]'
            : isError
            ? 'bg-brand-error shadow-[0_14px_28px_rgba(218,30,40,0.22)]'
            : 'bg-gradient-primary shadow-[0_18px_34px_rgba(131,74,176,0.28)] hover:shadow-[0_22px_38px_rgba(131,74,176,0.34)]',
          'disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none',
          className,
        )}
      >
        <AnimatePresence>
          {rippleKey > 0 && !isLoading ? (
            <MotionSpan
              key={rippleKey}
              initial={{ scale: 0, opacity: 0.32 }}
              animate={{ scale: 2.35, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 m-auto h-16 w-16 rounded-full bg-white/30"
            />
          ) : null}
        </AnimatePresence>

        <MotionSpan
          className="absolute inset-0 bg-white/0"
          whileTap={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        />

        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <MotionSpan
              key="loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="relative flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing download...
            </MotionSpan>
          ) : isSuccess ? (
            <MotionSpan
              key="success"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="relative flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Downloaded
            </MotionSpan>
          ) : isError ? (
            <MotionSpan
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="relative flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Retry Download
            </MotionSpan>
          ) : (
            <MotionSpan
              key="idle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="relative flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Result
              <Sparkles className="h-4 w-4 opacity-75" />
            </MotionSpan>
          )}
        </AnimatePresence>
      </MotionButton>

      <p className="sr-only" aria-live="polite">
        {statusMessage}
      </p>

      <AnimatePresence initial={false}>
        {isError ? (
          <MotionParagraph
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="mt-2 text-center text-xs text-brand-error"
          >
            Download failed. Please try again.
          </MotionParagraph>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
