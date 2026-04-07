import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Shirt, Wind } from 'lucide-react';

const SAMPLE_GARMENTS = [
  {
    id: '1',
    name: 'Classic Tee',
    category: 'tshirt',
    imageUrl: '/garments/00006_00.jpg',
  },
  {
    id: '2',
    name: 'Midnight Hoodie',
    category: 'hoodie',
    imageUrl: '/garments/00008_00.jpg',
  },
  {
    id: '3',
    name: 'Structured Jacket',
    category: 'jacket',
    imageUrl: '/garments/00013_00.jpg',
  },
  {
    id: '4',
    name: 'Summer Dress',
    category: 'dress',
    imageUrl: '/garments/00034_00.jpg',
  },
  {
    id: '5',
    name: 'Everyday Polo',
    category: 'tshirt',
    imageUrl: '/garments/00035_00.jpg',
  },
  {
    id: '6',
    name: 'Soft Sweatshirt',
    category: 'hoodie',
    imageUrl: '/garments/00096_00.jpg',
  },
  {
    id: '7',
    name: 'Weekend Jacket',
    category: 'jacket',
    imageUrl: '/garments/00110_00.jpg',
  },
  {
    id: '8',
    name: 'Crisp Shirt',
    category: 'tshirt',
    imageUrl: '/garments/00126_00.jpg',
  },
  {
    id: '9',
    name: 'Flow Dress',
    category: 'dress',
    imageUrl: '/garments/00151_00.jpg',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Wind },
  { id: 'tshirt', label: 'T-Shirts', icon: Shirt },
  { id: 'hoodie', label: 'Hoodies', icon: Wind },
  { id: 'jacket', label: 'Jackets', icon: Wind },
  { id: 'dress', label: 'Dresses', icon: Wind },
];

export function GarmentGallery({ onSelect, selectedId }) {
  const [filter, setFilter] = useState('all');
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  const filteredGarments =
    filter === 'all'
      ? SAMPLE_GARMENTS
      : SAMPLE_GARMENTS.filter((g) => g.category === filter);

  const handleSelect = async (garment) => {
    try {
      setLoadingId(garment.id);
      setError('');
      const response = await fetch(garment.imageUrl);

      if (!response.ok) {
        throw new Error(`Unable to load ${garment.name.toLowerCase()}`);
      }

      const blob = await response.blob();
      const file = new File([blob], `${garment.name}.jpg`, { type: 'image/jpeg' });
      onSelect(file, garment.id);
    } catch (error) {
      console.error('Failed to load garment:', error);
      setError('The selected garment could not be loaded. Please try another item.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl sm:text-3xl font-display font-semibold text-gradient-primary mb-2">
          Choose from Gallery
        </h3>
        <p className="text-sm text-muted-foreground font-sans">
          Select a garment from our curated collection
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-sans font-medium whitespace-nowrap',
              'border transition-all duration-300',
              filter === cat.id
                ? 'bg-gradient-primary text-white border-transparent shadow-md scale-105'
                : 'bg-gradient-card border-white/20 text-white/80 hover:text-white hover:border-primary-purple/50 hover:bg-gradient-card-hover',
            )}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Garment Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGarments.map((garment) => {
          const isSelected = selectedId === garment.id;
          const isLoading = loadingId === garment.id;

          return (
            <button
              key={garment.id}
              onClick={() => handleSelect(garment)}
              disabled={Boolean(loadingId)}
              className={cn(
                'relative group aspect-[3/4] rounded-xl overflow-hidden',
                'border-2 transition-all duration-300',
                'hover:scale-[1.03] active:scale-[0.98]',
                'disabled:cursor-wait disabled:hover:scale-100',
                isSelected
                  ? 'border-primary-purple shadow-glow-purple ring-2 ring-primary-purple/30'
                  : 'border-white/20 hover:border-primary-purple/50 shadow-md hover:shadow-xl',
              )}
            >
              {/* Image */}
              <img
                src={garment.imageUrl}
                alt={garment.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-medium text-white backdrop-blur-[2px]">
                  Loading...
                </div>
              )}

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gradient-success flex items-center justify-center shadow-lg animate-pop-in z-10">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Label Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs sm:text-sm font-sans font-medium text-white truncate">
                  {garment.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          className="mt-4 rounded-lg border border-brand-error/30 bg-brand-error/10 px-4 py-3"
          aria-live="polite"
        >
          <p className="text-sm text-brand-error font-sans">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {filteredGarments.length === 0 && (
        <div className="text-center py-12">
          <Wind className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground font-sans">
            No garments found in this category
          </p>
        </div>
      )}
    </div>
  );
}
