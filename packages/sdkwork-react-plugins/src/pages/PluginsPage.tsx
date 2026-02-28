import React, { useState } from 'react';
import { 
    Puzzle, Download, Star, Search, 
    Zap, Palette, Video, Music, 
    Mic, Wand2, Check,
    RefreshCw, Trash2, Settings
} from 'lucide-react';
import { PLUGIN_CATEGORIES, Plugin } from '../constants';
import { PortalHeader } from '@sdkwork/react-portal-video';

const DEFAULT_PLUGINS: Plugin[] = [
    {
        id: 'p1',
        name: '批量处理助手',
        description: '一键批量处理多个媒体文件，提升工作效率',
        icon: Zap,
        category: 'productivity',
        version: '2.1.0',
        downloads: 45200,
        rating: 4.9,
        author: 'AI Studio',
        verified: true,
        installed: true,
        price: '免费',
        badges: ['热门', '官方'],
        updateAvailable: true
    },
    {
        id: 'p2',
        name: '高级滤镜',
        description: '50+ 专业级滤镜效果，让作品更具艺术感',
        icon: Palette,
        category: 'effects',
        version: '1.5.2',
        downloads: 32800,
        rating: 4.8,
        author: 'FilterMaster',
        verified: true,
        installed: false,
        price: '¥29',
        badges: ['精选'],
        updateAvailable: false
    },
    {
        id: 'p3',
        name: '视频转场特效',
        description: '丰富的视频转场动画效果库',
        icon: Video,
        category: 'effects',
        version: '3.0.1',
        downloads: 28500,
        rating: 4.7,
        author: 'VideoFX',
        verified: true,
        installed: true,
        price: '免费',
        badges: ['实用'],
        updateAvailable: false
    },
    {
        id: 'p4',
        name: 'AI 智能抠图',
        description: '一键精准抠图，支持复杂边缘处理',
        icon: Wand2,
        category: 'ai',
        version: '1.8.0',
        downloads: 52100,
        rating: 4.9,
        author: 'AI Tools',
        verified: true,
        installed: false,
        price: '¥19',
        badges: ['AI', '热门'],
        updateAvailable: true
    },
    {
        id: 'p5',
        name: '音效库扩展',
        description: '1000+ 高品质音效素材',
        icon: Music,
        category: 'assets',
        version: '2.3.0',
        downloads: 19600,
        rating: 4.6,
        author: 'SoundLab',
        verified: false,
        installed: false,
        price: '¥39',
        badges: ['素材'],
        updateAvailable: false
    },
    {
        id: 'p6',
        name: '语音增强器',
        description: 'AI 降噪，提升语音质量',
        icon: Mic,
        category: 'ai',
        version: '1.2.5',
        downloads: 15800,
        rating: 4.8,
        author: 'AudioAI',
        verified: true,
        installed: true,
        price: '免费',
        badges: ['AI', '实用'],
        updateAvailable: false
    },
];

const PluginsPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [plugins, setPlugins] = useState<Plugin[]>(DEFAULT_PLUGINS);
    const [showInstalledOnly, setShowInstalledOnly] = useState(false);

    const filteredPlugins = plugins.filter(plugin => {
        const matchesCategory = activeCategory === 'all' || 
            activeCategory === 'trending' || 
            plugin.category === activeCategory;
        const matchesInstalled = !showInstalledOnly || plugin.installed;
        const matchesSearch = searchQuery === '' || 
            plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesInstalled && matchesSearch;
    });

    const handleInstall = (pluginId: string) => {
        setPlugins(prev => prev.map(p => 
            p.id === pluginId ? { ...p, installed: !p.installed } : p
        ));
    };

    const handleUpdate = (pluginId: string) => {
        setPlugins(prev => prev.map(p => 
            p.id === pluginId ? { ...p, updateAvailable: false, version: incrementVersion(p.version) } : p
        ));
    };

    const incrementVersion = (version: string) => {
        const parts = version.split('.').map(Number);
        parts[2] = (parts[2] || 0) + 1;
        return parts.join('.');
    };

    const installedCount = plugins.filter(p => p.installed).length;
    const updateCount = plugins.filter(p => p.updateAvailable).length;

    return (
        <div className="min-h-screen bg-[#020202]">
            <PortalHeader />
            
            <div className="relative h-40 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">插件中心</h1>
                        <p className="text-gray-400 text-sm">扩展你的 AI 创作能力</p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#020202] to-transparent" />
            </div>

            <div className="sticky top-0 z-40 bg-[#020202]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto flex-1">
                            {PLUGIN_CATEGORIES.map((filter) => {
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
                                placeholder="搜索插件..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 bg-[#1a1a1c] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-xs">
                        <button
                            onClick={() => setShowInstalledOnly(!showInstalledOnly)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                showInstalledOnly
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#1a1a1c] text-gray-400 hover:text-white'
                            }`}
                        >
                            <Check size={12} />
                            已安装 ({installedCount})
                        </button>
                        {updateCount > 0 && (
                            <span className="flex items-center gap-1 text-orange-400">
                                <RefreshCw size={12} />
                                {updateCount} 个更新可用
                            </span>
                        )}
                        <span className="text-gray-500 ml-auto">
                            共 {filteredPlugins.length} 个插件
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {filteredPlugins.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPlugins.map((plugin) => {
                            const Icon = plugin.icon;
                            return (
                                <div 
                                    key={plugin.id} 
                                    className="group relative bg-[#1a1a1c] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                            plugin.category === 'ai' ? 'bg-purple-500/20 text-purple-400' :
                                            plugin.category === 'effects' ? 'bg-pink-500/20 text-pink-400' :
                                            plugin.category === 'productivity' ? 'bg-blue-500/20 text-blue-400' :
                                            plugin.category === 'assets' ? 'bg-green-500/20 text-green-400' :
                                            'bg-orange-500/20 text-orange-400'
                                        }`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-white truncate">{plugin.name}</h3>
                                                {plugin.verified && (
                                                    <Check size={12} className="text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span>v{plugin.version}</span>
                                                {plugin.updateAvailable && (
                                                    <span className="text-orange-400 flex items-center gap-1">
                                                        <RefreshCw size={10} />
                                                        可更新
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{plugin.description}</p>

                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {plugin.badges.map((badge, idx) => (
                                            <span 
                                                key={idx} 
                                                className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                                                    badge === '热门' ? 'bg-red-500/20 text-red-400' :
                                                    badge === '精选' ? 'bg-blue-500/20 text-blue-400' :
                                                    badge === '官方' ? 'bg-green-500/20 text-green-400' :
                                                    badge === 'AI' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}
                                            >
                                                {badge}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Download size={12} />
                                            {(plugin.downloads / 1000).toFixed(0)}k
                                        </span>
                                        <span className="flex items-center gap-1 text-yellow-500">
                                            <Star size={12} className="fill-yellow-500" />
                                            {plugin.rating}
                                        </span>
                                        <span className="text-gray-400">{plugin.price}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {plugin.installed ? (
                                            <>
                                                {plugin.updateAvailable ? (
                                                    <button
                                                        onClick={() => handleUpdate(plugin.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                    >
                                                        <RefreshCw size={12} />
                                                        更新
                                                    </button>
                                                ) : (
                                                    <button className="flex-1 px-3 py-2 bg-[#2a2a2d] text-gray-400 rounded-lg text-xs font-medium cursor-default">
                                                        已安装
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleInstall(plugin.id)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2d] rounded-lg transition-colors">
                                                    <Settings size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleInstall(plugin.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <Download size={12} />
                                                安装
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Puzzle size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400 text-sm">暂无符合条件的插件</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PluginsPage;
