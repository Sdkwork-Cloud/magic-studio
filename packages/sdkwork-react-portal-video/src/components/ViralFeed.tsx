import React from 'react';
import { Flame, Loader2, Play } from 'lucide-react';
import type { GalleryItem } from '@sdkwork/react-commons';

export interface ViralFeedProps {
  items: GalleryItem[];
  loading?: boolean;
  onSelect?: (item: GalleryItem) => void;
}

function formatViews(value?: number): string {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) {
    return '0';
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return String(count);
}

export const ViralFeed: React.FC<ViralFeedProps> = ({ items, loading = false, onSelect }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111] px-6 py-8 flex items-center justify-center text-gray-400">
        <Loader2 size={18} className="animate-spin mr-2" />
        Loading viral feed...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111] px-6 py-8 text-sm text-gray-500 text-center">
        No viral feed items available.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 px-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded w-fit">
          Viral Feed
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-[#27272a] hover:border-gray-500 transition-all text-left"
          >
            <img
              src={item.url}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              alt={item.title}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
              <Flame size={10} className="text-orange-500 fill-orange-500" />
              {formatViews(item.stats?.views)}
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                <Play size={16} fill="currentColor" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{item.title}</h4>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gray-700 overflow-hidden">
                  {item.author?.avatar ? (
                    <img src={item.author.avatar} alt={item.author?.name || 'Creator'} />
                  ) : null}
                </div>
                <span className="text-[10px] text-gray-400">{item.author?.name || 'Creator'}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
