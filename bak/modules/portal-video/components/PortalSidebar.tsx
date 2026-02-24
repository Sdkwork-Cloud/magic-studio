
import React from 'react';
import { 
    Home, Compass, FolderOpen, Video, Image as ImageIcon, 
    Bot, Music, Clapperboard, 
    Sparkles, Crown, Volume2, Mic, ChevronRight,
    Layout, BookOpen, Scissors, Settings, LogOut,
    CreditCard, Zap, Smile
} from 'lucide-react';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { useTranslation } from '../../../i18n';

export const PortalSidebar: React.FC = () => {
    const { navigate, currentPath } = useRouter();
    const { t } = useTranslation();

    const NAV_GROUPS = [
        {
            title: null, // Top level: Platform
            items: [
                { id: 'home', label: t('portal.sidebar.home'), icon: Home, route: ROUTES.PORTAL },
                { id: 'discover', label: t('portal.sidebar.discover'), icon: Compass, route: ROUTES.PORTAL_DISCOVER },
                { id: 'assets', label: t('portal.sidebar.assets'), icon: FolderOpen, route: ROUTES.ASSETS },
            ]
        },
        {
            title: t('portal.sidebar.group_studio'),
            items: [
                { id: 'quick-short', label: t('portal.sidebar.quick_short'), icon: Zap, route: ROUTES.FILM, badge: 'Hot', accent: 'text-orange-400' },
                { id: 'magic-cut', label: t('sidebar.magic_cut'), icon: Scissors, route: ROUTES.MAGIC_CUT, badge: 'New', accent: 'text-red-400' },
                { id: 'canvas', label: t('canvas.title'), icon: Layout, route: ROUTES.CANVAS, badge: 'Beta', accent: 'text-blue-400' },
                { id: 'notes', label: t('portal.sidebar.notes'), icon: BookOpen, route: ROUTES.NOTES },
            ]
        },
        {
            title: t('portal.sidebar.group_generators'),
            items: [
                { id: 'video', label: t('portal.sidebar.video'), icon: Video, route: ROUTES.VIDEO },
                { id: 'image', label: t('portal.sidebar.image'), icon: ImageIcon, route: ROUTES.IMAGE },
                { id: 'human', label: t('portal.sidebar.human'), icon: Smile, route: ROUTES.CHARACTER },
            ]
        },
        {
            title: t('portal.sidebar.group_audio'),
            items: [
                { id: 'music', label: t('portal.sidebar.music'), icon: Music, route: ROUTES.MUSIC },
                { id: 'speech', label: t('portal.sidebar.speech'), icon: Volume2, route: ROUTES.AUDIO },
                { id: 'voice', label: t('portal.sidebar.voice'), icon: Mic, route: ROUTES.VOICE },
            ]
        }
    ];

    return (
        <div className="w-[260px] h-full bg-[#050505] flex flex-col border-r border-[#1a1a1a] relative z-50 select-none">
            {/* 1. Brand Header */}
            <div className="flex-none p-6 pb-4 cursor-pointer group" onClick={() => navigate(ROUTES.HOME)}>
                 <div className="flex items-center gap-3">
                     <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/10">
                         <div className="absolute inset-0 rounded-lg bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                         <Sparkles size={16} className="text-white relative z-10" fill="currentColor" />
                     </div>
                     <div className="flex flex-col justify-center">
                         <span className="text-lg font-bold text-white tracking-tight leading-none">Magic Studio</span>
                         <span className="text-[9px] text-gray-500 font-medium tracking-[0.2em] mt-0.5 group-hover:text-indigo-400 transition-colors">CREATIVE</span>
                     </div>
                 </div>
            </div>

            {/* 2. Navigation Area */}
            <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar space-y-8">
                {NAV_GROUPS.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1">
                        {group.title && (
                            <div className="px-3 mb-2 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{group.title}</span>
                                <div className="h-px bg-[#1a1a1a] flex-1" />
                            </div>
                        )}
                        
                        {group.items.map(item => {
                            const isActive = currentPath === item.route;
                            const Icon = item.icon;
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.route)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group/item relative
                                        ${isActive 
                                            ? 'bg-[#1e1e20] text-white shadow-sm ring-1 ring-white/5' 
                                            : 'text-gray-500 hover:text-gray-200 hover:bg-[#1a1a1c]'
                                        }
                                    `}
                                >
                                    {/* Active Indicator Bar */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                    )}

                                    <Icon 
                                        size={18} 
                                        className={`transition-colors ${isActive ? (item.accent || 'text-indigo-400') : 'text-gray-500 group-hover/item:text-gray-400'}`} 
                                        strokeWidth={isActive ? 2 : 1.5}
                                    />
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                    
                                    {/* Badges */}
                                    {item.badge && (
                                        <span className={`
                                            text-[9px] font-bold px-1.5 py-0.5 rounded border 
                                            ${isActive 
                                                ? 'bg-[#2a2a2c] text-white border-white/10' 
                                                : 'bg-[#1a1a1c] text-gray-500 border-[#27272a] group-hover/item:text-gray-300'
                                            }
                                        `}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* 3. Footer / Pro Card */}
            <div className="flex-none p-4 pt-0">
                {/* Pro Upgrade Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#1a1a1c] to-[#111] border border-white/5 p-4 group cursor-pointer hover:border-white/10 transition-all duration-300 mb-4 shadow-lg">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/5 blur-2xl rounded-full group-hover:bg-purple-500/10 transition-colors" />
                    
                    <div className="flex items-start justify-between relative z-10 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#252526] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                            <Crown size={14} className="text-yellow-500 fill-yellow-500/20" />
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400 group-hover:text-white transition-colors">
                            PRO
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="text-xs font-bold text-white mb-0.5">{t('portal.sidebar.upgrade_title')}</div>
                        <div className="text-[10px] text-gray-500 leading-relaxed mb-3 line-clamp-2">
                            {t('portal.sidebar.upgrade_desc')}
                        </div>
                        
                        <button className="w-full py-1.5 bg-white text-black text-[10px] font-bold rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 shadow-md group-hover:shadow-lg hover:scale-[1.02] active:scale-95 duration-200">
                            Upgrade Now <ChevronRight size={10} />
                        </button>
                    </div>
                </div>
                
                {/* Bottom Links */}
                <div className="flex items-center justify-between px-1">
                    <button 
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-300 transition-colors p-1 rounded hover:bg-[#1a1a1c]"
                    >
                        <Settings size={12} /> {t('portal.sidebar.settings')}
                    </button>
                    <div className="w-px h-3 bg-[#1a1a1c]" />
                    <button 
                        onClick={() => navigate(ROUTES.LOGIN)}
                        className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-[#1a1a1c]"
                    >
                        <LogOut size={12} /> {t('portal.sidebar.logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};
