
import { driveService } from '../services/driveService'
import React, { useState, useRef, useEffect } from 'react';
import { HardDrive, Clock, Star, Trash2, Cloud, Plus, FolderPlus, FileUp } from 'lucide-react';
import { useDriveStore } from '../store/driveStore';
import { useTranslation } from '@sdkwork/react-i18n';

export const DriveSidebar: React.FC = () => {
    const { stats, createFolder, uploadFiles, navigateTo, currentPath } = useDriveStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    // Calculate percentage
    const percent = stats ? Math.min(100, (stats.usedBytes / stats.totalBytes) * 100) : 0;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNewFolder = () => {
        setIsMenuOpen(false);
        const name = prompt(t('drive.sidebar.folder_name') + ':');
        if(name) createFolder(name);
    };

    const handleUpload = () => {
        setIsMenuOpen(false);
        uploadFiles();
    };
    
    const goHome = async () => {
        const home = await driveService.getDefaultPath();
        navigateTo(home);
    };

    return (
        <div className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col p-4 select-none">
            {/* New Button with Dropdown */}
            <div className="relative mb-6" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-semibold shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span className="text-sm">{t('drive.sidebar.new')}</span>
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#252526] border border-[#333] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button 
                            onClick={handleNewFolder}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-[#333] hover:text-white transition-colors text-left"
                        >
                            <FolderPlus size={16} className="text-yellow-500" />
                            {t('drive.sidebar.new_folder')}
                        </button>
                        <div className="h-[1px] bg-[#333]" />
                        <button 
                            onClick={handleUpload}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-[#333] hover:text-white transition-colors text-left"
                        >
                            <FileUp size={16} className="text-blue-500" />
                            {t('drive.sidebar.file_upload')}
                        </button>
                    </div>
                )}
            </div>

            {/* Nav Links */}
            <div className="flex-1 space-y-1">
                <SidebarLink 
                    icon={<HardDrive size={18} />} 
                    label={t('drive.sidebar.my_drive')} 
                    active={!currentPath.startsWith('virtual://')} 
                    onClick={goHome}
                />
                <SidebarLink 
                    icon={<Star size={18} />} 
                    label={t('drive.sidebar.starred')} 
                    active={currentPath === 'virtual://starred'} 
                    onClick={() => navigateTo('virtual://starred')}
                />
                <SidebarLink 
                    icon={<Clock size={18} />} 
                    label={t('drive.sidebar.recent')} 
                    active={currentPath === 'virtual://recent'} 
                    onClick={() => navigateTo('virtual://recent')}
                />
                <SidebarLink 
                    icon={<Trash2 size={18} />} 
                    label={t('drive.sidebar.trash')} 
                    active={currentPath === 'virtual://trash'} 
                    onClick={() => navigateTo('virtual://trash')}
                />
            </div>

            {/* Storage Stats */}
            <div className="mt-auto pt-6 border-t border-[#27272a]">
                <div className="flex items-center gap-2 text-gray-200 mb-2">
                    <Cloud size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">{t('drive.sidebar.storage')}</span>
                </div>
                <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${percent}%` }} 
                    />
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{formatSize(stats?.usedBytes || 0)} {t('drive.sidebar.used')}</span>
                    <button className="text-blue-400 hover:text-blue-300 transition-colors">{t('drive.sidebar.upgrade')}</button>
                </div>
            </div>
        </div>
    );
};

const SidebarLink = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${active 
                ? 'bg-blue-500/10 text-blue-400 shadow-sm' 
                : 'text-gray-400 hover:bg-[#27272a] hover:text-gray-200'
            }
        `}
    >
        <span className={`transition-colors ${active ? 'text-blue-400' : 'text-gray-500'}`}>{icon}</span>
        {label}
    </button>
);

const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
