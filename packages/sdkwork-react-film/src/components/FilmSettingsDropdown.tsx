
import React, { useState, useRef, useEffect } from 'react';
import { 
    Settings2, ChevronDown, Monitor, Film,
    Ratio, Activity, Smartphone, LayoutTemplate, Square, Check, Download
} from 'lucide-react';

import { FilmSettings } from '@sdkwork/react-commons';
import { useFilmStore } from '../store/filmStore';

const ASPECT_RATIOS = [
    { value: '16:9', label: 'Landscape', icon: Monitor, dims: '1920x1080' },
    { value: '9:16', label: 'Portrait', icon: Smartphone, dims: '1080x1920' },
    { value: '2.39:1', label: 'CinemaScope', icon: Film, dims: '2048x858' },
    { value: '4:3', label: 'Classic TV', icon: LayoutTemplate, dims: '1440x1080' },
    { value: '1:1', label: 'Square', icon: Square, dims: '1080x1080' },
];

const RESOLUTIONS = [
    { value: '720P', label: 'HD 720P' },
    { value: '1080P', label: 'Full HD 1080P' },
    { value: '2K', label: '2K QHD' },
    { value: '4K', label: '4K UHD' },
];

const QUALITIES = [
    { value: 'draft', label: 'Draft (Fast)' },
    { value: 'standard', label: 'Standard' },
    { value: 'high', label: 'High Quality' },
    { value: 'ultra', label: 'Ultra (Slow)' },
];

export const FilmSettingsDropdown: React.FC = () => {
    const { project, updateProjectSettings, exportProjectToJson } = useFilmStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const settings = project.settings;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleChange = <K extends keyof FilmSettings>(key: K, value: FilmSettings[K]) => {
        updateProjectSettings({ [key]: value } as Partial<FilmSettings>);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                    ${isOpen 
                        ? 'bg-[#27272a] text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                `}
                title="Project Settings"
            >
                <Settings2 size={14} />
                <span>Settings</span>
                <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-[320px] bg-[#18181b] border border-[#333] rounded-xl shadow-2xl p-4 z-[200] animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-6 ring-1 ring-black/50 origin-top-right">
                    
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Ratio size={12} /> Project Format
                            </span>
                            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 rounded border border-blue-500/20 font-mono">
                                {settings.aspect}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {ASPECT_RATIOS.map((ratio) => {
                                const isActive = settings.aspect === ratio.value;
                                return (
                                    <button
                                        key={ratio.value}
                                        onClick={() => handleChange('aspect', ratio.value)}
                                        className={`
                                            flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all h-16
                                            ${isActive 
                                                ? 'bg-[#252526] border-blue-500 text-blue-400 ring-1 ring-blue-500/20' 
                                                : 'bg-[#1e1e20] border-transparent hover:border-[#444] text-gray-500 hover:text-gray-300'
                                            }
                                        `}
                                    >
                                        <ratio.icon size={16} />
                                        <div className="flex flex-col items-center leading-none">
                                            <span className="text-[9px] font-medium mb-0.5">{ratio.label}</span>
                                            <span className="text-[8px] opacity-60 scale-90">{ratio.value}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Activity size={12} /> Output Quality
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-400 block">Resolution</label>
                                <div className="relative group">
                                    <select
                                        value={settings.resolution}
                                        onChange={(e) => handleChange('resolution', e.target.value)}
                                        className="w-full bg-[#1e1e20] border border-[#333] hover:border-[#555] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        {RESOLUTIONS.map(res => (
                                            <option key={res.value} value={res.value}>{res.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-400 block">Frame Rate</label>
                                <div className="relative group">
                                    <select
                                        value={settings.fps}
                                        onChange={(e) => handleChange('fps', parseInt(e.target.value))}
                                        className="w-full bg-[#1e1e20] border border-[#333] hover:border-[#555] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="24">24 FPS (Film)</option>
                                        <option value="30">30 FPS (TV)</option>
                                        <option value="60">60 FPS (Smooth)</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">AI Generation</div>
                        <div className="space-y-1 bg-[#1e1e20] rounded-lg border border-[#333] p-1">
                            {QUALITIES.map(q => (
                                <button
                                    key={q.value}
                                    onClick={() => handleChange('quality', q.value)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors
                                        ${settings.quality === q.value 
                                            ? 'bg-[#2a2a2d] text-white shadow-sm' 
                                            : 'text-gray-400 hover:text-gray-300 hover:bg-[#252526]'
                                        }
                                    `}
                                >
                                    <span>{q.label}</span>
                                    {settings.quality === q.value && <Check size={12} className="text-blue-500" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Project Export</div>
                        <button
                            onClick={() => {
                                exportProjectToJson();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-purple-900/20 border-0"
                        >
                            <Download size={14} />
                            Export as JSON
                        </button>
                    </div>

                    <div className="pt-4 border-t border-[#27272a] text-[10px] text-gray-600 text-center leading-relaxed">
                        Settings apply to all new generations in this project.
                        <br/>
                        Existing assets are not affected.
                    </div>

                </div>
            )}
        </div>
    );
};
