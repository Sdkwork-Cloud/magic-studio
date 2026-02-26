
import { useRouter, ROUTES } from '@sdkwork/react-core'
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Bell, User, LogOut, Plus, Check, Box,
    CreditCard, Settings, LayoutGrid, Home, Users, Tv, Wrench, Puzzle, Briefcase, ClipboardList
} from 'lucide-react';
import { useAuthStore } from '@sdkwork/react-auth';
import { useWorkspaceStore, WorkspaceProjectSelector } from '@sdkwork/react-workspace';
import { useNotificationStore, NotificationCenter } from '@sdkwork/react-notifications';
import { PricingModal } from '@sdkwork/react-vip';

const NAV_ITEMS = [
    { id: 'home', label: '首页', icon: Home, route: ROUTES.PORTAL_VIDEO },
    { id: 'community', label: '社区', icon: Users, route: ROUTES.PORTAL_COMMUNITY },
    { id: 'theater', label: '剧场', icon: Tv, route: ROUTES.PORTAL_THEATER },
    { id: 'skills', label: '技能', icon: Wrench, route: ROUTES.PORTAL_SKILLS },
    { id: 'plugins', label: '插件', icon: Puzzle, route: ROUTES.PORTAL_PLUGINS },
    { id: 'task-market', label: '任务市场', icon: Briefcase, route: ROUTES.TASK_MARKET },
];

export const PortalHeader: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { navigate, currentPath } = useRouter();
    const { unreadCount } = useNotificationStore();

    React.useEffect(() => {
        console.log('[PortalHeader] currentPath changed:', currentPath);
    }, [currentPath]);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [showPricing, setShowPricing] = useState(false);

    const activeNav = React.useMemo(() => {
        const item = NAV_ITEMS.find(i => i.route === currentPath);
        return item ? item.id : 'home';
    }, [currentPath]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const handleShowPricing = () => {
        setShowUserMenu(false);
        setShowPricing(true);
    };

    return (
        <div className="h-16 flex items-center justify-between px-8 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-colors duration-300">
            {/* 左侧导航 */}
            <div className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                console.log('[PortalHeader] Clicked nav item:', item.id, 'route:', item.route);
                                navigate(item.route);
                            }}
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
                {/* Workspace / Project Selector */}
                <WorkspaceProjectSelector 
                    variant="portal"
                    showDelete={false}
                    defaultProjectType="VIDEO"
                    compact={true}
                />

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
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.username} />
                            ) : (
                                user.username[0].toUpperCase()
                            )}
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-3 w-60 bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
                                <div className="px-4 py-4 border-b border-white/5 bg-[#222225]">
                                    <div className="text-sm font-bold text-white">{user.username}</div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</div>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    <MenuLink icon={User} label="My Profile" onClick={() => navigate(ROUTES.PROFILE)} />
                                    <MenuLink icon={ClipboardList} label="我的任务" onClick={() => navigate(ROUTES.MY_TASKS)} />
                                    <MenuLink icon={CreditCard} label="Billing & Plans" onClick={handleShowPricing} />
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

const MenuLink = ({ icon: Icon, label, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-300 hover:bg-[#2a2a2d] hover:text-white rounded-lg transition-colors"
    >
        <Icon size={14} className="opacity-70" />
        {label}
    </button>
);
