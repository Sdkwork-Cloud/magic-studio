import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { GenerationItem } from './GenerationItem';
import { GenerationPreview, EditorComponents } from './GenerationPreview';
import {
    resolveGenerationTaskKey,
    type GenerationResultSelection,
    type GenerationTaskRecord
} from '../resultSelection';

interface PreviewSelectionState {
    taskKey: string;
    resultIndex: number;
}

interface GenerateHistoryProps<T extends GenerationTaskRecord = GenerationTaskRecord> {
    tasks: T[];
    onDelete: (id: string) => void;
    onReuse?: (task: T) => void;
    onSelect?: (selection: GenerationResultSelection, task: T) => void;
    onPreview?: (selection: GenerationResultSelection, task: T) => void;
    selectedKeys?: string[];
    layout?: 'list'; 
    order?: 'asc' | 'desc';
    filter?: string;
    onSaveToAssets?: (selection: GenerationResultSelection) => Promise<void>;
    editors?: EditorComponents;
}

export function GenerateHistory<T extends GenerationTaskRecord>({
    tasks, onDelete, onReuse, onSelect, onPreview, selectedKeys = [], 
    order = 'asc', filter = 'all', onSaveToAssets, editors = {}
}: GenerateHistoryProps<T>) {
    const { t } = useTranslation();
    const [previewSelection, setPreviewSelection] = useState<PreviewSelectionState | null>(null);

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

    const handleReuse = (task: T) => {
        onReuse?.(task);
    };

    if (tasks.length === 0) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-transparent select-none p-8">
                <div className="w-20 h-20 rounded-3xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 shadow-inner">
                    <History size={32} className="opacity-20" />
                </div>
                <h3 className="text-base font-bold text-gray-300">{t('generationHistory.emptyTitle')}</h3>
                <p className="text-xs opacity-50 mt-2 max-w-[200px] text-center leading-relaxed">
                    {t('generationHistory.emptyDescription')}
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
                <p className="text-xs opacity-50">{t('generationHistory.emptyFiltered')}</p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-y-auto p-4 md:px-6 lg:px-8 scroll-smooth custom-scrollbar">
            <div className="w-full flex flex-col gap-6 pb-20">
                {filteredTasks.map(task => (
                    <GenerationItem 
                        key={resolveGenerationTaskKey(task)} 
                        task={task} 
                        onDelete={onDelete}
                        onReuse={handleReuse}
                        onPreview={(selection) => {
                            if (onPreview) {
                                onPreview(selection, task);
                            } else {
                                setPreviewSelection({
                                    taskKey: resolveGenerationTaskKey(task),
                                    resultIndex: selection.resultIndex
                                });
                            }
                        }}
                        onSelect={onSelect ? (selection) => onSelect(selection, task) : undefined}
                        selectedKeys={selectedKeys}
                        onSaveToAssets={onSaveToAssets}
                    />
                ))}
            </div>

            {previewSelection && !onSelect && (
                <GenerationPreview<T>
                    initialTaskId={previewSelection.taskKey}
                    initialResultIndex={previewSelection.resultIndex}
                    tasks={filteredTasks}
                    onClose={() => setPreviewSelection(null)}
                    onReuse={handleReuse}
                    editors={editors}
                />
            )}
        </div>
    );
}
