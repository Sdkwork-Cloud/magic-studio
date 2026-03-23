import { useRouter, ROUTES, platform } from '@sdkwork/react-core';
import React, { useState, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    User,
    LogOut,
    Plus,
    CreditCard,
    Settings,
    LayoutGrid,
    Home,
    Users,
    Tv,
    Wrench,
    Puzzle,
    Briefcase,
    ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@sdkwork/react-auth';
import { WindowControls } from '@sdkwork/react-commons';
import { WorkspaceProjectSelector } from '@sdkwork/react-workspace';
import { useNotificationStore, NotificationCenter } from '@sdkwork/react-notifications';
import { PricingModal } from '@sdkwork/react-vip';
import { useTranslation, createLocalizedText, resolveLocalizedText } from '@sdkwork/react-i18n';

type LocalizedLabel = ReturnType<typeof createLocalizedText>;

interface NavItem {
    id: string;
    label: LocalizedLabel;
    icon: LucideIcon;
    route: string;
}

interface MenuLinkProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}

interface PortalHeaderAuthSnapshot {
    user: {
        name?: string;
        email?: string;
        avatar?: string;
    } | null;
    logout: () => Promise<void>;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: createLocalizedText('Home', '\u9996\u9875'), icon: Home, route: ROUTES.PORTAL_VIDEO },
    { id: 'community', label: createLocalizedText('Community', '\u793e\u533a'), icon: Users, route: ROUTES.PORTAL_COMMUNITY },
    { id: 'theater', label: createLocalizedText('Theater', '\u5267\u573a'), icon: Tv, route: ROUTES.PORTAL_THEATER },
    { id: 'skills', label: createLocalizedText('Skills', '\u6280\u80fd'), icon: Wrench, route: ROUTES.PORTAL_SKILLS },
    { id: 'plugins', label: createLocalizedText('Plugins', '\u63d2\u4ef6'), icon: Puzzle, route: ROUTES.PORTAL_PLUGINS },
    { id: 'task-market', label: createLocalizedText('Task Market', '\u4efb\u52a1\u5e02\u573a'), icon: Briefcase, route: ROUTES.TASK_MARKET },
];

export const PortalHeader: React.FC = () => {
    const { locale } = useTranslation();
    const { user, logout } = useAuthStore() as PortalHeaderAuthSnapshot;
    const routerContext = useRouter();
    const navigate = routerContext?.navigate || (() => {});
    const currentPath = routerContext?.currentPath || '/';
    const { unreadCount } = useNotificationStore();
    const isDesktopRuntime = platform.getPlatform() === 'desktop';

    React.useEffect(() => {
        console.log('[PortalHeader] currentPath changed:', currentPath);
    }, [currentPath]);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [showPricing, setShowPricing] = useState(false);

    const activeNav = React.useMemo(() => {
        const item = NAV_ITEMS.find((candidate) => candidate.route === currentPath);
        return item ? item.id : 'home';
    }, [currentPath]);

    const userProfile = React.useMemo(() => {
        if (!user) {
            return null;
        }
        return {
            displayName: user.name || 'User',
            email: user.email || '',
            avatar: user.avatar,
        };
    }, [user]);

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
        void logout();
        navigate(ROUTES.LOGIN);
    };

    const handleShowPricing = () => {
        setShowUserMenu(false);
        setShowPricing(true);
    };

    const myTasksLabel = resolveLocalizedText(createLocalizedText('My Tasks', '\u6211\u7684\u4efb\u52a1'), locale);

    return (
        <div className="sticky top-0 z-50 flex min-w-0 h-16 items-center bg-[#020202]/80 pl-6 pr-0 backdrop-blur-xl border-b border-white/5 transition-colors duration-300">
            <div className="relative z-10 min-w-0 flex-1 overflow-hidden pr-4">
                <div className="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                                className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                    isActive
                                        ? 'bg-[#1a1a1c] text-white border border-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1c]/50 border border-transparent'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'text-blue-400' : 'opacity-70'} />
                                {resolveLocalizedText(item.label, locale)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                className="h-full shrink-0 w-10 lg:w-14 xl:w-20"
                data-tauri-drag-region={isDesktopRuntime ? true : undefined}
            />

            <div className="relative z-10 flex h-full shrink-0 items-center gap-5 pr-4">
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
                            {userProfile?.avatar ? (
                                <img src={userProfile.avatar} className="w-full h-full object-cover" alt={userProfile.displayName} />
                            ) : (
                                (userProfile?.displayName || 'U')[0].toUpperCase()
                            )}
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-3 w-60 bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
                                <div className="px-4 py-4 border-b border-white/5 bg-[#222225]">
                                    <div className="text-sm font-bold text-white">{userProfile?.displayName}</div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{userProfile?.email}</div>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                    <MenuLink icon={User} label="My Profile" onClick={() => navigate(ROUTES.PROFILE)} />
                                    <MenuLink icon={ClipboardList} label={myTasksLabel} onClick={() => navigate(ROUTES.MY_TASKS)} />
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

            {isDesktopRuntime && (
                <div className="relative z-10 h-full shrink-0">
                    <WindowControls />
                </div>
            )}

            {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
        </div>
    );
};

const MenuLink: React.FC<MenuLinkProps> = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-gray-300 hover:bg-[#2a2a2d] hover:text-white rounded-lg transition-colors"
    >
        <Icon size={14} className="opacity-70" />
        {label}
    </button>
);
