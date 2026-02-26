
import React, { useState } from 'react';
import { 
    Download, CheckCircle2, AlertCircle, File, X, Trash2, FolderOpen, 
    Search, Image as ImageIcon, Video, Music, FileCode, Archive, Box
} from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { platform } from '@sdkwork/react-core';
import { pathUtils } from '@sdkwork/react-commons';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileIcon = (filename: string) => {
    const ext = pathUtils.extname(filename).toLowerCase();
    
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) 
        return <ImageIcon size={18} className="text-purple-400" />;
    
    if (['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) 
        return <Video size={18} className="text-pink-400" />;
    
    if (['.mp3', '.wav', '.ogg', '.flac'].includes(ext)) 
        return <Music size={18} className="text-cyan-400" />;
    
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) 
        return <Archive size={18} className="text-yellow-400" />;
    
    if (['.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json'].includes(ext)) 
        return <FileCode size={18} className="text-blue-400" />;

    return <File size={18} className="text-gray-400" />;
};

export const DownloadsPanel: React.FC = () => {
    const { downloads, clearDownloads } = useBrowserStore();
    const [search, setSearch] = useState('');

    const handleOpen = (path?: string) => {
        if (path) platform.openExternal(`file://${path}`); // Attempt to open file
    };

    const handleShowInFolder = (path?: string) => {
        if (path) platform.showItemInFolder(path);
    };

    const filteredDownloads = downloads.filter(d => 
        d.filename.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-[360px] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[500px]">
            {/* Header */}
            <div className="flex-none p-3 border-b border-[#333] bg-[#252526]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1">Downloads</h3>
                    {downloads.length > 0 && (
                        <button 
                            onClick={clearDownloads}
                            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-[#333]"
                        >
                            Clear All
                        </button>
                    )}
                </div>
                
                {/* Search */}
                <div className="relative group">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search downloads..."
                        className="w-full bg-[#18181b] border border-[#333] text-gray-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                    />
                </div>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[100px]">
                {downloads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500 select-none">
                        <div className="w-12 h-12 bg-[#252526] rounded-full flex items-center justify-center mb-3">
                            <Box size={24} className="opacity-20" />
                        </div>
                        <p className="text-xs">No downloads history</p>
                    </div>
                ) : filteredDownloads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500">No matching results</div>
                ) : (
                    filteredDownloads.map(item => {
                        const isDownloading = item.status === 'downloading';
                        const isCompleted = item.status === 'completed';
                        const isFailed = item.status === 'failed';

                        return (
                            <div 
                                key={item.id}
                                className="group relative flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a2c] transition-colors border border-transparent hover:border-[#333]"
                            >
                                {/* Icon Box */}
                                <div className="w-10 h-10 bg-[#18181b] rounded-lg border border-[#333] flex items-center justify-center shrink-0">
                                    {isFailed ? (
                                        <AlertCircle size={18} className="text-red-500" />
                                    ) : (
                                        getFileIcon(item.filename)
                                    )}
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div 
                                        className={`text-sm font-medium truncate cursor-pointer ${isCompleted ? 'text-gray-200 hover:text-blue-400' : 'text-gray-300'}`}
                                        title={item.filename}
                                        onClick={() => isCompleted && handleOpen(item.path)}
                                    >
                                        {item.filename}
                                    </div>
                                    
                                    {/* Status Line */}
                                    <div className="flex items-center justify-between mt-0.5 h-3">
                                        {isFailed ? (
                                            <span className="text-[10px] text-red-400 truncate">{item.error || 'Download failed'}</span>
                                        ) : isDownloading ? (
                                            <div className="w-full flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-[#333] rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-500 transition-all duration-200"
                                                        style={{ width: `${item.totalBytes ? (item.receivedBytes / item.totalBytes) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-blue-400 font-mono w-8 text-right">
                                                    {item.totalBytes ? Math.round((item.receivedBytes / item.totalBytes) * 100) : 0}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-500">
                                                {formatBytes(item.totalBytes || item.receivedBytes)}
                                                {isCompleted && <span className="ml-2 text-green-500/50">Done</span>}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-[#2a2a2c] pl-2 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.2)]">
                                    {isCompleted && (
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleShowInFolder(item.path); }}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                                            title="Show in Folder"
                                         >
                                             <FolderOpen size={14} />
                                         </button>
                                    )}
                                    {isDownloading && (
                                         <button 
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#333] rounded transition-colors"
                                            title="Cancel"
                                            // Implement cancel logic in store
                                         >
                                             <X size={14} />
                                         </button>
                                    )}
                                    <button 
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#333] rounded transition-colors"
                                        title="Remove from list"
                                        // Implement specific remove in store (currently cleared by Clear All)
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
