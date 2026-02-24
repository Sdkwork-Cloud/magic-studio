
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Bell, User, LogOut, Plus, Check, Box,
    CreditCard, Settings, LayoutGrid, Briefcase
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { NotificationCenter } from '../../../components/Notification/NotificationCenter';

export const PortalHeader: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { navigate } = useRouter();
    const { unreadCount } = useNotificationStore();
    
    // Project State
    const { currentWorkspace, currentProject, setCurrentProject, addProject } = useWorkspaceStore();
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const projectMenuRef = useRef<HTMLDivElement>(null);

    // User Menu State
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Notification State
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

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
            {/* Left Spacer */}
            <div className="flex-1">
                 {/* Breadcrumbs or Title could go here */}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-5">
                
                {/* 1. Project Switcher */}
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
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e20] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
                            <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center border-b border-white/5 bg-[#222225]">
                                <span>Active Workspace</span>
                                <span className="bg-[#2a2a2d] px-1.5 rounded text-gray-400">{projects.length}</span>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                {projects.map(p => (
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

                {/* 2. Credits Badge */}
                <div className="hidden md:flex items-center gap-2 bg-[#1a1a1c] px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors group cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">880 Credits</span>
                    <Plus size={10} className="text-gray-500 group-hover:text-white transition-colors ml-1" />
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* 3. Trade Center / Order Hub */}
                <button
                    onClick={() => navigate(ROUTES.TRADE_CENTER)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1a1a1c] border border-transparent hover:border-white/10 transition-all group"
                >
                    <Briefcase size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white">接单中心</span>
                </button>

                <div className="w-px h-6 bg-white/10" />

                {/* 4. Notifications */}
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

                {/* 4. User Profile */}
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
                                    <MenuLink icon={Briefcase} label="接单中心" onClick={() => navigate(ROUTES.TRADE_CENTER)} />
                                    <MenuLink icon={CreditCard} label="Billing & Plans" onClick={() => navigate(ROUTES.VIP)} />
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
