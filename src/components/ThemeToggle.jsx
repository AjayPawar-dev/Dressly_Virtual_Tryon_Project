import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ size = 'default' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const isCompact = size === 'compact';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex items-center justify-center rounded-full border transition-all duration-300',
        isCompact ? 'h-8 w-8' : 'h-10 w-10',
        'border-slate-900/8 bg-white/80 shadow-sm dark:border-white/15 dark:bg-white/5',
        'hover:border-primary-purple/35 hover:bg-white active:scale-95 dark:hover:bg-white/10',
      )}
    >
      <Sun
        className={cn(
          'absolute transition-all duration-300',
          isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          'text-amber-500',
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        )}
      />
      <Moon
        className={cn(
          'absolute transition-all duration-300',
          isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          'text-slate-700 dark:text-white',
          !isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
    </button>
  );
}
