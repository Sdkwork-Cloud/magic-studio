
import { Button } from 'sdkwork-react-commons'
import { GenerationHistoryListPane, GENERATION_TABS } from 'sdkwork-react-assets'
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { VideoLeftGeneratorPanel } from './VideoLeftGeneratorPanel';
;
import { useVideoStore, VideoStoreProvider } from '../store/videoStore';
import { X, Check } from 'lucide-react';
;

interface VideoGeneratorModalProps {
    onClose: () => void;
    onSuccess: (url: string) => void;
    actionLabel?: string;
}

const VideoGeneratorContent: React.FC<VideoGeneratorModalProps> = ({ onClose, onSuccess, actionLabel = "Add to Timeline" }) => {
    const { history, deleteTask, setConfig } = useVideoStore();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    const handleSelect = (url: string) => {
        setSelectedUrl(url);
    };

    const handleConfirm = () => {
        if (selectedUrl) {
            onSuccess(selectedUrl);
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative">
            <div className="w-[560px] flex-none h-full border-r border-[#333] z-10 bg-[#09090b] flex flex-col">
                <VideoLeftGeneratorPanel />
            </div>
            <div className="flex-1 bg-[#111] flex flex-col min-w-0 relative">
                <GenerationHistoryListPane 
                    tasks={history}
                    onDelete={deleteTask}
                    onReuse={(task) => setConfig(task.config)}
                    selectionMode={true}
                    selectedItems={selectedUrl ? [selectedUrl] : []}
                    onSelect={handleSelect}
                    tabs={GENERATION_TABS.filter(t => t.id === 'video' || t.id === 'all')}
                    activeTab="video"
                    className="w-full h-full"
                />
                
                {/* Overlay Header/Actions */}
                <div className="absolute top-0 right-0 h-14 flex items-center px-6 gap-3 z-20 pointer-events-auto">
                    {selectedUrl && (
                        <div className="flex items-center gap-2 bg-[#1e1e1e]/90 backdrop-blur-md border border-[#333] rounded-lg p-1 animate-in fade-in zoom-in shadow-xl">
                            <Button size="sm" onClick={handleConfirm} className="h-7 text-xs gap-1.5 bg-pink-600 hover:bg-pink-500 border-0">
                                <Check size={12} /> {actionLabel}
                            </Button>
                        </div>
                    )}
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#1e1e1e]/50 hover:bg-[#333] rounded-lg transition-colors backdrop-blur-sm border border-[#333]/50 shadow-sm">
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = (props) => {
    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[95vw] h-[90vh] bg-[#09090b] rounded-2xl shadow-2xl border border-[#333] overflow-hidden">
                <VideoStoreProvider>
                    <VideoGeneratorContent {...props} />
                </VideoStoreProvider>
            </div>
        </div>,
        document.body
    );
};
