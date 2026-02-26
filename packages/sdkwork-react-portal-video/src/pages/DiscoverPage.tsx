
import React, { useState } from 'react';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalHeader } from '../components/PortalHeader';
import { 
    Flame, Clock, ChevronDown, Filter, LayoutGrid
} from 'lucide-react';
import { GalleryItem, GalleryCard } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';

// --- Mock Data Mapped to GalleryItem ---
const DISCOVER_ITEMS: GalleryItem[] = [
    {
        id: '1', title: 'Golden Cyberpunk City', type: 'video',
        url: 'https://images.unsplash.com/photo-1605218427306-0338d27038ae?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        aspectRatio: '9:16',
        author: { id: 'u1', name: 'Mateus Stefan', initial: 'M', color: 'bg-pink-600', followers: '1.2k' },
        stats: { likes: 1240, views: '45k' },
        model: 'Kling 1.6',
        prompt: 'Cyberpunk city at golden hour, neon lights, futuristic, cinematic',
        createdAt: Date.now(),
    },
    {
        id: '2', title: 'Ethereal Forest', type: 'video',
        url: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        aspectRatio: '16:9',
        author: { id: 'u2', name: 'Alice Chen', initial: 'A', color: 'bg-blue-600', followers: '856' },
        stats: { likes: 892, views: '23k' },
        model: 'Vidu',
        prompt: 'Mystical forest with glowing particles, fantasy style',
        createdAt: Date.now() - 86400000,
    },
    {
        id: '3', title: 'Space Station', type: 'video',
        url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        aspectRatio: '1:1',
        author: { id: 'u3', name: 'Bob Smith', initial: 'B', color: 'bg-green-600', followers: '2.3k' },
        stats: { likes: 2100, views: '78k' },
        model: 'Kling 1.6',
        prompt: 'Space station orbiting Earth, sci-fi, realistic',
        createdAt: Date.now() - 172800000,
    },
    {
        id: '4', title: 'Ocean Waves', type: 'video',
        url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        aspectRatio: '9:16',
        author: { id: 'u4', name: 'Carol White', initial: 'C', color: 'bg-purple-600', followers: '567' },
        stats: { likes: 456, views: '12k' },
        model: 'Jimeng',
        prompt: 'Ocean waves crashing on rocks, dramatic lighting',
        createdAt: Date.now() - 259200000,
    },
];

const TABS = ['Trending', 'Latest', 'Following'];

const DiscoverPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Trending');
    const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

    return (
        <div className="flex h-full bg-[#0a0a0a]">
            <PortalSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
                <PortalHeader />
                
                {/* Sub-header */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-6">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-sm font-medium transition-colors ${
                                    activeTab === tab 
                                        ? 'text-white' 
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                            <Filter size={14} />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                            <LayoutGrid size={14} />
                            View
                        </button>
                    </div>
                </div>
                
                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {DISCOVER_ITEMS.map(item => (
                            <GalleryCard 
                                key={item.id} 
                                item={item}
                                onClick={() => setPreviewItem(item)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
            {previewItem && (
                <GenerationPreview 
                    item={previewItem}
                    onClose={() => setPreviewItem(null)}
                />
            )}
        </div>
    );
};

export default DiscoverPage;
