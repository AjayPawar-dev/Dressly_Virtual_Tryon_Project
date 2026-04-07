import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_CONFIG } from '@/types';

export function ProgressTracker({ currentStep }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const frameRef = useRef(0);

  useEffect(() => {
    const updateScrollState = () => {
      const y = window.scrollY;

      setIsScrolled((prev) => {
        if (!prev && y > 100) return true;
        if (prev && y < 60) return false;
        return prev;
      });
    };

    const handleScroll = () => {
      if (frameRef.current) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        updateScrollState();
        frameRef.current = 0;
      });
    };

    updateScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'sticky top-0 z-50 px-3 pt-2 sm:px-6',
        'transition-all duration-300 ease-in-out',
        'pb-5',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-[22rem] flex-col items-center justify-center border border-white/10 bg-gradient-card/85 backdrop-blur-xl',
          'transition-all duration-300 ease-in-out sm:w-fit sm:max-w-none',
          isScrolled
            ? 'gap-1 rounded-[24px] px-3 py-1.5 min-h-[52px] shadow-lg sm:rounded-full sm:px-5 sm:py-3 sm:min-h-[60px]'
            : 'gap-2 rounded-[26px] px-3.5 py-1.5 min-h-[68px] shadow-xl sm:rounded-[28px] sm:px-6 sm:py-5 sm:min-h-[80px]',
        )}
      >
        <div
          className={cn(
            'flex w-full items-center justify-between transition-all duration-300 sm:w-auto sm:justify-center',
            isScrolled ? 'gap-1 sm:gap-2.5' : 'gap-1.5 sm:gap-4',
          )}
          aria-label={`Step ${currentStep} of ${STEP_CONFIG.length}`}
        >
          {STEP_CONFIG.map((step, idx) => {
            const completed = step.id < currentStep;
            const current = step.id === currentStep;
            const pending = !completed && !current;
            const isLast = idx === STEP_CONFIG.length - 1;

            return (
              <div
                key={step.id}
                className="flex min-w-0 flex-1 items-center last:flex-none"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full shadow-md transition-all duration-300 ease-in-out',
                      isScrolled
                        ? 'h-8 w-8 scale-95 sm:h-10 sm:w-10'
                        : 'h-9 w-9 scale-100 sm:h-11 sm:w-11',
                      completed && 'bg-gradient-success',
                      current && 'bg-gradient-primary glow-purple',
                      current && 'ring-2 ring-primary-purple/30 sm:ring-4',
                      pending && 'bg-muted',
                    )}
                  >
                    {completed ? (
                      <Check
                        className={cn(
                          'text-white transition-all duration-300',
                          isScrolled ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4',
                        )}
                        strokeWidth={3}
                      />
                    ) : (
                      <span
                        className={cn(
                          'font-semibold font-sans transition-all duration-300',
                          isScrolled ? 'text-[10px]' : 'text-xs sm:text-sm',
                          current ? 'text-white' : 'text-muted-foreground',
                        )}
                      >
                        {step.id}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      'pointer-events-none absolute left-1/2 top-full hidden -translate-x-1/2 whitespace-nowrap font-medium font-sans transition-all duration-200 sm:block',
                      isScrolled ? 'mt-0 text-[9px]' : 'mt-1 text-[10px]',
                      completed && 'text-brand-success',
                      current && 'text-gradient-primary',
                      pending && 'text-muted-foreground',
                      isScrolled
                        ? '-translate-y-1 opacity-0'
                        : 'translate-y-0 opacity-100',
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={cn(
                      'relative self-center overflow-hidden rounded-full bg-white/20 transition-all duration-300 ease-in-out origin-center dark:bg-border',
                      isScrolled
                        ? 'mx-1 h-[2px] min-w-[0.875rem] flex-1 sm:mx-2 sm:w-20 sm:flex-none sm:scale-x-75'
                        : 'mx-1.5 h-[3px] min-w-[1rem] flex-1 sm:mx-3 sm:w-28 sm:flex-none sm:scale-x-100'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 origin-left rounded-full transition-all duration-500 ease-out',
                        completed ? 'bg-gradient-success scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
