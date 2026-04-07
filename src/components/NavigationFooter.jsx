import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavigationFooter({
  onBack,
  onNext,
  showBack = false,
  backLabel = 'Back',
  nextLabel = 'Continue',
  nextDisabled = false,
  isProcessing = false,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-card backdrop-blur-xl border-t border-white/10 shadow-2xl">
      <div className="max-w-3xl mx-auto px-4 py-2.5 sm:py-2">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Back / Cancel button */}
          <div className="flex-1">
            {showBack && (
              <button
                onClick={onBack}
                disabled={isProcessing}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg font-sans text-sm font-medium',
                  'transition-all duration-200',
                  'h-9 px-3.5 sm:h-8 sm:px-3',
                  backLabel === 'Cancel'
                    ? 'border border-brand-error/40 text-brand-error bg-brand-error/10 hover:bg-brand-error/20'
                    : 'border border-white/20 text-white bg-white/5 hover:bg-white/10',
                  'active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{backLabel}</span>
              </button>
            )}
          </div>

          {/* Right: Continue / Generate button - conditionally render */}
          <div className="flex-1 flex justify-end">
            {onNext && (
              <button
                onClick={onNext}
                disabled={nextDisabled || isProcessing}
                className={cn(
                  'rounded-lg font-sans font-semibold text-sm text-white',
                  'bg-gradient-to-r from-purple-600 to-purple-800',
                  'hover:from-purple-500 hover:to-purple-700 hover:shadow-xl',
                  'active:scale-[0.98] transition-all duration-300 shadow-lg',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                  'h-9 px-6 sm:h-9 sm:px-6',
                  'min-w-[120px]',
                )}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  nextLabel
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
