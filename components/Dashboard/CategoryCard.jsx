import { Heart } from 'lucide-react';

export default function CategoryCard({ sport, isFavorite, onToggle }) {
  return (
    <div className="relative bg-white border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <button
        onClick={onToggle}
        className="absolute top-3 right-3"
      >
        <Heart
          className={`w-5 h-5 ${
            isFavorite
              ? 'fill-nyu-accent-pink text-nyu-accent-pink'
              : 'text-nyu-neutral-400'
          }`}
        />
      </button>

      <div className="h-24 flex items-center justify-center bg-nyu-secondary-100 rounded-md mb-3">
        <span className="text-lg font-semibold text-nyu-primary-600">
          {sport}
        </span>
      </div>
    </div>
  );
}
