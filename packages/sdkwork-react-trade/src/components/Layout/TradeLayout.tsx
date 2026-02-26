import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Bell, User, LogOut, Plus, Check, Box,
    CreditCard, Settings, LayoutGrid, Home, Users, Tv, Wrench, Puzzle, Briefcase, ClipboardList,
    Sparkles, Crown, Compass, FolderOpen, Video, Image as ImageIcon, Music,
    Zap, BookOpen, Scissors, Volume2, Mic, Smile
} from 'lucide-react';
import { useRouter, ROUTES } from '@sdkwork/react-core';
import { useAuthStore } from '@sdkwork/react-auth';
import { useWorkspaceStore } from '@sdkwork/react-workspace';
import { useNotificationStore, NotificationCenter } from '@sdkwork/react-notifications';
import { PricingModal } from '@sdkwork/react-vip';

const HEADER_NAV_ITEMS = [
    { id: 'home', label: '首页', icon: Home, route: ROUTES.PORTAL_VIDEO },
    { id: 'community', label: '社区', icon: Users, route: ROUTES.PORTAL_COMMUNITY },
    { id: 'theater', label: '剧场', icon: Tv, route: ROUTES.PORTAL_THEATER },
    { id: 'skills', label: '技能', icon: Wrench, route: ROUTES.PORTAL_SKILLS },
    { id: 'plugins', label: '插件', icon: Puzzle, route: ROUTES.PORTAL_PLUGINS },
    { id: 'task-market', label: '任务市场', icon: Briefcase, route: ROUTES.TASK_MARKET },
];

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  badge?: string;
  accent?: string;
}

interface SidebarGroup {
  title: string | null;
  items: SidebarItem[];
}

const SIDEBAR_NAV_GROUPS: SidebarGroup[] = [
    {
        title: null,
        items: [
            { id: 'home', label: '首页', icon: Home, route: ROUTES.PORTAL },
            { id: 'discover', label: '发现', icon: Compass, route: ROUTES.PORTAL_DISCOVER },
            { id: 'assets', label: '资产', icon: FolderOpen, route: ROUTES.ASSETS },
        ]
    },
    {
        title: '工作室',
        items: [
            { id: 'quick-short', label: '快剪', icon: Zap, route: ROUTES.FILM, badge: 'Hot', accent: 'text-orange-400' },
            { id: 'magic-cut', label: '智能剪辑', icon: Scissors, route: ROUTES.MAGIC_CUT, badge: 'New', accent: 'text-red-400' },
            { id: 'canvas', label: '画布', icon: LayoutGrid, route: ROUTES.CANVAS, badge: 'Beta', accent: 'text-blue-400' },
            { id: 'notes', label: '笔记', icon: BookOpen, route: ROUTES.NOTES },
        ]
    },
    {
        title: '生成器',
        items: [
            { id: 'video', label: '视频', icon: Video, route: ROUTES.VIDEO },
            { id: 'image', label: '图片', icon: ImageIcon, route: ROUTES.IMAGE },
            { id: 'human', label: '数字人', icon: Smile, route: ROUTES.CHARACTER },
        ]
    },
    {
        title: '音频',
        items: [
            { id: 'music', label: '音乐', icon: Music, route: ROUTES.MUSIC },
            { id: 'speech', label: '语音', icon: Volume2, route: ROUTES.AUDIO },
            { id: 'voice', label: '配音', icon: Mic, route: ROUTES.VOICE },
        ]
    }
];

const TradeHeader: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { navigate, currentPath } = useRouter();
    const { unreadCount } = useNotificationStore();
    const { currentWorkspace, currentProject, setCurrentProject, addProject } = useWorkspaceStore();
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const projectMenuRef = useRef<HTMLDivElement>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const [showPricing, setShowPricing] = useState(false);

    const activeNav = React.useMemo(() => {
        const item = HEADER_NAV_ITEMS.find(i => i.route === currentPath);
        return item ? item.id : 'home';
    }, [currentPath]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
                setShowProjectMenu(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateProject = () => {
        const name = prompt("Project Name:");
        if (name) {
            addProject(name, 'VIDEO', 'New video project');
            setShowProjectMenu(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const projects = currentWorkspace?.projects || [];

    return (
        <div className="h-16 flex items-center justify-between px-8 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-1">
                {HEADER_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.route)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                isActive
                                    ? 'bg-[#1a1a1c] text-white border border-white/10'
                                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1c]/50 border border-transparent'
                            }`}
                        >
                            <Icon size={16} className={isActive ? 'text-blue-400' : 'opacity-70'} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-5">
                <div className="relative" ref={projectMenuRef}>
                    <button
                        onClick={() => setShowProjectMenu(!showProjectMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1a1a1c] border border-transparent hover:border-white/10 transition-all group"
                    >
                        <span className="text-xs font-semibold text-gray-300 group-hover:text-white tracking-wide">
                            {currentProject ? currentProject.name : "Select Project"}
                        </span>
                        <ChevronDown size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                    </button>

                    {showProjectMenu && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e20] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                            <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center border-b border-white/5 bg-[#222225]">
                                <span>Active Workspace</span>
                                <span className="bg-[#2a2a2d] px-1.5 rounded text-gray-400">{projects.length}</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto p-1 space-y-0.5">
                                {projects.map((p: any) => (
                                    <button
                                        key={p.uuid}
                                        onClick={() => { setCurrentProject(p); setShowProjectMenu(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${currentProject?.uuid === p.uuid ? 'bg-[#2a2a2d] text-white' : 'text-gray-400 hover:bg-[#252528] hover:text-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1 rounded ${currentProject?.uuid === p.uuid ? 'bg-blue-500/20 text-blue-400' : 'bg-[#333] text-gray-500'}`}>
                                                <Box size={12} />
                                            </div>
                                            <span className="truncate max-w-[130px] font-medium">{p.name}</span>
                                        </div>
                                        {currentProject?.uuid === p.uuid && <Check size={12} className="text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                            <div className="p-1 border-t border-white/5 mt-1">
                                <button
                                    onClick={handleCreateProject}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg transition-colors border border-dashed border-blue-500/30 hover:border-blue-500/50"
                                >
                                    <Plus size={12} /> Create New Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className="hidden md:flex items-center gap-2 bg-[#1a1a1c] px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors group cursor-pointer"
                    onClick={() => setShowPricing(true)}
                >
                    <div className="w-1.5 h-1.5 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">880 Credits</span>
                    <Plus size={10} className="text-gray-500 group-hover:text-white transition-colors ml-1" />
                </div>

                <div className="w-px h-6 bg-white/10" />

                <div className="relative" ref={notificationRef}>
                    <button
                        className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-[#1a1a1c] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1c]'}`}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020202]" />
                        )}
                    </button>
                    {showNotifications && (
                        <NotificationCenter onClose={() => setShowNotifications(false)} />
                    )}
                </div>

                {user ? (
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white/10 hover:ring-white/30 transition-all overflow-hidden"
                        >
                            {user.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                            ) : (
                                user.name[0].toUpperCase()
                            )}
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-3 w-60 bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl py-1 z-50">
                                <div className="px-4 py-4 border-b border-white/5 bg-[#222225]">
                                    <div className="text-sm font-bold text-white">{user.name}</div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</div>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    <MenuLink icon={User} label="My Profile" onClick={() => navigate(ROUTES.PROFILE)} />
                                    <MenuLink icon={ClipboardList} label="我的任务" onClick={() => navigate(ROUTES.MY_TASKS)} />
                                    <MenuLink icon={CreditCard} label="Billing & Plans" onClick={() => setShowPricing(true)} />
                                    <MenuLink icon={LayoutGrid} label="Switch Workspace" onClick={() => {}} />
                                    <MenuLink icon={Settings} label="Preferences" onClick={() => navigate(ROUTES.SETTINGS)} />
                                </div>
                                <div className="h-px bg-white/5 mx-2 my-1" />
                                <div className="p-1.5">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => navigate(ROUTES.LOGIN)}
                        className="px-5 py-2 bg-white text-black hover:bg-gray-200 rounded-full text-xs font-bold transition-all shadow-lg hover:scale-105"
                    >
                        Sign In
                    </button>
                )}
            </div>

            {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
        </div>
    );
};

const MenuLink = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-300 hover:bg-[#2a2a2d] hover:text-white rounded-lg transition-colors"
    >
        <Icon size={14} className="opacity-70" />
        {label}
    </button>
);

const TradeSidebar: React.FC = () => {
    const { navigate, currentPath } = useRouter();
    const [showPricing, setShowPricing] = useState(false);

    return (
        <div className="w-[260px] h-full bg-[#050505] flex flex-col border-r border-[#1a1a1a] relative z-50 select-none">
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

            <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar space-y-8">
                {SIDEBAR_NAV_GROUPS.map((group, groupIdx) => (
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
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                    )}

                                    <Icon
                                        size={18}
                                        className={`transition-colors ${isActive ? (item.accent || 'text-indigo-400') : 'text-gray-500 group-hover/item:text-gray-400'}`}
                                        strokeWidth={isActive ? 2 : 1.5}
                                    />
                                    <span className="flex-1 text-left truncate">{item.label}</span>

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

            <div className="flex-none p-4 pt-0">
                <div
                    className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#1a1a1c] to-[#111] border border-white/5 p-4 group cursor-pointer hover:border-white/10 transition-all duration-300 mb-4 shadow-lg"
                    onClick={() => setShowPricing(true)}
                >
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
                        <div className="text-xs font-bold text-white mb-0.5">升级到专业版</div>
                        <div className="text-[10px] text-gray-500 leading-relaxed mb-3 line-clamp-2">
                            解锁更多功能和额度
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); setShowPricing(true); }}
                            className="w-full py-1.5 bg-white text-black text-[10px] font-bold rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 shadow-md group-hover:shadow-lg hover:scale-[1.02] active:scale-95 duration-200"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <button
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-300 transition-colors p-1 rounded hover:bg-[#1a1a1c]"
                    >
                        <Settings size={12} /> 设置
                    </button>
                    <div className="w-px h-3 bg-[#1a1a1c]" />
                    <button
                        onClick={() => navigate(ROUTES.LOGIN)}
                        className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-[#1a1a1c]"
                    >
                        <LogOut size={12} /> 退出
                    </button>
                </div>
            </div>

            {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
        </div>
    );
};

interface TradeLayoutProps {
    children: React.ReactNode;
}

export const TradeLayout: React.FC<TradeLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-full bg-[#0a0a0a]">
            <TradeSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TradeHeader />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export { TradeHeader, TradeSidebar };
