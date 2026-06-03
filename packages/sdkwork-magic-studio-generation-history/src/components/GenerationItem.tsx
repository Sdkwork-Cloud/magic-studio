import React, { useRef, useState } from 'react';
import {
    Trash2, Copy, Repeat2, Check, Maximize2, Play, Image as ImageIcon, Film, Mic, Music, Volume2, Box, Save, FileText, User
} from 'lucide-react';
import { PromptText, formatLocaleDateTime } from '@sdkwork/magic-studio-commons';
import { useRenderableAssetUrl } from '@sdkwork/magic-studio-commons/hooks';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import type { MediaType } from '@sdkwork/magic-studio-types/vocabulary';
import {
    resolveGenerationResultDeliveryUrl,
    resolveGenerationResultPosterUrl,
    resolveGenerationResultRenderKind,
    resolveGenerationResultTextContent,
    resolveGenerationTaskKey,
    resolveGenerationTaskPrompt,
    toGenerationResultSelection,
    type GenerationResultRecord,
    type GenerationResultSelection,
    type GenerationTaskRecord
} from '../resultSelection';
import { resolveGenerationHistoryAssetUrl } from '../assetUrlResolver';

type GeneratedResult = GenerationResultRecord & {
    modelId?: string;
    posterUrl?: string;
};

interface GenerationItemProps<T extends GenerationTaskRecord = GenerationTaskRecord> {
    task: T;
    onDelete: (id: string) => void;
    onReuse: (task: T) => void;
    onPreview: (selection: GenerationResultSelection) => void;
    onSelect?: (selection: GenerationResultSelection) => void;
    selectedKeys?: string[];
    onSaveToAssets?: (selection: GenerationResultSelection) => Promise<void>;
}

export function GenerationItem<T extends GenerationTaskRecord>({
    task, onDelete, onReuse, onPreview, onSelect, selectedKeys = [], onSaveToAssets
}: GenerationItemProps<T>) {
    const runtime = getPlatformRuntime();
    const { t } = useTranslation();
    const results = (task.results || []) as GeneratedResult[];
    const mediaType = task.config.mediaType || 'image';
    const aspectRatio = task.config.aspectRatio || '1:1';
    const [isSaving, setIsSaving] = useState(false);

    const handleCopyPrompt = () => {
        void runtime.clipboard.copy(resolveGenerationTaskPrompt(task));
    };

    const handleMediaClick = (selection: GenerationResultSelection) => {
        if (onSelect) {
            onSelect(selection);
        } else {
            onPreview(selection);
        }
    };

    const handleSaveToAssets = async () => {
        if (results.length === 0 || isSaving || !onSaveToAssets) return;
        setIsSaving(true);
        try {
            for (const [index, res] of results.entries()) {
                await onSaveToAssets(toGenerationResultSelection(task, res, index));
            }
            await runtime.dialog.notify(
                t('generationHistory.item.notifySavedTitle'),
                t('generationHistory.item.notifySavedBody', { count: String(results.length) }),
            );
        } catch (e) {
            console.error('Failed to save asset', e);
            await runtime.dialog.notify(
                t('generationHistory.item.notifyErrorTitle'),
                t('generationHistory.item.notifyErrorBody'),
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`
            group relative bg-[#18181b] border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl
            ${onSelect ? 'border-blue-500/20 hover:border-blue-500 cursor-default' : 'border-[#27272a] hover:border-[#3f3f46]'}
        `}>
            <div className="p-3 border-b border-[#222]">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <MediaTypeBadge type={mediaType} />
                            <span className="text-[10px] text-gray-500 font-mono">
                                {formatLocaleDateTime(task.createdAt)}
                            </span>
                            <span className="text-[10px] text-gray-600 border border-[#333] px-1.5 py-0.5 rounded uppercase font-medium bg-[#111]">
                                {task.config.aspectRatio}
                            </span>
                            {!task.config.useMultiModel && task.config.model && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Box size={10} /> {task.config.model}
                                </span>
                            )}
                        </div>
                        <PromptText
                            text={resolveGenerationTaskPrompt(task)}
                            className="mt-1 border-0 bg-transparent p-0"
                            style={{ padding: 0 }}
                            compact={true}
                            maxLines={2}
                        />
                    </div>
                </div>
            </div>

            <div className="p-3 bg-[#101010] flex justify-start">
                {task.status === 'pending' ? (
                    <div className="w-full h-32 bg-[#111] rounded-lg border border-[#27272a] border-dashed flex flex-col items-center justify-center text-purple-400 gap-3">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium animate-pulse">{t('generationHistory.item.generating')}</span>
                    </div>
                ) : task.status === 'failed' ? (
                    <div className="w-full h-24 bg-red-900/10 border border-red-900/30 rounded-lg flex items-center justify-center text-red-400 gap-2">
                        <span className="text-xs">{task.error || t('generationHistory.item.generationFailed')}</span>
                    </div>
                ) : (
                    <MediaGrid
                        task={task}
                        results={results}
                        type={mediaType}
                        aspectRatio={aspectRatio}
                        onClick={handleMediaClick}
                        selectedKeys={selectedKeys}
                    />
                )}
            </div>

            <div className="px-3 py-2 flex items-center justify-between gap-2 bg-[#18181b] border-t border-[#27272a]">
                <div className="flex items-center gap-2">
                    <button onClick={() => onReuse(task)} className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors px-2 py-1 hover:bg-[#252526] rounded">
                        <Repeat2 size={12} /> {t('generationHistory.item.regenerate')}
                    </button>
                    {task.status === 'completed' && onSaveToAssets && (
                        <button
                            onClick={handleSaveToAssets}
                            disabled={isSaving}
                            className={`text-xs flex items-center gap-1.5 transition-colors px-2 py-1 rounded ${isSaving ? 'text-green-600' : 'text-gray-500 hover:text-green-400 hover:bg-[#252526]'}`}
                        >
                            {isSaving ? <Check size={12} /> : <Save size={12} />}
                            {isSaving ? t('generationHistory.item.saved') : t('generationHistory.item.saveToAssets')}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleCopyPrompt} className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2d2d2d] rounded transition-colors" title={t('generationHistory.item.copyPrompt')}>
                        <Copy size={13} />
                    </button>
                    <div className="w-[1px] h-3 bg-[#333] mx-1" />
                    <button onClick={() => onDelete(resolveGenerationTaskKey(task))} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2d2d2d] rounded transition-colors" title={t('generationHistory.item.delete')}>
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

const MediaTypeBadge: React.FC<{ type: MediaType }> = ({ type }) => {
    const { t } = useTranslation();
    const config = {
        image: { icon: ImageIcon, label: t('generationHistory.mediaTypes.image'), color: 'text-purple-400' },
        character: { icon: User, label: t('studio.tabs.character'), color: 'text-blue-400' },
        video: { icon: Film, label: t('generationHistory.mediaTypes.video'), color: 'text-pink-400' },
        audio: { icon: Mic, label: t('generationHistory.mediaTypes.audio'), color: 'text-orange-400' },
        sfx: { icon: Volume2, label: t('generationHistory.mediaTypes.sfx'), color: 'text-orange-400' },
        voice: { icon: Mic, label: t('generationHistory.mediaTypes.voice'), color: 'text-green-400' },
        music: { icon: Music, label: t('generationHistory.mediaTypes.music'), color: 'text-indigo-400' },
        speech: { icon: Volume2, label: t('generationHistory.mediaTypes.speech'), color: 'text-teal-400' },
    }[type] || { icon: ImageIcon, label: t('generationHistory.mediaTypes.media'), color: 'text-gray-400' };

    const Icon = config.icon;
    return (
        <div className={`flex items-center gap-1 ${config.color} bg-[#252526] px-1.5 py-0.5 rounded border border-[#333]`}>
            <Icon size={10} />
            <span className="text-[9px] font-bold uppercase">{config.label}</span>
        </div>
    );
};

const VideoThumbnail: React.FC<{ result: GeneratedResult; isSelected: boolean; onClick: () => void }> = ({ result, isSelected, onClick }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { url: videoSrc } = useRenderableAssetUrl(resolveGenerationResultDeliveryUrl(result), {
        resolver: resolveGenerationHistoryAssetUrl,
    });
    const { url: posterSrc } = useRenderableAssetUrl(resolveGenerationResultPosterUrl(result), {
        resolver: resolveGenerationHistoryAssetUrl,
    });

    const handleMouseEnter = () => {
        if (videoRef.current && videoSrc) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div
            className="w-full h-full relative cursor-pointer group/video bg-black rounded-lg overflow-hidden border border-[#333] hover:border-[#555] transition-colors"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {posterSrc && !isPlaying && (
                <img
                    src={posterSrc}
                    className="absolute inset-0 w-full h-full object-contain z-10"
                    alt={t('generationHistory.item.video')}
                />
            )}

            {videoSrc && (
                <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full object-contain relative z-0"
                    muted
                    loop
                    playsInline
                />
            )}

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-transparent transition-colors z-20">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 shadow-lg transition-transform group-hover/video:scale-110">
                        <Play size={12} fill="currentColor" className="ml-0.5" />
                    </div>
                </div>
            )}

            {result.modelId && (
                <div className="absolute top-2 left-2 pointer-events-none z-20">
                    <span className="bg-black/60 text-white/80 text-[8px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-sm font-mono truncate max-w-[80px] block">
                        {result.modelId}
                    </span>
                </div>
            )}

            <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover/video:opacity-100 transition-opacity z-20">
                <span className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                    {isPlaying ? t('generationHistory.item.preview') : t('generationHistory.item.video')}
                </span>
            </div>

            <div className={`
                absolute inset-0 transition-all duration-200 flex items-center justify-center pointer-events-none z-30
                ${isSelected ? 'bg-pink-500/20 ring-2 ring-pink-500' : ''}
            `}>
                {isSelected && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white p-1 rounded-full shadow-sm">
                        <Check size={10} strokeWidth={3} />
                    </div>
                )}
            </div>
        </div>
    );
};

const ImageThumbnail: React.FC<{ result: GeneratedResult; isSelected: boolean; itemStyle: React.CSSProperties; onClick: () => void }> = ({ result, isSelected, itemStyle, onClick }) => {
    const { url: displayUrl } = useRenderableAssetUrl(resolveGenerationResultDeliveryUrl(result), {
        resolver: resolveGenerationHistoryAssetUrl,
    });

    return (
        <div
            className={`
                relative rounded-lg overflow-hidden border transition-all cursor-pointer group/image bg-black
                ${isSelected ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-[#333] hover:border-gray-500'}
            `}
            style={itemStyle}
            onClick={onClick}
        >
            {displayUrl && <img src={displayUrl} className="w-full h-full object-contain" loading="lazy" />}

            {result.modelId && (
                <div className="absolute bottom-2 left-2 z-10">
                    <span className="bg-black/50 text-white/90 text-[8px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/5 font-medium shadow-sm">
                        {result.modelId}
                    </span>
                </div>
            )}

            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                <div className="bg-black/50 p-1.5 rounded-full text-white backdrop-blur-sm">
                    <Maximize2 size={16} />
                </div>
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full shadow-sm z-10">
                    <Check size={10} strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

const AudioThumbnail: React.FC<{ result: GeneratedResult; isSelected: boolean; onClick: () => void }> = ({ result, isSelected, onClick }) => {
    return (
        <div
            className={`
                w-full h-12 px-3 flex items-center gap-3 bg-[#1e1e1e] border rounded-lg cursor-pointer transition-colors
                ${isSelected ? 'border-orange-500 bg-orange-900/10' : 'border-[#333] hover:bg-[#252526] hover:border-[#444]'}
            `}
            onClick={onClick}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-300 ${isSelected ? 'bg-orange-500 text-white' : 'bg-[#2a2a2c]'}`}>
                {isSelected ? <Check size={14} /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </div>
            <div className="flex-1 h-1 bg-[#333] rounded-full overflow-hidden">
                <div className="h-full bg-gray-500 w-1/3" />
            </div>
            {result.modelId && (
                <span className="text-[9px] text-gray-500 font-mono bg-[#252526] px-1.5 py-0.5 rounded">
                    {result.modelId}
                </span>
            )}
        </div>
    );
};

const TextThumbnail: React.FC<{ result: GeneratedResult; isSelected: boolean; onClick: () => void }> = ({ result, isSelected, onClick }) => {
    const text = resolveGenerationResultTextContent(result);
    const language =
        result.resource?.language ||
        (typeof result.resource?.metadata?.language === 'string' ? result.resource.metadata.language : '');

    return (
        <button
            type="button"
            className={`
                w-full min-h-28 text-left p-4 rounded-lg border transition-colors bg-[#17171a]
                ${isSelected ? 'border-cyan-500 bg-cyan-950/20' : 'border-[#333] hover:border-[#4b5563] hover:bg-[#1d1d21]'}
            `}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isSelected ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-[#222327] text-gray-400 border-[#333]'}`}>
                    <FileText size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">
                            Transcript
                        </span>
                        {language && (
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-[#333] rounded px-1.5 py-0.5">
                                {language}
                            </span>
                        )}
                    </div>
                    <p className="text-sm leading-6 text-gray-200 whitespace-pre-wrap break-words">
                        {text || 'No transcript content'}
                    </p>
                </div>
                {isSelected && (
                    <div className="bg-cyan-500 text-white p-1 rounded-full shadow-sm">
                        <Check size={10} strokeWidth={3} />
                    </div>
                )}
            </div>
        </button>
    );
};

const MediaGrid: React.FC<{
    task: GenerationTaskRecord;
    results: GeneratedResult[];
    type: MediaType;
    aspectRatio: string;
    onClick: (selection: GenerationResultSelection) => void;
    selectedKeys: string[];
}> = ({ task, results, type, aspectRatio, onClick, selectedKeys }) => {
    const count = results.length;
    if (count === 0) return null;

    const renderKinds = results.map((result) => resolveGenerationResultRenderKind(result, type));
    const allText = renderKinds.every((kind) => kind === 'text');
    const [rw, rh] = aspectRatio.split(':').map(Number);
    const isPortrait = rh > rw;
    const usesVisualFrame = type === 'video' || type === 'image' || type === 'character';
    const { gridClass, containerStyle } = (() => {
        if (count === 1) {
            if (allText) {
                return {
                    gridClass: 'grid-cols-1',
                    containerStyle: { width: '100%', maxWidth: '100%' } as React.CSSProperties
                };
            }
            if (usesVisualFrame) {
                if (isPortrait) {
                    return { gridClass: 'grid-cols-1', containerStyle: { maxWidth: '260px' } as React.CSSProperties };
                }
                if (rw === rh) {
                    return { gridClass: 'grid-cols-1', containerStyle: { maxWidth: '320px' } as React.CSSProperties };
                }
                return { gridClass: 'grid-cols-1', containerStyle: { maxWidth: '440px' } as React.CSSProperties };
            }
            return {
                gridClass: 'grid-cols-1',
                containerStyle: { width: '100%' } as React.CSSProperties
            };
        }
        if (count === 2) {
            return { gridClass: 'grid-cols-2', containerStyle: { maxWidth: '600px' } as React.CSSProperties };
        }
        if (count === 3) {
            return { gridClass: 'grid-cols-3', containerStyle: { maxWidth: '800px' } as React.CSSProperties };
        }
        return { gridClass: 'grid-cols-2', containerStyle: { maxWidth: '500px' } as React.CSSProperties };
    })();

    const itemStyle: React.CSSProperties = {
        aspectRatio: `${rw}/${rh}`
    };

    return (
        <div className={`grid ${gridClass} gap-2`} style={containerStyle}>
            {results.map((res, index) => {
                const selection = toGenerationResultSelection(task, res, index);
                const isSelected = selectedKeys.includes(selection.key);
                const renderKind = renderKinds[index];

                if (renderKind === 'video') {
                    return (
                        <div key={selection.key} style={itemStyle}>
                            <VideoThumbnail result={res} isSelected={isSelected} onClick={() => onClick(selection)} />
                        </div>
                    );
                }

                if (renderKind === 'image') {
                    return (
                        <ImageThumbnail
                            key={selection.key}
                            result={res}
                            isSelected={isSelected}
                            itemStyle={itemStyle}
                            onClick={() => onClick(selection)}
                        />
                    );
                }

                if (renderKind === 'text') {
                    return (
                        <TextThumbnail
                            key={selection.key}
                            result={res}
                            isSelected={isSelected}
                            onClick={() => onClick(selection)}
                        />
                    );
                }

                return (
                    <AudioThumbnail
                        key={selection.key}
                        result={res}
                        isSelected={isSelected}
                        onClick={() => onClick(selection)}
                    />
                );
            })}
        </div>
    );
};
