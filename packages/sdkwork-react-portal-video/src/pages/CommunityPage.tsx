import React, { useState } from 'react';
import {
    Heart, MessageCircle, Share2, Eye, TrendingUp, Clock,
    Award, Filter, Search, Plus, Image as ImageIcon,
    Video as VideoIcon, Music, Mic
} from 'lucide-react';
import { GalleryCard } from '@sdkwork/react-commons';
import { PortalHeader } from '../components/PortalHeader';

// 模拟社区数据 - 使用简化的数据结构以适应 GalleryCard
const COMMUNITY_GALLERY: any[] = [
    {
        id: 'c1',
        title: 'AI 生成的未来城市',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '16:9',
        author: { id: 'u1', name: 'AI 艺术家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist1' },
        stats: { likes: 2340, views: '15k', comments: 89 },
        prompt: '未来城市，霓虹灯，赛博朋克风格',
        model: 'stable-diffusion-xl',
        createdAt: Date.now() - 3600000,
        badges: [{ text: '热门', color: 'bg-red-600' }]
    },
    {
        id: 'c2',
        title: '动态海浪视频',
        type: 'video',
        url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '16:9',
        author: { id: 'u2', name: '视频创作者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist2' },
        stats: { likes: 1890, views: '12k', comments: 56 },
        prompt: '海浪拍打沙滩，4K 高清',
        model: 'runway-gen2',
        createdAt: Date.now() - 7200000,
        badges: [{ text: '精选', color: 'bg-blue-600' }]
    },
    {
        id: 'c3',
        title: '电子音乐作品',
        type: 'music',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '1:1',
        author: { id: 'u3', name: '音乐制作人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist3' },
        stats: { likes: 3200, views: '20k', comments: 124 },
        prompt: '电子舞曲，节奏感强',
        model: 'musiclm',
        createdAt: Date.now() - 10800000,
        badges: [{ text: '原创', color: 'bg-purple-600' }]
    },
    {
        id: 'c4',
        title: 'AI 配音演示',
        type: 'speech',
        url: 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?q=80&w=800&auto=format&fit=crop',
        aspectRatio: '16:9',
        author: { id: 'u4', name: '配音演员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist4' },
        stats: { likes: 1560, views: '8k', comments: 43 },
        prompt: '温暖的女声配音',
        model: 'elevenlabs',
        createdAt: Date.now() - 14400000,
        badges: [{ text: '推荐', color: 'bg-green-600' }]
    },
];

const CATEGORY_TABS = [
    { id: 'all', label: '全部', icon: Filter },
    { id: 'trending', label: '热门', icon: TrendingUp },
    { id: 'latest', label: '最新', icon: Clock },
    { id: 'image', label: '图片', icon: ImageIcon },
    { id: 'video', label: '视频', icon: VideoIcon },
    { id: 'music', label: '音乐', icon: Music },
    { id: 'speech', label: '配音', icon: Mic },
];

const CommunityPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

    const handleLike = (itemId: string) => {
        setLikedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const filteredGallery = COMMUNITY_GALLERY.filter(item => {
        const matchesCategory = activeCategory === 'all' || 
            activeCategory === 'trending' || 
            activeCategory === 'latest' || 
            item.type === activeCategory;
        const matchesSearch = searchQuery === '' || 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#020202]">
            {/* 顶部 Header */}
            <PortalHeader />
            
            {/* 顶部横幅 */}
            <div className="relative h-64 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-yellow-500/20 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">社区广场</h1>
                        <p className="text-gray-400 text-sm">发现、分享你的 AI 创作灵感</p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#020202] to-transparent" />
            </div>

            {/* 控制栏 */}
            <div className="sticky top-16 z-40 bg-[#020202]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* 分类标签 */}
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

                        {/* 搜索框 */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="搜索作品..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 bg-[#1a1a1c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                            />
                        </div>

                        {/* 发布按钮 */}
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                            <Plus size={14} />
                            发布作品
                        </button>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 统计信息 */}
                <div className="flex items-center gap-6 mb-6 text-xs text-gray-400">
                    <span>共 {filteredGallery.length} 件作品</span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            本周热门
                        </span>
                        <span className="flex items-center gap-1">
                            <Award size={12} />
                            精选作品
                        </span>
                    </div>
                </div>

                {/* 作品网格 */}
                {filteredGallery.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGallery.map((item) => (
                            <div key={item.id} className="group relative bg-[#1a1a1c] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all">
                                {/* 简化的作品卡片 */}
                                <div className="relative aspect-video overflow-hidden">
                                    <div 
                                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                        style={{ backgroundImage: `url(${item.url})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    
                                    {/* 悬浮操作栏 */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3">
                                            <button className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
                                                <Heart size={14} />
                                                {item.stats.likes}
                                            </button>
                                            <button className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
                                                <MessageCircle size={14} />
                                                {item.stats.comments}
                                            </button>
                                            <button className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
                                                <Eye size={14} />
                                                {item.stats.views}
                                            </button>
                                        </div>
                                        <button className="text-white/80 hover:text-white">
                                            <Share2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* 信息区域 */}
                                <div className="p-3">
                                    <h3 className="text-sm font-bold text-white mb-1 truncate">{item.title}</h3>
                                    <p className="text-xs text-gray-500 truncate">{item.author.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Filter size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-sm">暂无符合条件的作品</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPage;
