import React, { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  AlertCircle,
  Calendar,
  Clapperboard,
  Clock,
  Film,
  Loader2,
  Play,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react';
import { GalleryCard, formatLocaleDate, type GalleryItem } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';
import { PortalHeader } from '../components/PortalHeader';
import { ViralFeed } from '../components/ViralFeed';
import { portalVideoBusinessService, type PortalDiscoverTab } from '../services';

type TheaterCategory = 'all' | 'trending' | 'latest' | 'following' | 'video' | 'image' | 'music' | 'voice';

interface TheaterFilterOption {
  id: TheaterCategory;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const CATEGORY_FILTERS: TheaterFilterOption[] = [
  { id: 'all', label: 'All', icon: Film },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'latest', label: 'Latest', icon: Calendar },
  { id: 'following', label: 'Following', icon: Star },
  { id: 'video', label: 'Video', icon: Clapperboard },
  { id: 'image', label: 'Image', icon: Film },
  { id: 'music', label: 'Music', icon: Play },
  { id: 'voice', label: 'Voice', icon: Clock },
];

interface TheaterFeedQuery {
  tab: PortalDiscoverTab;
  contentType?: 'video' | 'image' | 'music' | 'audio';
}

function resolveTheaterFeedQuery(category: TheaterCategory): TheaterFeedQuery {
  if (category === 'latest') {
    return { tab: 'latest' };
  }
  if (category === 'following') {
    return { tab: 'following' };
  }
  if (category === 'video') {
    return { tab: 'trending', contentType: 'video' };
  }
  if (category === 'image') {
    return { tab: 'trending', contentType: 'image' };
  }
  if (category === 'music') {
    return { tab: 'trending', contentType: 'music' };
  }
  if (category === 'voice') {
    return { tab: 'trending', contentType: 'audio' };
  }
  return { tab: 'trending' };
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

const TheaterPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<TheaterCategory>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const requestQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  useEffect(() => {
    let canceled = false;

    const loadTheaterFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const feedQuery = resolveTheaterFeedQuery(activeCategory);
        const feedItems = await portalVideoBusinessService.getFeaturedWorks({
          tab: feedQuery.tab,
          contentType: feedQuery.contentType,
          keyword: requestQuery || undefined,
          page: 1,
          size: 25,
        });
        if (!canceled) {
          setItems(feedItems);
          setPreviewItem(null);
        }
      } catch (requestError) {
        if (!canceled) {
          setItems([]);
          setError(
            requestError instanceof Error ? requestError.message : 'Failed to load theater feed.',
          );
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    void loadTheaterFeed();
    return () => {
      canceled = true;
    };
  }, [activeCategory, requestQuery]);

  const featuredItem = items[0] ?? null;
  const featuredBackground = (featuredItem?.url || '').trim();
  const galleryItems = items.slice(1);
  const featuredTags = (featuredItem?.tags ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#020202]">
      <PortalHeader />

      <div className="relative h-96 overflow-hidden">
        <div
          className={`absolute inset-0 transition-transform duration-700 hover:scale-105 ${
            featuredBackground
              ? 'bg-cover bg-center'
              : 'bg-[radial-gradient(circle_at_20%_30%,rgba(239,68,68,0.35),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.28),transparent_50%),linear-gradient(135deg,#121212,#050505)]'
          }`}
          style={featuredBackground ? { backgroundImage: `url(${featuredBackground})` } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                  Featured
                </span>
                {featuredTags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 text-white text-xs rounded-full backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 line-clamp-2">
                {featuredItem?.title || 'Loading theater highlights...'}
              </h1>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed line-clamp-3">
                {featuredItem?.prompt || 'Top feed creations from the community are displayed here.'}
              </p>
              <div className="flex items-center gap-6 mb-8 text-xs text-gray-400">
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star size={14} className="fill-yellow-500" />
                  {featuredItem?.stats?.likes ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Play size={14} />
                  {formatViews(featuredItem?.stats?.views)} plays
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {featuredItem?.createdAt ? formatLocaleDate(featuredItem.createdAt) : '-'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => featuredItem && setPreviewItem(featuredItem)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!featuredItem}
              >
                <Play size={16} />
                Preview Work
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-40 bg-[#020202]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {CATEGORY_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeCategory === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveCategory(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#1a1a1c] text-white border border-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1c]/50 border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search theater feeds..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-64 bg-[#1a1a1c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="h-56 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading theater feed...
          </div>
        ) : galleryItems.length > 0 ? (
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-white mb-5">Feed Theater List</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {galleryItems.map((item) => (
                  <GalleryCard key={item.id} item={item} onClick={() => setPreviewItem(item)} />
                ))}
              </div>
            </section>

            <section>
              <ViralFeed
                items={items.slice(0, 10)}
                loading={loading}
                onSelect={(item) => setPreviewItem(item)}
              />
            </section>
          </div>
        ) : (
          <div className="h-56 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-sm text-gray-500">
            No theater feed items found.
          </div>
        )}
      </div>

      {previewItem && (
        <GenerationPreview
          mode="view"
          galleryItem={previewItem}
          relatedItems={items}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
};

export default TheaterPage;
