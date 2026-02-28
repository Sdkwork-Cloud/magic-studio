import React, { useState } from 'react';
import {
    Play, Clock, Star, TrendingUp, Calendar,
    ChevronRight, Filter, Search, Clapperboard, Tv, Film
} from 'lucide-react';
import { PortalHeader } from '../components/PortalHeader';
import { useRouter, ROUTES } from '@sdkwork/react-core';

// 模拟剧场数据
const DRAMA_SERIES = [
    {
        id: 'd1',
        title: '重生之都市仙尊',
        cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
        episodes: 85,
        rating: 4.8,
        views: '2.3M',
        category: '都市',
        status: '连载中',
        description: '一代仙尊重生都市，纵横花都，再登巅峰',
        badges: ['热门', '更新'],
        updatedAt: '2 小时前'
    },
    {
        id: 'd2',
        title: '穿越之古代风云',
        cover: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?q=80&w=800&auto=format&fit=crop',
        episodes: 120,
        rating: 4.9,
        views: '3.1M',
        category: '古装',
        status: '已完结',
        description: '现代女性穿越古代，智斗后宫',
        badges: ['精选', '完结'],
        updatedAt: '3 天前'
    },
    {
        id: 'd3',
        title: '末世求生指南',
        cover: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=800&auto=format&fit=crop',
        episodes: 45,
        rating: 4.7,
        views: '1.8M',
        category: '科幻',
        status: '连载中',
        description: '末世降临，人类如何求生',
        badges: ['科幻', '更新'],
        updatedAt: '5 小时前'
    },
    {
        id: 'd4',
        title: '校园恋爱日记',
        cover: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop',
        episodes: 60,
        rating: 4.6,
        views: '1.5M',
        category: '爱情',
        status: '连载中',
        description: '青春校园，甜蜜恋爱',
        badges: ['甜宠'],
        updatedAt: '1 天前'
    },
];

const FEATURED_DRAMA = {
    id: 'featured',
    title: 'AI 短剧：马年春晚特别篇',
    description: '全民 AI 创作，共创马年春晚新篇章。使用最新 AI 技术，打造视觉盛宴。',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    rating: 4.9,
    views: '5.2M',
    episodes: 12,
    tags: ['春晚', 'AI 创作', '热门']
};

const CATEGORY_FILTERS = [
    { id: 'all', label: '全部', icon: Filter },
    { id: 'trending', label: '热播榜', icon: TrendingUp },
    { id: 'new', label: '新剧', icon: Calendar },
    { id: 'urban', label: '都市', icon: Tv },
    { id: 'ancient', label: '古装', icon: Film },
    { id: 'sci-fi', label: '科幻', icon: Clapperboard },
    { id: 'romance', label: '爱情', icon: Star },
];

const TheaterPage: React.FC = () => {
    const { navigate } = useRouter();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDramas = DRAMA_SERIES.filter(drama => {
        const matchesCategory = activeCategory === 'all' || 
            activeCategory === 'trending' || 
            activeCategory === 'new' ||
            drama.category.toLowerCase().includes(activeCategory);
        const matchesSearch = searchQuery === '' || 
            drama.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#020202]">
            {/* 顶部 Header */}
            <PortalHeader />
            
            {/* 精选推荐横幅 */}
            <div className="relative h-96 overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url(${FEATURED_DRAMA.cover})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 w-full">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                    精选推荐
                                </span>
                                {FEATURED_DRAMA.tags.map((tag, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white/10 text-white text-xs rounded-full backdrop-blur-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-5xl font-bold text-white mb-4">{FEATURED_DRAMA.title}</h1>
                            <p className="text-gray-300 text-sm mb-6 leading-relaxed">{FEATURED_DRAMA.description}</p>
                            <div className="flex items-center gap-6 mb-8 text-xs text-gray-400">
                                <span className="flex items-center gap-1 text-yellow-500">
                                    <Star size={14} className="fill-yellow-500" />
                                    {FEATURED_DRAMA.rating}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Play size={14} />
                                    {FEATURED_DRAMA.views} 播放
                                </span>
                                <span className="flex items-center gap-1">
                                    <Film size={14} />
                                    {FEATURED_DRAMA.episodes} 集
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    <Play size={16} />
                                    立即观看
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                                    加入收藏
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 筛选栏 */}
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
                                placeholder="搜索剧集..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 bg-[#1a1a1c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 章节标题 */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">热门短剧</h2>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                        查看更多
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* 短剧网格 */}
                {filteredDramas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDramas.map((drama) => (
                            <div 
                                key={drama.id} 
                                className="group relative bg-[#1a1a1c] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                                onClick={() => navigate(ROUTES.PORTAL_VIDEO)}
                            >
                                {/* 封面图 */}
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <div 
                                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                        style={{ backgroundImage: `url(${drama.cover})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    
                                    {/* 播放按钮 */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                                            <Play size={24} className="text-white ml-1" />
                                        </div>
                                    </div>

                                    {/* 徽章 */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {drama.badges.map((badge, idx) => (
                                            <span 
                                                key={idx} 
                                                className={`px-2 py-1 text-[10px] font-bold rounded ${
                                                    badge === '热门' ? 'bg-red-600 text-white' :
                                                    badge === '精选' ? 'bg-blue-600 text-white' :
                                                    badge === '更新' ? 'bg-green-600 text-white' :
                                                    badge === '完结' ? 'bg-purple-600 text-white' :
                                                    'bg-gray-600 text-white'
                                                }`}
                                            >
                                                {badge}
                                            </span>
                                        ))}
                                    </div>

                                    {/* 右上角集数 */}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                                        {drama.episodes}集
                                    </div>
                                </div>

                                {/* 信息区域 */}
                                <div className="p-4">
                                    <h3 className="text-sm font-bold text-white mb-2 truncate">{drama.title}</h3>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{drama.description}</p>
                                    
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1 text-yellow-500">
                                            <Star size={12} className="fill-yellow-500" />
                                            {drama.rating}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Play size={12} />
                                            {drama.views}
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <Clock size={12} />
                                            {drama.updatedAt}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Film size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-sm">暂无符合条件的剧集</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TheaterPage;
