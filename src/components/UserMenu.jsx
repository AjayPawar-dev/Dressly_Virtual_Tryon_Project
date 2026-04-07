// src/components/UserMenu.jsx
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, History, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserMenu({ user, onSignOut, size = 'default' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const isCompact = size === 'compact';

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px below button
        right: window.innerWidth - rect.right, // Align to right edge
      });
    }
  }, [isOpen]);

  if (!user) return null;

  const handleSignOut = async () => {
    await onSignOut?.();
    setIsOpen(false);
  };

  const menuItems = [
    { icon: History, label: 'My Try-Ons', onClick: () => console.log('History') },
    { icon: Heart, label: 'Favorites', onClick: () => console.log('Favorites') },
    { icon: Settings, label: 'Settings', onClick: () => console.log('Settings') },
  ];

  return (
    <>
      {/* User Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center rounded-full',
          isCompact ? 'h-8 w-8 text-xs shadow-sm' : 'h-10 w-10 text-sm shadow-md',
          'bg-gradient-primary text-white font-sans font-semibold',
          'hover:bg-gradient-primary-hover',
          'active:scale-95 transition-all duration-200',
          'border border-white/20'
        )}
      >
        {user.email?.[0]?.toUpperCase() || 'U'}
      </button>

      {/* Dropdown Menu - RENDERED VIA PORTAL */}
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div
              className="fixed w-64 bg-gradient-card border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              style={{
                zIndex: 9999,
                top: `${position.top}px`,
                right: `${position.right}px`,
              }}
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-white/60">Free Plan</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5',
                      'text-sm font-sans text-white',
                      'hover:bg-white/5 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    disabled
                  >
                    <item.icon className="w-4 h-4 text-white/60" />
                    {item.label}
                    <span className="ml-auto text-xs text-white/60">
                      Soon
                    </span>
                  </button>
                ))}
              </div>

              {/* Sign Out */}
              <div className="border-t border-white/10 py-2">
                <button
                  onClick={handleSignOut}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5',
                    'text-sm font-sans text-brand-error',
                    'hover:bg-brand-error/10 transition-colors'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
