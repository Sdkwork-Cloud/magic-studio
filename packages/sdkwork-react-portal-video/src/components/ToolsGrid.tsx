import { useRouter, ROUTES, remixService } from '@sdkwork/react-core';
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation, createLocalizedText, resolveLocalizedText } from '@sdkwork/react-i18n';
import {
    Mic,
    Move,
    Image as ImageIcon,
    Scissors,
    Wand2,
    Eraser,
    Layers,
    ChevronRight,
    Sparkles,
    Zap,
} from 'lucide-react';

type LocalizedLabel = ReturnType<typeof createLocalizedText>;

interface ToolItem {
    id: string;
    label: LocalizedLabel;
    desc: LocalizedLabel;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
    route: string;
}

export const ToolsGrid: React.FC = () => {
    const { locale } = useTranslation();
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});

    const tools: ToolItem[] = [
        {
            id: 'lipsync',
            label: createLocalizedText('Lip Sync', '\u5bf9\u53e3\u578b'),
            desc: createLocalizedText('Realistic lip sync', '\u903c\u771f\u5507\u5f62\u540c\u6b65'),
            icon: Mic,
            color: 'text-blue-400',
            bg: 'bg-[#1a1d26]',
            border: 'border-blue-500/20',
            route: ROUTES.VIDEO,
        },
        {
            id: 'motion',
            label: createLocalizedText('Motion Copy', '\u52a8\u4f5c\u6a21\u4eff'),
            desc: createLocalizedText('Video motion transfer', '\u89c6\u9891\u52a8\u4f5c\u8fc1\u79fb'),
            icon: Move,
            color: 'text-purple-400',
            bg: 'bg-[#221a26]',
            border: 'border-purple-500/20',
            route: ROUTES.VIDEO,
        },
        {
            id: 'upscale',
            label: createLocalizedText('4K Upscale', '4K \u5347\u7ea7'),
            desc: createLocalizedText('Quality enhance', '\u753b\u8d28\u589e\u5f3a'),
            icon: Wand2,
            color: 'text-green-400',
            bg: 'bg-[#1a261d]',
            border: 'border-green-500/20',
            route: ROUTES.IMAGE,
        },
        {
            id: 'remove',
            label: createLocalizedText('Subtitle Remove', '\u5b57\u5e55\u79fb\u9664'),
            desc: createLocalizedText('Smart erase', '\u667a\u80fd\u64e6\u9664'),
            icon: Eraser,
            color: 'text-red-400',
            bg: 'bg-[#261a1a]',
            border: 'border-red-500/20',
            route: ROUTES.VIDEO,
        },
        {
            id: 'enhance',
            label: createLocalizedText('Quality Enhance', '\u753b\u8d28\u589e\u5f3a'),
            desc: createLocalizedText('Color and details', '\u8272\u5f69\u4e0e\u7ec6\u8282'),
            icon: Sparkles,
            color: 'text-yellow-400',
            bg: 'bg-[#26241a]',
            border: 'border-yellow-500/20',
            route: ROUTES.VIDEO,
        },
        {
            id: 'repair',
            label: createLocalizedText('Photo Repair', '\u7167\u7247\u4fee\u590d'),
            desc: createLocalizedText('Old photo restore', '\u8001\u7167\u7247\u590d\u539f'),
            icon: ImageIcon,
            color: 'text-cyan-400',
            bg: 'bg-[#1a2426]',
            border: 'border-cyan-500/20',
            route: ROUTES.IMAGE,
        },
        {
            id: 'extend',
            label: createLocalizedText('Video Extend', '\u89c6\u9891\u5ef6\u65f6'),
            desc: createLocalizedText('Content fill', '\u5185\u5bb9\u8865\u5168'),
            icon: Layers,
            color: 'text-indigo-400',
            bg: 'bg-[#1e1e2e]',
            border: 'border-indigo-500/20',
            route: ROUTES.VIDEO,
        },
        {
            id: 'obj-remove',
            label: createLocalizedText('Object Remove', '\u7269\u4f53\u6d88\u9664'),
            desc: createLocalizedText('One-click remove', '\u4e00\u952e\u79fb\u9664'),
            icon: Scissors,
            color: 'text-orange-400',
            bg: 'bg-[#26201a]',
            border: 'border-orange-500/20',
            route: ROUTES.IMAGE,
        },
    ];

    const handleToolClick = (tool: ToolItem) => {
        if (tool.id === 'lipsync') {
            remixService.setIntent({ targetModule: 'video', modeHint: 'lip-sync', prompt: '', mediaReferences: [] });
        } else if (tool.id === 'motion') {
            remixService.setIntent({ targetModule: 'video', modeHint: 'motion', prompt: '', mediaReferences: [] });
        }
        navigate(tool.route);
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                        {resolveLocalizedText(createLocalizedText('AI Creative Toolbox', 'AI \u521b\u610f\u5de5\u5177\u7bb1'), locale)}
                    </h3>
                </div>
                <button
                    onClick={() => navigate(ROUTES.PORTAL_TOOLS)}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full hover:bg-[#1e1e20] border border-transparent hover:border-[#333]"
                >
                    {resolveLocalizedText(createLocalizedText('All Tools', '\u5168\u90e8\u5de5\u5177'), locale)} <ChevronRight size={12} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tools.map((tool) => (
                    <div
                        key={tool.id}
                        onClick={() => handleToolClick(tool)}
                        className="group relative p-4 bg-[#18181b] hover:bg-[#202023] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-white to-transparent" />

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
                                {resolveLocalizedText(tool.label, locale)}
                            </h4>
                            <p className="text-xs text-gray-500 group-hover:text-gray-400 line-clamp-2 leading-relaxed">
                                {resolveLocalizedText(tool.desc, locale)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
