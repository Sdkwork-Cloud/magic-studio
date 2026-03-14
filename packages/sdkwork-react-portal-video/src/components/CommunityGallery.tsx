import React, { useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Clock, Filter, Flame, Loader2 } from 'lucide-react';
import { GalleryCard, type GalleryItem } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';
import { portalVideoBusinessService } from '../services';

const PAGE_SIZE = 15;

export const CommunityGallery: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'trending' | 'latest'>('trending');
  const [selectedWork, setSelectedWork] = useState<GalleryItem | null>(null);
  const [works, setWorks] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorks = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await portalVideoBusinessService.getFeaturedWorks({
          tab: activeFilter,
          page: targetPage,
          size: PAGE_SIZE,
        });

        setWorks((previous) => (append ? [...previous, ...data] : data));
        setPage(targetPage);
        setHasMore(data.length >= PAGE_SIZE);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load featured works.');
        if (!append) {
          setWorks([]);
          setPage(1);
          setHasMore(false);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilter],
  );

  useEffect(() => {
    setSelectedWork(null);
    void loadWorks(1, false);
  }, [loadWorks]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) {
      return;
    }
    void loadWorks(page + 1, true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
            <Flame className="text-orange-500 fill-orange-500" size={24} />
            Featured Creations
          </h3>
          <p className="text-sm text-gray-400">Top works from community feeds, refreshed in real time.</p>
        </div>

        <div className="flex items-center bg-[#111] p-1 rounded-xl border border-white/10 shadow-lg">
          <FilterButton
            label="Trending"
            icon={Flame}
            active={activeFilter === 'trending'}
            onClick={() => setActiveFilter('trending')}
          />
          <FilterButton
            label="Latest"
            icon={Clock}
            active={activeFilter === 'latest'}
            onClick={() => setActiveFilter('latest')}
          />
          <div className="w-px h-5 bg-white/10 mx-2" />
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 hover:bg-[#1e1e20]"
            disabled
            title="Filter is currently fixed to feed-based defaults."
          >
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading featured works...
        </div>
      ) : works.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
          {works.map((work) => (
            <GalleryCard key={work.id} item={work} onClick={(item) => setSelectedWork(item)} />
          ))}
        </div>
      ) : (
        <div className="h-56 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-sm text-gray-500">
          No feed works found in this category.
        </div>
      )}

      {works.length > 0 && (
        <div className="pt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore || !hasMore}
            className="px-8 py-3 rounded-full bg-[#18181b] border border-white/10 hover:border-white/20 hover:bg-[#222] text-sm font-medium text-gray-300 transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? 'Loading...' : hasMore ? 'Load More Creations' : 'No More Creations'}
          </button>
        </div>
      )}

      {selectedWork && (
        <GenerationPreview
          mode="view"
          galleryItem={selectedWork}
          relatedItems={works}
          onClose={() => setSelectedWork(null)}
        />
      )}
    </div>
  );
};

interface FilterButtonProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all
      ${
        active
          ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/10'
          : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
      }
    `}
  >
    <Icon size={14} className={active ? 'text-orange-500' : ''} />
    {label}
  </button>
);

