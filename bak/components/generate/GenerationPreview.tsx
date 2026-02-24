
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Download, ChevronLeft, ChevronRight, 
    ThumbsUp, ThumbsDown, Share2, Info,
    Maximize2, Edit3, Trash2, Film, Image as ImageIcon, Zap, RefreshCw, Wand2,
    Copy, Check, Play, LayoutTemplate, Brush,
    Move, Eraser, Mic, Repeat2, MessageSquare, UserPlus
} from 'lucide-react';
import { ImageTask } from '../../modules/image/entities/image.entity';
// Removed store dependency to allow usage in Gallery/Portal
// import { useImageStore } from '../store/imageStore'; 
import { PromptText } from './PromptText';
import { platform } from '../../platform';
import { ImageGridEditorModal } from '../../modules/image/components/ImageGridEditorModal';
import { ImageCanvasEditorModal } from '../../modules/image/components/ImageCanvasEditorModal';
import { useTranslation } from '../../i18n';
import { useRouter } from '../../router';
import { ROUTES } from '../../router/routes';
import { remixService } from '../../services/remix/remixService';
import { MediaResourceType } from '../../types';
import { GalleryItem } from '../../types/gallery';
import { useAssetUrl } from '../../hooks/useAssetUrl'; // Added Hook

export type PreviewMode = 'creation' | 'view';

interface GenerationPreviewProps {
    initialTaskId?: string; // For Creation Mode
    tasks?: ImageTask[]; // For Creation Mode history
    
    galleryItem?: GalleryItem; // For View Mode
    relatedItems?: GalleryItem[]; // For View Mode navigation
    
    mode?: PreviewMode;
    onClose: () => void;
    onReuse?: (task: ImageTask) => void;
    
    isOwner?: boolean; // If current user owns the item
}

export const GenerationPreview: React.FC<GenerationPreviewProps> = ({ 
    initialTaskId, tasks = [], 
    galleryItem, relatedItems = [],
    mode = 'creation',
    onClose, onReuse,
    isOwner = false
}) => {
    const { t } = useTranslation();
    const { navigate } = useRouter();
    
    // Normalized State
    const [activeIndex, setActiveIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    
    // Modals
    const [showGridEditor, setShowGridEditor] = useState(false);
    const [showCanvasEditor, setShowCanvasEditor] = useState(false);

    // --- Data Normalization ---
    // We map both ImageTask and GalleryItem to a unified internal structure
    
    const items = useMemo(() => {
        if (mode === 'creation') {
            return tasks.reverse(); // Newest first
        } else {
            // View Mode: galleryItem is the focus, relatedItems are neighbors
            if (!galleryItem) return [];
            // If related items provided, find index, else just single item
            if (relatedItems.length > 0) return relatedItems;
            return [galleryItem];
        }
    }, [mode, tasks, galleryItem, relatedItems]);

    // Current Active Item
    const [currentId, setCurrentId] = useState<string>(
        mode === 'creation' ? (initialTaskId || '') : (galleryItem?.id || '')
    );

    // Find current object
    const currentItem = items.find(i => i.id === currentId);
    
    // Derived Properties
    const isVideo = useMemo(() => {
        if (!currentItem) return false;
        if (mode === 'creation') {
            const task = currentItem as ImageTask;
            const url = task.results?.[0]?.url || '';
            // Simple check on string for logic, but display will use resolved URL
            return url.startsWith('data:video') || url.includes('.mp4');
        } else {
            const item = currentItem as GalleryItem;
            return item.type === 'video';
        }
    }, [currentItem, mode]);

    const rawUrl = useMemo(() => {
        if (!currentItem) return '';
        if (mode === 'creation') {
            const task = currentItem as ImageTask;
            return task.results?.[activeIndex]?.url || '';
        } else {
            const item = currentItem as GalleryItem;
            // For video in gallery, we show videoUrl if available, else url (thumbnail)
            if (item.type === 'video' && item.videoUrl) return item.videoUrl;
            return item.url;
        }
    }, [currentItem, mode, activeIndex]);

    // Resolve URL (for assets:// support)
    const { url: displayUrl } = useAssetUrl(rawUrl);

    const displayPrompt = useMemo(() => {
        if (!currentItem) return '';
        if (mode === 'creation') return (currentItem as ImageTask).config.prompt;
        return (currentItem as GalleryItem).prompt;
    }, [currentItem, mode]);

    // --- Handlers ---

    const handleNext = () => {
        const idx = items.findIndex(i => i.id === currentId);
        if (idx < items.length - 1) {
            setCurrentId(items[idx + 1].id);
            setActiveIndex(0);
        }
    };

    const handlePrev = () => {
        const idx = items.findIndex(i => i.id === currentId);
        if (idx > 0) {
            setCurrentId(items[idx - 1].id);
            setActiveIndex(0);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentId, items]);

    const handleRemix = () => {
        if (!currentItem) return;
        
        let intent: any = {};

        if (mode === 'creation') {
            // Internal reuse
            if (onReuse) onReuse(currentItem as ImageTask);
            return;
        } else {
            // Public Gallery Remix
            const item = currentItem as GalleryItem;
            
            const mediaRefs = [];
            // If it's an image, use it as reference
            if (item.type === 'image') {
                mediaRefs.push({ url: item.url, type: MediaResourceType.IMAGE, role: 'reference' as const });
            }

            intent = {
                targetModule: item.type === 'video' ? 'video' : 'image',
                prompt: item.prompt,
                modelId: item.model,
                aspectRatio: item.aspectRatio,
                mediaReferences: mediaRefs,
                sourceName: item.title,
                sourceAuthor: item.author.name,
                modeHint: item.type === 'video' ? 'text_to_video' : 'text_to_image'
            };
        }

        remixService.setIntent(intent);
        if (intent.targetModule === 'video') navigate(ROUTES.VIDEO);
        else navigate(ROUTES.IMAGE);
        onClose();
    };

    const handleEditorSave = (newUrl: string) => {
        const a = document.createElement('a');
        a.href = newUrl;
        a.download = `edited-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!currentItem) return null;

    // --- Render Logic ---

    return createPortal(
        <div className="fixed inset-0 z-[1500] flex bg-black/98 backdrop-blur-xl animate-in fade-in duration-300 text-gray-200 overflow-hidden font-sans">
            
            {/* LEFT COLUMN: Context / History / Related (Hidden on Mobile) */}
            <div className={`w-[80px] xl:w-[280px] flex-none bg-[#09090b]/80 border-r border-white/5 flex flex-col hidden md:flex transition-all duration-300`}>
                <div className="h-16 flex items-center px-4 xl:px-6 border-b border-white/5 font-bold text-xs text-gray-500 uppercase tracking-wider bg-[#09090b]">
                    {mode === 'creation' ? 'History' : 'More from Gallery'}
                </div>
                <div className="flex-1 overflow-y-auto p-2 xl:p-3 space-y-2 custom-scrollbar">
                    {items.map(item => {
                        const isActive = item.id === currentId;
                        return (
                            <SidebarTaskItem 
                                key={item.id}
                                item={item}
                                mode={mode}
                                isActive={isActive}
                                onClick={() => setCurrentId(item.id)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* CENTER COLUMN: Main Stage */}
            <div className="flex-1 flex flex-col relative min-w-0 bg-[#050505] z-0">
                
                {/* Floating Header */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
                     <div className="flex items-center gap-4 pointer-events-auto">
                        <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] font-bold text-gray-400 border border-white/5 uppercase tracking-wider flex items-center gap-2">
                            {isVideo ? <Film size={10} /> : <ImageIcon size={10} />}
                            {mode === 'creation' ? (currentItem as ImageTask).config.aspectRatio : (currentItem as GalleryItem).aspectRatio}
                        </div>
                     </div>

                     <div className="flex items-center gap-2 pointer-events-auto">
                         <TooltipButton icon={<ThumbsUp size={18} />} tooltip="Like" />
                         <div className="w-[1px] h-6 bg-white/10 mx-1" />
                         <TooltipButton icon={<Download size={18} />} onClick={() => { /* Download logic */ }} tooltip="Download" />
                         <TooltipButton icon={<Share2 size={18} />} tooltip="Share" />
                     </div>
                </div>

                {/* Viewport */}
                <div 
                    className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden relative"
                    onClick={() => !isVideo && setIsZoomed(!isZoomed)}
                >
                    {/* Background Blur */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-20 blur-3xl scale-110">
                        {displayUrl && <img src={displayUrl} className="w-full h-full object-cover" />}
                    </div>

                    <div className={`relative z-10 transition-all duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-default'}`}>
                        {displayUrl ? (
                            isVideo ? (
                                <video 
                                    src={displayUrl} 
                                    className="max-w-full max-h-[85vh] shadow-2xl shadow-black/50 rounded-lg outline-none"
                                    controls
                                    autoPlay
                                    loop
                                />
                            ) : (
                                <img 
                                    src={displayUrl} 
                                    className={`max-w-full max-h-[85vh] object-contain shadow-2xl shadow-black/50 rounded-lg ${!isZoomed ? 'cursor-zoom-in' : ''}`}
                                    alt="Preview"
                                />
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <ImageIcon size={48} className="opacity-20" />
                                <span>Loading preview...</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Nav Arrows */}
                    <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-black/20 rounded-full transition-all pointer-events-auto">
                        <ChevronLeft size={32} strokeWidth={1.5} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-black/20 rounded-full transition-all pointer-events-auto">
                        <ChevronRight size={32} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: Inspector */}
            <div className="w-[360px] flex-none bg-[#111113] border-l border-white/10 flex flex-col z-20 shadow-2xl">
                
                {/* Close Header */}
                <div className="flex-none h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Info size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Info</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* View Mode: Author Info */}
                    {mode === 'view' && (
                        <div className="p-6 border-b border-white/5">
                             <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-2 ring-white/10 ${(currentItem as GalleryItem).author.color || 'bg-blue-600'}`}>
                                         {(currentItem as GalleryItem).author.avatar ? (
                                             <img src={(currentItem as GalleryItem).author.avatar} className="w-full h-full object-cover" />
                                         ) : (
                                             (currentItem as GalleryItem).author.initial || 'U'
                                         )}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-white text-sm">{(currentItem as GalleryItem).author.name}</h4>
                                         <p className="text-[10px] text-gray-500">{(currentItem as GalleryItem).author.followers || 'Creator'}</p>
                                     </div>
                                 </div>
                                 {!isOwner && (
                                     <button className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white transition-colors border border-white/5 flex items-center gap-1">
                                         <UserPlus size={12} /> Follow
                                     </button>
                                 )}
                             </div>
                             
                             <div className="mt-6">
                                 <h2 className="text-xl font-bold text-white mb-2">{(currentItem as GalleryItem).title}</h2>
                                 <div className="flex gap-4 text-[11px] text-gray-400 font-medium">
                                     <span>{(currentItem as GalleryItem).stats.views} Views</span>
                                     <span>{(currentItem as GalleryItem).stats.likes} Likes</span>
                                     <span>{(currentItem as GalleryItem).stats.comments || 0} Comments</span>
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* Prompt */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prompt</span>
                            <button onClick={() => platform.copy(displayPrompt)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Copy size={12} /> Copy
                            </button>
                        </div>
                        <PromptText text={displayPrompt} compact={false} className="bg-[#0a0a0c] border-white/5" />
                    </div>

                    {/* Tech Specs */}
                    <div className="p-6">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-4">Generation Details</span>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <ParamItem label="Model" value={mode === 'creation' ? ((currentItem as any).config.model || 'Unknown') : ((currentItem as any).model)} highlight />
                            <ParamItem label="Aspect Ratio" value={mode === 'creation' ? ((currentItem as any).config.aspectRatio) : ((currentItem as any).aspectRatio)} />
                            <ParamItem label="Created" value={new Date(currentItem.createdAt).toLocaleDateString()} />
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-[#161618]">
                    <button 
                        onClick={handleRemix}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Repeat2 size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        Remix this {isVideo ? 'Video' : 'Image'}
                    </button>
                    {isOwner && (
                        <div className="mt-3 text-center flex justify-center gap-4">
                             <button className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                                 <Edit3 size={10} /> Edit Details
                             </button>
                             <button className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
                                 <Trash2 size={10} /> Delete
                             </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Modals (Creation Mode Only) */}
            {mode === 'creation' && (
                <>
                    <ImageGridEditorModal 
                        isOpen={showGridEditor}
                        imageUrl={displayUrl || ''}
                        onClose={() => setShowGridEditor(false)}
                        onSave={handleEditorSave}
                    />
                    <ImageCanvasEditorModal 
                        isOpen={showCanvasEditor}
                        imageUrl={displayUrl || ''}
                        onClose={() => setShowCanvasEditor(false)}
                        onSave={handleEditorSave}
                    />
                </>
            )}

        </div>,
        document.body
    );
};

// --- Sub-components (Hookified) ---

const SidebarTaskItem: React.FC<{ item: any, mode: PreviewMode, isActive: boolean, onClick: () => void }> = ({ item, mode, isActive, onClick }) => {
    let thumb = '';
    let title = '';
    
    if (mode === 'creation') {
        const t = item as ImageTask;
        thumb = t.results?.[0]?.url || '';
        title = t.config.prompt;
    } else {
        const g = item as GalleryItem;
        thumb = g.url;
        title = g.title;
    }

    const { url: displayUrl } = useAssetUrl(thumb);

    if (!thumb) return null;

    return (
        <div 
            onClick={onClick}
            className={`
                group flex gap-3 p-2 rounded-xl cursor-pointer transition-all border
                ${isActive 
                    ? 'bg-[#27272a] border-white/10 shadow-lg ring-1 ring-white/5' 
                    : 'bg-transparent border-transparent hover:bg-[#1e1e20] hover:border-white/5'
                }
            `}
        >
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden border border-white/10 relative">
                {displayUrl ? (
                    <img src={displayUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                ) : <div className="w-full h-full bg-gray-800 animate-pulse" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center hidden xl:flex">
                <p className={`text-xs font-medium truncate leading-tight ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {title}
                </p>
            </div>
        </div>
    );
}

// UI Helpers
const TooltipButton: React.FC<{ icon: React.ReactNode; tooltip: string; onClick?: () => void; activeClass?: string }> = ({ icon, tooltip, onClick, activeClass = "text-gray-300 hover:text-white hover:bg-white/10" }) => (
    <button onClick={onClick} className={`p-2.5 rounded-full transition-colors backdrop-blur-md bg-black/40 border border-white/5 ${activeClass}`} title={tooltip}>
        {icon}
    </button>
);

const ParamItem: React.FC<{ label: string; value: string; copyable?: boolean; highlight?: boolean }> = ({ label, value, copyable, highlight }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] text-gray-500 font-medium">{label}</span>
        <div className={`text-sm text-gray-300 font-mono flex items-center gap-2 ${highlight ? 'text-white font-bold' : ''}`}>
            {value}
        </div>
    </div>
);

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void }> = ({ label, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 bg-[#1e1e20] hover:bg-[#27272a] border border-white/5 hover:border-white/10 rounded-lg transition-all group text-left"
    >
        <span className="text-gray-400 group-hover:text-blue-400 transition-colors">{icon}</span>
        <span className="text-xs font-medium text-gray-300">{label}</span>
    </button>
);

const getDimensions = (ratio: string) => {
    switch (ratio) {
        case '1:1': return '1024 x 1024';
        case '16:9': return '1344 x 768';
        case '9:16': return '768 x 1344';
        case '4:3': return '1152 x 896';
        case '3:4': return '896 x 1152';
        default: return '1024 x 1024';
    }
};
