import { CanvasElement } from '../entities'
import React, { useEffect, useRef } from 'react';
import { X, Image, Film, FileText, Settings } from 'lucide-react';
;
import { ImageLeftGeneratorPanel } from '@sdkwork/react-image';
import { VideoLeftGeneratorPanel } from '@sdkwork/react-video';
import { ImageStoreProvider } from '@sdkwork/react-image';
import { VideoStoreProvider } from '@sdkwork/react-video';

interface CanvasDrawerProps {
    element: CanvasElement | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
}

export const CanvasDrawer: React.FC<CanvasDrawerProps> = ({ 
    element, 
    isOpen, 
    onClose,
    onUpdateElement 
}) => {
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && drawerRef.current) {
            drawerRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen || !element) return null;

    const getDrawerConfig = () => {
        switch (element.type) {
            case 'image':
                return {
                    title: 'Image Settings',
                    icon: <Image size={16} className="text-purple-400" />,
                    gradient: 'from-purple-600 to-indigo-600',
                    width: 'w-[520px]'
                };
            case 'video':
                return {
                    title: 'Video Settings',
                    icon: <Film size={16} className="text-pink-400" />,
                    gradient: 'from-pink-600 to-rose-600',
                    width: 'w-[520px]'
                };
            case 'note':
            case 'text':
                return {
                    title: 'Text Settings',
                    icon: <FileText size={16} className="text-blue-400" />,
                    gradient: 'from-blue-600 to-cyan-600',
                    width: 'w-[420px]'
                };
            default:
                return {
                    title: 'Element Settings',
                    icon: <Settings size={16} className="text-gray-400" />,
                    gradient: 'from-gray-600 to-gray-700',
                    width: 'w-[420px]'
                };
        }
    };

    const config = getDrawerConfig();

    const renderContent = () => {
        switch (element.type) {
            case 'image':
                return (
                    <ImageStoreProvider initialConfig={{ prompt: element.data?.prompt || '' }}>
                        <ImageLeftGeneratorPanel 
                            initialPrompt={element.data?.prompt}
                            onClose={onClose}
                        />
                    </ImageStoreProvider>
                );
            case 'video':
                return (
                    <VideoStoreProvider>
                        <VideoLeftGeneratorPanel />
                    </VideoStoreProvider>
                );
            case 'note':
            case 'text':
                return (
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Label
                            </label>
                            <input
                                type="text"
                                value={element.data?.label || ''}
                                onChange={(e) => onUpdateElement(element.id, {
                                    data: { ...element.data, label: e.target.value }
                                })}
                                className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                placeholder="Enter label..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Content
                            </label>
                            <textarea
                                value={element.data?.prompt || ''}
                                onChange={(e) => onUpdateElement(element.id, {
                                    data: { ...element.data, prompt: e.target.value }
                                })}
                                className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[120px] resize-none"
                                placeholder="Enter content..."
                            />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-6 text-center text-gray-500">
                        <Settings size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No settings available for this element type</p>
                    </div>
                );
        }
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/30 z-[9998] animate-in fade-in duration-200"
                onClick={onClose}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
            />
            
            <div 
                ref={drawerRef}
                tabIndex={-1}
                className={`
                    fixed top-0 right-0 h-full ${config.width} bg-[#0a0a0c] border-l border-[#27272a] 
                    z-[9999] shadow-2xl flex flex-col
                    animate-in slide-in-from-right duration-300
                `}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-hidden relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-4 right-4 z-50 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#27272a] transition-colors bg-[#0a0a0c]/80 backdrop-blur-sm border border-[#27272a]"
                        title="Close (Esc)"
                    >
                        <X size={14} />
                    </button>
                    {renderContent()}
                </div>
            </div>
        </>
    );
};
