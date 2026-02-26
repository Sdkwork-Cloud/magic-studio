
import { useRouter, ROUTES } from '@sdkwork/react-core'
import { PortalSidebar } from '../components/PortalSidebar'
import { PortalHeader } from '../components/PortalHeader'
import React, { useState } from 'react';
import { 
    Wand2, Video, Image as ImageIcon, Mic, 
    Search, Layers, Scissors, Move, Eraser, Play, Sparkles
} from 'lucide-react';

interface AITool {
    id: string;
    title: string;
    description: string;
    category: 'Video' | 'Image' | 'Audio';
    image: string;
    badge?: string;
    icon?: any;
    color?: string;
    route: string;
}

const TOOL_CATEGORIES = [
    { id: 'all', label: '全部工具' },
    { id: 'Video', label: '视频工具' },
    { id: 'Image', label: '图像工具' },
    { id: 'Audio', label: '音频工具' },
];

const AI_TOOLS: AITool[] = [
    {
        id: 'video-extender',
        title: 'AI 视频延时',
        description: '无缝延长视频长度，保持内容连贯性',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop',
        badge: '最新',
        icon: Layers,
        color: 'bg-blue-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'lip-sync',
        title: '嘴型同步',
        description: '让视频人物的嘴型与任意音频完美同步',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
        icon: Mic,
        color: 'bg-purple-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'img-to-video',
        title: '图像生成视频',
        description: '让静态图片动起来，生成逼真的动态视频',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop',
        badge: '热门',
        icon: Video,
        color: 'bg-pink-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'video-upscale',
        title: '视频升级',
        description: '将低分辨率视频提升至 4K 超清画质',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop',
        icon: Wand2,
        color: 'bg-green-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'video-enhance',
        title: '视频增强',
        description: '智能调节色彩、对比度，修复画质',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=600&auto=format&fit=crop',
        icon: Sparkles,
        color: 'bg-yellow-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'face-swap',
        title: '视频换脸',
        description: '高精度的视频人脸替换技术',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
        badge: 'Beta',
        icon: Video,
        color: 'bg-red-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'baby-generator',
        title: 'AI 宝宝播客',
        description: '生成可爱的 AI 宝宝形象进行播报',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=600&auto=format&fit=crop',
        icon: Mic,
        color: 'bg-indigo-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'pet-generator',
        title: 'AI 宠物播客',
        description: '让你的宠物开口说话，制作趣味视频',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop',
        icon: Mic,
        color: 'bg-orange-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'denoise',
        title: '视频降噪',
        description: '去除视频中的噪点，提升画面纯净度',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1550745165-9010d9521d51?q=80&w=600&auto=format&fit=crop',
        icon: Eraser,
        color: 'bg-gray-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'dance-gen',
        title: 'AI 舞蹈生成',
        description: '根据音乐节奏自动生成舞蹈动作',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=600&auto=format&fit=crop',
        icon: Move,
        color: 'bg-fuchsia-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'subtitle-remove',
        title: '字幕移除',
        description: '智能擦除视频硬字幕，无痕修复背景',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?q=80&w=600&auto=format&fit=crop',
        icon: Scissors,
        color: 'bg-cyan-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'anime-video',
        title: '视频转动漫',
        description: '一键将真人视频转换为二次元动漫风格',
        category: 'Video',
        image: 'https://images.unsplash.com/photo-1569701813229-33284b643634?q=80&w=600&auto=format&fit=crop',
        icon: Wand2,
        color: 'bg-pink-500',
        route: ROUTES.VIDEO
    },
    {
        id: 'face-enhance',
        title: 'AI 人脸增强',
        description: '修复模糊人脸，增强面部细节',
        category: 'Image',
        image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop',
        badge: '使用此工具',
        icon: Sparkles,
        color: 'bg-amber-500',
        route: ROUTES.IMAGE
    },
    {
        id: 'img-remove-obj',
        title: '物体移除',
        description: '智能移除图片中的路人或杂物',
        category: 'Image',
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
        icon: Eraser,
        color: 'bg-teal-500',
        route: ROUTES.IMAGE
    },
    {
        id: 'bg-remove',
        title: '背景移除',
        description: '精准抠图，一键移除图片背景',
        category: 'Image',
        image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop',
        icon: Scissors,
        color: 'bg-lime-500',
        route: ROUTES.IMAGE
    }
];

const AIToolsPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Use useRouter safely - it returns default values if not wrapped in RouterProvider
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});

    const filteredTools = AI_TOOLS.filter(tool => {
        const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
        const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex w-full h-full bg-[#050505] text-gray-200 font-sans overflow-hidden">
            <PortalSidebar />

            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <PortalHeader />

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-[1600px] mx-auto">
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">AI 工具箱</h1>
                                <p className="text-gray-500 text-sm">探索强大的 AI 视频与图像处理工具，激发创意无限</p>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-[#18181b] p-1.5 rounded-xl border border-[#27272a]">
                                {TOOL_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`
                                            px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                                            ${activeCategory === cat.id 
                                                ? 'bg-white text-black shadow-sm' 
                                                : 'text-gray-500 hover:text-white hover:bg-[#27272a]'
                                            }
                                        `}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative mb-8 max-w-lg">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索 AI 工具..."
                                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-11 pr-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                            {filteredTools.map(tool => (
                                <ToolCard key={tool.id} tool={tool} onClick={() => navigate(tool.route as any)} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolCard: React.FC<{ tool: AITool, onClick: () => void }> = ({ tool, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-[#18181b] rounded-xl overflow-hidden cursor-pointer border border-[#27272a] hover:border-[#444] transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
        >
            <div className="aspect-[16/9] relative overflow-hidden bg-[#111]">
                <img 
                    src={tool.image} 
                    alt={tool.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent opacity-80" />

                {tool.badge && (
                    <div className={`absolute top-2 left-2 text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wide ${tool.badge === '使用此工具' ? 'bg-pink-600' : 'bg-blue-600'}`}>
                        {tool.badge}
                    </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                </div>
            </div>

            <div className="p-4 relative">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{tool.title}</h3>
                </div>
                
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed h-9">
                    {tool.description}
                </p>
                
                <div className="mt-4 pt-3 border-t border-[#27272a] flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium bg-[#222] px-2 py-1 rounded">
                         <tool.icon size={10} />
                         {tool.category}
                    </div>
                    <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        立即试用 <Sparkles size={10} />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AIToolsPage;
