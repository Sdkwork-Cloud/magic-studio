
import { useRouter, ROUTES, remixService } from '@sdkwork/react-core'
import React from 'react';
import { 
    Mic, Move, Image as ImageIcon, Type, Scissors, 
    Wand2, Eraser, Layers, ChevronRight, Sparkles, Zap, 
    MonitorPlay, Speaker, ScanFace
} from 'lucide-react';

export const ToolsGrid: React.FC = () => {
    // Use useRouter safely - it returns default values if not wrapped in RouterProvider
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});

    const TOOLS = [
        { id: 'lipsync', label: '对口型', desc: '逼真唇形同步', icon: Mic, color: 'text-blue-400', bg: 'bg-[#1a1d26]', border: 'border-blue-500/20', route: ROUTES.VIDEO },
        { id: 'motion', label: '动作模仿', desc: '视频动作迁移', icon: Move, color: 'text-purple-400', bg: 'bg-[#221a26]', border: 'border-purple-500/20', route: ROUTES.VIDEO },
        { id: 'upscale', label: '4K 升级', desc: '画质增强', icon: Wand2, color: 'text-green-400', bg: 'bg-[#1a261d]', border: 'border-green-500/20', route: ROUTES.IMAGE },
        { id: 'remove', label: '字幕移除', desc: '智能擦除', icon: Eraser, color: 'text-red-400', bg: 'bg-[#261a1a]', border: 'border-red-500/20', route: ROUTES.VIDEO },
        { id: 'enhance', label: '画质增强', desc: '色彩与细节', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-[#26241a]', border: 'border-yellow-500/20', route: ROUTES.VIDEO },
        { id: 'repair', label: '照片修复', desc: '老照片复原', icon: ImageIcon, color: 'text-cyan-400', bg: 'bg-[#1a2426]', border: 'border-cyan-500/20', route: ROUTES.IMAGE },
        { id: 'extend', label: '视频延时', desc: '内容补全', icon: Layers, color: 'text-indigo-400', bg: 'bg-[#1e1e2e]', border: 'border-indigo-500/20', route: ROUTES.VIDEO },
        { id: 'obj-remove', label: '物体消除', desc: '一键移除', icon: Scissors, color: 'text-orange-400', bg: 'bg-[#26201a]', border: 'border-orange-500/20', route: ROUTES.IMAGE },
    ];

    const handleToolClick = (tool: typeof TOOLS[0]) => {
        if (tool.id === 'lipsync') {
            remixService.setIntent({ targetModule: 'video', modeHint: 'lip-sync', prompt: '', mediaReferences: [] });
        } else if (tool.id === 'motion') {
            remixService.setIntent({ targetModule: 'video', modeHint: 'motion', prompt: '', mediaReferences: [] });
        }
        navigate(tool.route as any);
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6 px-1">
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
                        <Zap size={18} fill="currentColor" />
                     </div>
                     <h3 className="text-xl font-bold text-white tracking-tight">AI 创意工具箱</h3>
                 </div>
                 <button 
                    onClick={() => navigate(ROUTES.PORTAL_TOOLS)}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full hover:bg-[#1e1e20] border border-transparent hover:border-[#333]"
                >
                     全部工具 <ChevronRight size={12} />
                 </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {TOOLS.map(tool => (
                    <div 
                        key={tool.id}
                        onClick={() => handleToolClick(tool)}
                        className={`
                            group relative p-4 bg-[#18181b] hover:bg-[#202023] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden
                        `}
                    >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-white to-transparent`} />
                        
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tool.bg} border ${tool.border} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                                <tool.icon size={24} className={tool.color} />
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-base font-bold text-gray-100 group-hover:text-white transition-colors mb-1">
                                {tool.label}
                            </h4>
                            <p className="text-xs text-gray-500 group-hover:text-gray-400 line-clamp-2 leading-relaxed">
                                {tool.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
