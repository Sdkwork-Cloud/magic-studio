
import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Flame, Clock, Filter } from 'lucide-react';
import { GalleryCard, GalleryItem } from '@sdkwork/react-commons';
import { GenerationPreview } from '@sdkwork/react-image';

const MOCK_WORKS: GalleryItem[] = [
    { 
        id: '1', title: 'Cyberpunk Neon City', type: 'video', 
        url: 'https://images.unsplash.com/photo-1545459720-aac3e5c2e924?q=80&w=600&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        aspectRatio: '9:16',
        author: { id: 'u1', name: 'NeonDrifter', initial: 'M', color: 'bg-pink-600', followers: '1.2k' },
        stats: { likes: 856, views: 12500 },
        prompt: "A futuristic cyberpunk city street at night, neon signs, wet pavement, rain, high detail, cinematic lighting, volumetric fog, 8k",
        model: "Sora v1",
        createdAt: Date.now().toString(),
        badges: [{ text: 'HOT', color: 'bg-red-600', icon: 'fire' }]
    },
    { 
        id: '2', title: 'Serene Lake', type: 'image', 
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600', 
        aspectRatio: '16:9',
        author: { id: 'u2', name: 'NatureLens', initial: 'N', color: 'bg-blue-600' },
        stats: { likes: 1205, views: 8200 },
        prompt: "A calm lake reflecting the snowy mountains, golden hour, photorealistic, wide angle",
        model: "Gemini 3 Pro",
        createdAt: Date.now().toString()
    },
    { 
        id: '3', title: 'Abstract Fluid', type: 'video', 
        url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600', 
        aspectRatio: '1:1',
        author: { id: 'u3', name: 'MotionMaster', initial: 'M', color: 'bg-orange-500' },
        stats: { likes: 3400, views: 45000 },
        prompt: "Abstract fluid simulation, colorful liquid, 3d render, octane render, smooth motion",
        model: "Runway Gen-3",
        createdAt: Date.now().toString()
    },
    { 
        id: '4', title: 'Character Kora', type: 'image', 
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600', 
        aspectRatio: '3:4',
        author: { id: 'u4', name: 'ArtStationPro', initial: 'A', color: 'bg-purple-500' },
        stats: { likes: 156, views: 2100 },
        prompt: "Concept art of a female warrior, sci-fi armor, glowing blue energy sword, dynamic pose",
        model: "Midjourney v6",
        createdAt: Date.now().toString()
    }
];

export const CommunityGallery: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState('trending');
    const [selectedWork, setSelectedWork] = useState<GalleryItem | null>(null);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
                        <Flame className="text-orange-500 fill-orange-500" size={24} />
                        精选作品
                    </h3>
                    <p className="text-sm text-gray-400">Daily inspiration from our global creator community.</p>
                </div>

                <div className="flex items-center bg-[#111] p-1 rounded-xl border border-white/10 shadow-lg">
                    <FilterButton label="Trending" icon={Flame} active={activeFilter === 'trending'} onClick={() => setActiveFilter('trending')} />
                    <FilterButton label="Latest" icon={Clock} active={activeFilter === 'latest'} onClick={() => setActiveFilter('latest')} />
                    <div className="w-px h-5 bg-white/10 mx-2" />
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 hover:bg-[#1e1e20]">
                        <Filter size={14} /> Filter
                    </button>
                </div>
            </div>

            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
                {MOCK_WORKS.map((work) => (
                    <GalleryCard 
                        key={work.id} 
                        item={work} 
                        onClick={(item) => setSelectedWork(item)}
                    />
                ))}
            </div>
            
            <div className="pt-8 flex justify-center">
                <button className="px-8 py-3 rounded-full bg-[#18181b] border border-white/10 hover:border-white/20 hover:bg-[#222] text-sm font-medium text-gray-300 transition-all hover:scale-105 active:scale-95 shadow-lg">
                    Load More Creations
                </button>
            </div>

            {selectedWork && (
                <GenerationPreview 
                    mode="view"
                    galleryItem={selectedWork}
                    relatedItems={MOCK_WORKS}
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
            ${active 
                ? 'bg-[#27272a] text-white shadow-sm ring-1 ring-white/10' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1c]'
            }
        `}
    >
        <Icon size={14} className={active ? 'text-orange-500' : ''} />
        {label}
    </button>
);
