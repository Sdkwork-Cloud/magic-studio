import React, { useEffect, useState } from 'react';
import { AlertCircle, Filter, LayoutGrid, Loader2 } from 'lucide-react';
import { GalleryCard, type GalleryItem } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';
import { PortalHeader } from '../components/PortalHeader';
import { PortalSidebar } from '../components/PortalSidebar';
import { portalVideoBusinessService } from '../services';

const TABS: Array<{ id: 'trending' | 'latest' | 'following'; label: string }> = [
  { id: 'trending', label: 'Trending' },
  { id: 'latest', label: 'Latest' },
  { id: 'following', label: 'Following' },
];

const DiscoverPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let canceled = false;

    const loadDiscoverItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const works = await portalVideoBusinessService.getDiscoverWorks({
          tab: activeTab,
          page: 1,
          size: 24,
        });
        if (!canceled) {
          setItems(works);
          setPreviewItem(null);
        }
      } catch (requestError) {
        if (!canceled) {
          setItems([]);
          setError(
            requestError instanceof Error ? requestError.message : 'Failed to load discover feeds.',
          );
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    void loadDiscoverItems();
    return () => {
      canceled = true;
    };
  }, [activeTab]);

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      <PortalSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader />

        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              disabled
              title="Discover feed query is controlled by the selected tab."
            >
              <Filter size={14} />
              Filter
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              disabled
              title="Grid view is fixed for discover feed."
            >
              <LayoutGrid size={14} />
              View
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-64 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              Loading discover feed...
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <GalleryCard key={item.id} item={item} onClick={() => setPreviewItem(item)} />
              ))}
            </div>
          ) : (
            <div className="h-56 rounded-2xl border border-white/10 bg-[#111] flex items-center justify-center text-sm text-gray-500">
              No feed items found for this tab.
            </div>
          )}
        </div>
      </div>

      {previewItem && <GenerationPreview galleryItem={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
};

export default DiscoverPage;

