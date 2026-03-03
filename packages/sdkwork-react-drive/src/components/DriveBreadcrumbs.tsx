
import React from 'react';
import { ChevronRight, Star, Clock, Trash2, HardDrive, Cloud } from 'lucide-react';
import { useDriveStore } from '../store/driveStore';
import { pathUtils } from '@sdkwork/react-commons';

export const DriveBreadcrumbs: React.FC = () => {
    const { rootPath, currentPath, navigateTo, navigateHome } = useDriveStore();

    const handleHomeClick = () => {
        navigateHome();
    };

    // --- Virtual Paths (Special Views) ---
    if (currentPath.startsWith('virtual://')) {
        let icon = <HardDrive size={16} />;
        let label = 'Unknown';
        let colorClass = "text-gray-400";
        
        switch (currentPath) {
            case 'virtual://starred':
                icon = <Star size={16} />;
                label = 'Starred Items';
                colorClass = "text-yellow-500";
                break;
            case 'virtual://recent':
                icon = <Clock size={16} />;
                label = 'Recent Files';
                colorClass = "text-blue-400";
                break;
            case 'virtual://trash':
                icon = <Trash2 size={16} />;
                label = 'Trash';
                colorClass = "text-red-400";
                break;
        }

        return (
            <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-200">
                <button 
                    onClick={handleHomeClick}
                    className="p-1 hover:bg-[#27272a] rounded-lg text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                    title="Back to My Drive"
                >
                    <Cloud size={16} />
                    <span className="text-xs font-medium">Drive</span>
                </button>
                <ChevronRight size={12} className="text-gray-600" />
                <div className={`flex items-center gap-2 font-semibold ${colorClass} bg-[#252526] px-2 py-1 rounded-md`}>
                    {icon}
                    <span>{label}</span>
                </div>
            </div>
        );
    }

    // --- Standard Path Navigation ---
    let displayParts: string[] = [];
    let basePath = '';

    const isWindows = rootPath.includes('\\');
    const separator = isWindows ? '\\' : '/';

    // Determine segments relative to "My Drive" root
    if (rootPath && currentPath.startsWith(rootPath)) {
        basePath = rootPath;
        const relative = currentPath.substring(rootPath.length);
        displayParts = relative.split(separator).filter(Boolean);
    } else {
        // Outside of root (system files)
        basePath = isWindows ? '' : '/';
        displayParts = currentPath.split(separator).filter(Boolean);
    }

    const navigateToPart = (index: number) => {
        const partPath = displayParts.slice(0, index + 1).join(separator);
        let newPath = '';
        if (basePath === rootPath) {
            newPath = pathUtils.join(basePath, partPath);
        } else {
            newPath = basePath + partPath;
        }
        navigateTo(newPath);
    };

    return (
        <div className="flex items-center gap-0.5 text-sm text-gray-500 overflow-hidden select-none">
            <button 
                onClick={handleHomeClick}
                className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all font-medium
                    ${currentPath === rootPath 
                        ? 'text-gray-200 bg-[#27272a] cursor-default shadow-sm border border-[#333]' 
                        : 'text-gray-400 hover:text-white hover:bg-[#27272a]'
                    }
                `}
                title="My Drive Root"
            >
                <Cloud size={16} className={currentPath === rootPath ? 'text-blue-500' : ''} />
                <span className="hidden sm:inline text-xs">My Drive</span>
            </button>
            
            {displayParts.map((part, i) => {
                const isLast = i === displayParts.length - 1;
                return (
                    <React.Fragment key={`${part}-${i}`}>
                        <ChevronRight size={12} className="text-gray-600 flex-shrink-0 mx-0.5" />
                        <button 
                            onClick={() => !isLast && navigateToPart(i)}
                            disabled={isLast}
                            className={`
                                px-2.5 py-1.5 rounded-lg truncate max-w-[150px] transition-all text-xs font-medium border border-transparent
                                ${isLast 
                                    ? 'text-gray-200 bg-[#27272a] cursor-default shadow-sm border-[#333]' 
                                    : 'text-gray-400 hover:bg-[#27272a] hover:text-white'
                                }
                            `}
                        >
                            {part}
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
