
import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { ImageTask, MediaType } from 'sdkwork-react-commons';
import { GenerationItem } from './GenerationItem';
import { GenerationPreview, EditorComponents } from './GenerationPreview';

interface GenerateHistoryProps {
    tasks: ImageTask[];
    onDelete: (id: string) => void;
    onReuse?: (task: ImageTask) => void;
    onSelect?: (url: string, task: ImageTask) => void;
    onPreview?: (task: ImageTask) => void;
    selectedItems?: string[];
    layout?: 'list'; 
    order?: 'asc' | 'desc';
    filter?: MediaType | 'all';
    onSaveToAssets?: (url: string, type: MediaType) => Promise<void>;
    editors?: EditorComponents;
}

export const GenerateHistory: React.FC<GenerateHistoryProps> = ({ 
    tasks, onDelete, onReuse, onSelect, onPreview, selectedItems = [], 
    order = 'asc', filter = 'all', onSaveToAssets, editors = {}
}) => {
    const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);

    const handleDownload = (url: string, taskId: string, index: number) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-${taskId}-${index}-${Date.now()}.png`;
        a.click();
    };

    const filteredTasks = useMemo(() => {
        let result = tasks;
        if (filter !== 'all') {
            result = result.filter(t => {
                const type = t.config.mediaType || 'image';
                return type === filter;
            });
        }
        return order === 'desc' ? [...result].reverse() : result;
    }, [tasks, order, filter]);

    if (tasks.length === 0) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-transparent select-none p-8">
                <div className="w-20 h-20 rounded-3xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 shadow-inner">
                    <History size={32} className="opacity-20" />
                </div>
                <h3 className="text-base font-bold text-gray-300">No History Yet</h3>
                <p className="text-xs opacity-50 mt-2 max-w-[200px] text-center leading-relaxed">
                    Start generating to see your creation timeline here.
                </p>
            </div>
        );
    }

    if (filteredTasks.length === 0) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-transparent select-none">
                <div className="w-16 h-16 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 border-dashed">
                    <History size={24} className="opacity-20" />
                </div>
                <p className="text-xs opacity-50">No items found for this filter.</p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-y-auto p-4 md:px-6 lg:px-8 scroll-smooth custom-scrollbar">
            <div className="w-full flex flex-col gap-6 pb-20">
                {filteredTasks.map(task => (
                    <GenerationItem 
                        key={task.id} 
                        task={task} 
                        onDelete={onDelete}
                        onReuse={onReuse || (() => {})}
                        onDownload={handleDownload}
                        onPreview={(url, type) => {
                            if (onPreview) {
                                onPreview(task);
                            } else {
                                setPreviewTaskId(task.id);
                            }
                        }}
                        onSelect={onSelect ? (url) => onSelect(url, task) : undefined}
                        selectedItems={selectedItems}
                        onSaveToAssets={onSaveToAssets}
                    />
                ))}
            </div>

            {previewTaskId && !onSelect && (
                <GenerationPreview 
                    initialTaskId={previewTaskId}
                    tasks={filteredTasks}
                    onClose={() => setPreviewTaskId(null)}
                    onReuse={onReuse || (() => {})}
                    editors={editors}
                />
            )}
        </div>
    );
};
