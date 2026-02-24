
import React, { useState } from 'react';
import { PortalSidebar } from '../components/PortalSidebar';
import { PortalHeader } from '../components/PortalHeader';
import { 
    Flame, Clock, ChevronDown, Filter, LayoutGrid
} from 'lucide-react';
import { GalleryItem } from '../../../types/gallery';
import { GalleryCard } from '../../../components/Gallery/GalleryCard';
import { GenerationPreview } from '../../image/components/GenerationPreview';

// --- Mock Data Mapped to GalleryItem ---
const DISCOVER_ITEMS: GalleryItem[] = [
    {
        id: '1', title: 'Golden Cyberpunk City', type: 'video',
        url: 'https://images.unsplash.com/photo-1605218427306-0338d27038ae?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        aspectRatio: '9:16',
        author: { id: 'u1', name: 'Mateus Stefan', initial: 'M', color: 'bg-pink-600', followers: '1.2k' },
        stats: { likes: 1240, views: '45k' },
        tags: ['cyberpunk', 'city', 'night', 'neon'],
        model: 'Veo 3.1',
        prompt: 'Futuristic cyberpunk city street at night, rain, neon lights, volumetric fog, cinematic lighting, 8k resolution',
        badges: [{ icon: 'fire', color: 'bg-red-600', text: 'HOT' }],
        createdAt: Date.now()
    },
    {
        id: '2', title: 'Lion Cub Resting', type: 'video',
        url: 'https://images.unsplash.com/photo-1546182990-dced71d4d804?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        aspectRatio: '16:9',
        author: { id: 'u2', name: 'Irina Fachin', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop', initial: 'I', color: 'bg-blue-600', followers: '850' },
        stats: { likes: 856, views: '12k' },
        tags: ['nature', 'animals', 'wildlife'],
        model: 'Sora v1',
        prompt: 'A tiny lion cub sleeping in a human hand, highly detailed fur, soft sunlight, photorealistic',
        createdAt: Date.now()
    },
    {
        id: '3', title: 'Masks of Drama', type: 'image',
        url: 'https://images.unsplash.com/photo-1590272456521-1bbe16421029?q=80&w=600&auto=format&fit=crop',
        aspectRatio: '3:4',
        author: { id: 'u3', name: 'Artsvision', initial: 'A', color: 'bg-orange-500', followers: '3.4k' },
        stats: { likes: 432, views: '5k' },
        tags: ['art', 'surreal', 'masks'],
        model: 'Midjourney v6',
        prompt: 'Surreal composition of theatrical masks floating in a dark void, dramatic lighting, renaissance style',
        createdAt: Date.now()
    },
    {
        id: '4', title: 'Pastel Dream Room', type: 'video',
        url: 'https://images.unsplash.com/photo-1534349762913-924905f6727f?q=80&w=600&auto=format&fit=crop',
        aspectRatio: '16:9',
        author: { id: 'u4', name: 'Irina Fachin', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop', initial: 'I', color: 'bg-blue-600' },
        stats: { likes: 2100, views: '89k' },
        tags: ['interior', 'design', 'pastel'],
        model: 'Runway Gen-3',
        prompt: 'A luxurious living room with pastel pink and blue furniture, large windows, soft morning light, 4k video',
        createdAt: Date.now()
    },
    {
        id: '5', title: 'Space Exploration', type: 'video',
        url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600', 
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        aspectRatio: '16:9',
        author: { id: 'u5', name: 'Cosmos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', initial: 'C', color: 'bg-blue-600' },
        stats: { likes: 12000, views: '156k' },
        tags: ['space', 'sci-fi'],
        model: 'Veo 3.1',
        prompt: 'Astronaut floating in deep space',
        createdAt: Date.now()
    }
];

const CATEGORIES = ['全部', '视频', '角色', '图像', '短剧'];

const DiscoverPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const filteredItems = activeCategory === '全部' 
        ? DISCOVER_ITEMS 
        : DISCOVER_ITEMS.filter(item => {
            if (activeCategory === '视频') return item.type === 'video';
            if (activeCategory === '图像') return item.type === 'image';
            return true;
        });

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
            <PortalSidebar />
            
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <PortalHeader />
                
                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6 md:p-8">
                    <div className="max-w-[1800px] mx-auto">
                        
                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-md py-4 -mt-6 border-b border-white/5">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`
                                            px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                            ${activeCategory === cat 
                                                ? 'bg-white text-black shadow-lg shadow-white/10' 
                                                : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#252526] border border-white/5'
                                            }
                                        `}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center">
                                <button className="flex items-center gap-2 text-xs font-medium text-gray-300 bg-[#1a1a1a] hover:bg-[#252526] px-4 py-2 rounded-lg transition-colors border border-white/5">
                                    <Filter size={12} />
                                    Filter
                                    <ChevronDown size={12} className="opacity-50" />
                                </button>
                            </div>
                        </div>

                        {/* Gallery Grid using Reusable Component */}
                        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 pb-20">
                            {filteredItems.map((item) => (
                                <GalleryCard 
                                    key={item.id} 
                                    item={item} 
                                    onClick={(it) => setSelectedItem(it)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Modal using Unified Component */}
                {selectedItem && (
                    <GenerationPreview 
                        mode="view"
                        galleryItem={selectedItem}
                        relatedItems={filteredItems}
                        onClose={() => setSelectedItem(null)} 
                    />
                )}
            </div>
        </div>
    );
};

export default DiscoverPage;
