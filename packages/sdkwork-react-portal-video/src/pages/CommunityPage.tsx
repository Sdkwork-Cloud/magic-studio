import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Filter,
  Flame,
  Image as ImageIcon,
  Loader2,
  Mic,
  Music,
  Plus,
  Search,
  Video as VideoIcon,
} from 'lucide-react';
import { GalleryCard, type GalleryItem } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';
import { PortalHeader } from '../components/PortalHeader';
import { portalVideoBusinessService, type PortalDiscoverTab } from '../services';

type CategoryKey = 'all' | 'trending' | 'latest' | 'image' | 'video' | 'music' | 'voice';

const CATEGORY_TABS: Array<{ id: CategoryKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'all', label: 'All', icon: Filter },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'latest', label: 'Latest', icon: Flame },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'voice', label: 'Voice', icon: Mic },
];

function resolveTab(category: CategoryKey): PortalDiscoverTab {
  if (category === 'latest') {
    return 'latest';
  }
  return 'trending';
}

function resolveContentType(category: CategoryKey): 'image' | 'video' | 'music' | 'audio' | undefined {
  if (category === 'image') {
    return 'image';
  }
  if (category === 'video') {
    return 'video';
  }
  if (category === 'music') {
    return 'music';
  }
  if (category === 'voice') {
    return 'audio';
  }
  return undefined;
}

const CommunityPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishDraft, setPublishDraft] = useState({
    title: '',
    content: '',
    coverImage: '',
  });

  const requestQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  useEffect(() => {
    let canceled = false;

    const loadCommunityFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const feedItems = await portalVideoBusinessService.getDiscoverWorks({
          tab: resolveTab(activeCategory),
          contentType: resolveContentType(activeCategory),
          keyword: requestQuery || undefined,
          page: 1,
          size: 24,
        });
        if (!canceled) {
          setItems(feedItems);
          setPreviewItem(null);
        }
      } catch (requestError) {
        if (!canceled) {
          setItems([]);
          setError(
            requestError instanceof Error ? requestError.message : 'Failed to load community feed.',
          );
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    void loadCommunityFeed();
    return () => {
      canceled = true;
    };
  }, [activeCategory, requestQuery, refreshSeed]);

  const closePublishDialog = () => {
    if (publishing) {
      return;
    }
    setPublishOpen(false);
    setPublishError(null);
  };

  const handlePublish = async () => {
    const content = publishDraft.content.trim();
    if (!content) {
      setPublishError('Content is required.');
      return;
    }

    setPublishing(true);
    setPublishError(null);
    try {
      const created = await portalVideoBusinessService.createFeed({
        title: publishDraft.title.trim() || undefined,
        content,
        coverImage: publishDraft.coverImage.trim() || undefined,
      });
      setItems((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);
      setPublishDraft({ title: '', content: '', coverImage: '' });
      setPublishOpen(false);
      setRefreshSeed((value) => value + 1);
    } catch (requestError) {
      setPublishError(requestError instanceof Error ? requestError.message : 'Failed to publish feed.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <PortalHeader />

      <div className="relative h-64 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-yellow-500/20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Community Creations</h1>
            <p className="text-gray-400 text-sm">Discover and share works from the feed network.</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#020202] to-transparent" />
      </div>

      <div className="sticky top-16 z-40 bg-[#020202]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#1a1a1c] text-white border border-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1c]/50 border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search feed works..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-64 bg-[#1a1a1c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>

            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
              onClick={() => setPublishOpen(true)}
            >
              <Plus size={14} />
              Publish
            </button>
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
            Loading community feed...
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <GalleryCard key={item.id} item={item} onClick={() => setPreviewItem(item)} />
            ))}
          </div>
        ) : (
          <div className="h-56 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-sm text-gray-500">
            No feed data matched this filter.
          </div>
        )}
      </div>

      {previewItem && (
        <GenerationPreview mode="view" galleryItem={previewItem} relatedItems={items} onClose={() => setPreviewItem(null)} />
      )}

      {publishOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePublishDialog}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-1">Publish Feed</h2>
            <p className="text-xs text-gray-400 mb-5">
              Submit a community post through APP SDK feed API.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={publishDraft.title}
                  onChange={(event) =>
                    setPublishDraft((previous) => ({ ...previous, title: event.target.value }))
                  }
                  className="w-full bg-[#1a1a1c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/25"
                  placeholder="e.g. Sunset cinematic scene"
                  disabled={publishing}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Content</label>
                <textarea
                  value={publishDraft.content}
                  onChange={(event) =>
                    setPublishDraft((previous) => ({ ...previous, content: event.target.value }))
                  }
                  className="w-full min-h-[120px] bg-[#1a1a1c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/25"
                  placeholder="Describe your creation..."
                  disabled={publishing}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Cover Image URL (optional)</label>
                <input
                  type="url"
                  value={publishDraft.coverImage}
                  onChange={(event) =>
                    setPublishDraft((previous) => ({ ...previous, coverImage: event.target.value }))
                  }
                  className="w-full bg-[#1a1a1c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/25"
                  placeholder="https://..."
                  disabled={publishing}
                />
              </div>
            </div>

            {publishError && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {publishError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-50"
                onClick={closePublishDialog}
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white disabled:opacity-60"
                onClick={() => void handlePublish()}
                disabled={publishing}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
