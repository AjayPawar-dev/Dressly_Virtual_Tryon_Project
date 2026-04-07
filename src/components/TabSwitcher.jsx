import { cn } from '@/lib/utils';
import { Upload, Grid3x3 } from 'lucide-react';

export function TabSwitcher({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'gallery', label: 'Gallery', icon: Grid3x3 },
  ];

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex bg-gradient-card border border-white/10 rounded-lg p-1 shadow-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-md font-sans font-medium text-sm',
              'transition-all duration-300',
              activeTab === tab.id
                ? 'bg-gradient-primary text-white shadow-md scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/5',
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
