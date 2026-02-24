
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AudioLeftGeneratorPanel } from './AudioLeftGeneratorPanel';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useAudioStore, AudioStoreProvider } from '../store/audioStore';
import { X, Check } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { AudioTask } from '../entities/audio.entity';

interface AudioGeneratorModalProps {
    onClose: () => void;
    onSuccess: (url: string, duration?: number) => void;
    actionLabel?: string;
}

const AudioGeneratorContent: React.FC<AudioGeneratorModalProps> = ({ onClose, onSuccess, actionLabel = "Add to Timeline" }) => {
    const { history, deleteTask, setConfig } = useAudioStore();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number | undefined>(undefined);

    const handleSelect = (url: string, task?: AudioTask) => {
        setSelectedUrl(url);
        
        // Attempt to find duration from the task results
        if (task && task.results) {
            const result = task.results.find(r => r.url === url);
            if (result) {
                setSelectedDuration(result.duration);
            }
        }
    };

    const handleConfirm = () => {
        if (selectedUrl) {
            onSuccess(selectedUrl, selectedDuration);
        }
    };

    return (
        <div className="flex h-full overflow-hidden relative">
            <div className="w-[420px] flex-none h-full border-r border-[#333] z-10 bg-[#09090b] flex flex-col">
                <AudioLeftGeneratorPanel />
            </div>
            <div className="flex-1 bg-[#111] flex flex-col min-w-0 relative">
                <GenerationHistoryListPane 
                    tasks={history}
                    onDelete={deleteTask}
                    onReuse={(task) => setConfig(task.config)}
                    selectionMode={true}
                    selectedItems={selectedUrl ? [selectedUrl] : []}
                    onSelect={(url, task) => handleSelect(url, task as AudioTask)}
                    tabs={GENERATION_TABS.filter(t => t.id === 'speech' || t.id === 'audio' || t.id === 'all')}
                    activeTab="speech"
                    className="w-full h-full"
                />
                
                {/* Overlay Header/Actions */}
                <div className="absolute top-0 right-0 h-14 flex items-center px-6 gap-3 z-20 pointer-events-auto">
                    {selectedUrl && (
                        <div className="flex items-center gap-2 bg-[#1e1e1e]/90 backdrop-blur-md border border-[#333] rounded-lg p-1 animate-in fade-in zoom-in shadow-xl">
                            <Button size="sm" onClick={handleConfirm} className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 border-0">
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

export const AudioGeneratorModal: React.FC<AudioGeneratorModalProps> = (props) => {
    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[95vw] h-[90vh] bg-[#09090b] rounded-2xl shadow-2xl border border-[#333] overflow-hidden">
                <AudioStoreProvider>
                    <AudioGeneratorContent {...props} />
                </AudioStoreProvider>
            </div>
        </div>,
        document.body
    );
};
