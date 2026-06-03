import React, { useEffect, useRef } from 'react';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { MediaType } from '@sdkwork/magic-studio-types/vocabulary';
import {
    resolveGenerationResultDeliveryUrl,
    resolveGenerationResultPosterUrl,
    resolveGenerationResultRenderKind,
    resolveGenerationResultTextContent,
    type GenerationResultRecord
} from '@sdkwork/magic-studio-generation-history';
import { isRenderableAssetUrl, useAssetUrl } from '../../hooks/useAssetUrl';
import {
    resolveAssetUrlByAssetIdFirst,
    type AssetUrlResolveSource,
} from '../../asset-center/application/assetUrlResolver';

type GenerationChatMode = 'image' | 'video' | 'audio' | 'music' | 'voice' | 'sfx' | 'character' | 'agent';
type GenerationTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
type GenerationReferenceSource = Exclude<AssetUrlResolveSource, null | undefined>;
type UnknownRecord = Record<string, unknown>;

const DEFAULT_REFERENCE_ARRAY_KEYS = ['referenceImages'] as const;
const DEFAULT_REFERENCE_SINGLE_KEYS = ['referenceImage', 'image', 'lastFrame', 'avatar', 'characterImage'] as const;

export interface GenerationTask<
    TConfig extends object = GenerationConfig,
    TResult extends GenerationResultRecord = GenerationResultRecord,
> {
    id: string | null;
    uuid?: string;
    config?: TConfig;
    status: GenerationTaskStatus;
    results?: TResult[];
    error?: string;
}

export interface GenerationConfig {
    prompt?: string;
    negativePrompt?: string;
    aspectRatio?: string;
    styleId?: string;
    referenceImages?: unknown[];
    [key: string]: unknown;
}

export interface GenerationChatReferenceItem {
    key: string;
    source: GenerationReferenceSource;
}

export interface GenerationChatWindowAdapter<
    TConfig extends object = GenerationConfig,
    TTask extends GenerationTask<TConfig> = GenerationTask<TConfig>,
> {
    getConfigPrompt?: (config: TConfig) => string;
    getTaskPrompt?: (task: TTask) => string;
    createPromptPatch?: (prompt: string, config: TConfig) => Partial<TConfig>;
    getReferenceItems?: (config: TConfig) => GenerationChatReferenceItem[];
}

export interface GenerationChatWindowProps<
    TConfig extends object = GenerationConfig,
    TResult extends GenerationResultRecord = GenerationResultRecord,
    TTask extends GenerationTask<TConfig, TResult> = GenerationTask<TConfig, TResult>,
> {
    mode: GenerationChatMode;
    title: string;
    backLabel?: string;
    onNavigateBack: () => void;
    history: TTask[];
    isGenerating: boolean;
    onDelete: (id: string) => void;
    onReuse: (task: TTask) => void;
    config: TConfig;
    setConfig: (config: Partial<TConfig>) => void;
    onGenerate: () => Promise<void> | void;
    canGenerate?: boolean;
    allowEmptyPromptSubmit?: boolean;
    generateDisabledReason?: string | null;
    onUpload?: () => Promise<void> | void;
    onRemoveReferenceImage?: (index: number) => void;
    adapter?: GenerationChatWindowAdapter<TConfig, TTask>;
}

const AUDIO_MODES = new Set<GenerationChatMode>(['audio', 'music', 'voice', 'sfx']);

const normalizeOptionalString = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const asRecord = (value: unknown): UnknownRecord | null => (
    value && typeof value === 'object' ? (value as UnknownRecord) : null
);

const readRecordString = (
    record: UnknownRecord | null,
    keys: readonly string[]
): string | null => {
    if (!record) {
        return null;
    }

    for (const key of keys) {
        const value = normalizeOptionalString(record[key]);
        if (value) {
            return value;
        }
    }

    return null;
};

const isMediaType = (value: unknown): value is MediaType => (
    value === 'image' ||
    value === 'video' ||
    value === 'audio' ||
    value === 'sfx' ||
    value === 'voice' ||
    value === 'music' ||
    value === 'speech' ||
    value === 'character'
);

const resolveTaskFallbackMediaType = (
    task: GenerationTask<object>,
    mode: GenerationChatMode
): MediaType => {
    const configuredType = readRecordString(asRecord(task.config), ['mediaType']);
    if (isMediaType(configuredType)) {
        return configuredType;
    }

    if (mode === 'video') {
        return 'video';
    }

    if (AUDIO_MODES.has(mode)) {
        return 'audio';
    }

    if (mode === 'character') {
        return 'character';
    }

    return 'image';
};

const createDefaultPromptPatch = <TConfig extends object>(
    prompt: string
): Partial<TConfig> => ({ prompt } as unknown as Partial<TConfig>);

const resolveConfigPrompt = <
    TConfig extends object,
    TTask extends GenerationTask<TConfig>,
>(
    config: TConfig,
    adapter?: GenerationChatWindowAdapter<TConfig, TTask>
): string => {
    const adaptedPrompt = adapter?.getConfigPrompt?.(config);
    if (typeof adaptedPrompt === 'string') {
        return adaptedPrompt;
    }

    return readRecordString(asRecord(config), ['prompt', 'text']) || '';
};

const resolveTaskPrompt = <
    TConfig extends object,
    TTask extends GenerationTask<TConfig>,
>(
    task: TTask,
    adapter?: GenerationChatWindowAdapter<TConfig, TTask>
): string => {
    const adaptedPrompt = adapter?.getTaskPrompt?.(task);
    if (typeof adaptedPrompt === 'string') {
        return adaptedPrompt;
    }

    const configPrompt = task.config ? resolveConfigPrompt(task.config, adapter) : '';
    if (configPrompt) {
        return configPrompt;
    }

    return readRecordString(asRecord(task), ['prompt', 'text']) || '';
};

const createPromptPatch = <
    TConfig extends object,
    TTask extends GenerationTask<TConfig>,
>(
    prompt: string,
    config: TConfig,
    adapter?: GenerationChatWindowAdapter<TConfig, TTask>
): Partial<TConfig> => (
    adapter?.createPromptPatch?.(prompt, config) ??
    createDefaultPromptPatch<TConfig>(prompt)
);

const pickRenderableUrl = (
    rawValue: string | null | undefined,
    resolvedValue: string | null | undefined
): string | null => {
    const rawCandidate = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (rawCandidate && isRenderableAssetUrl(rawCandidate)) {
        return rawCandidate;
    }

    const resolvedCandidate = typeof resolvedValue === 'string' ? resolvedValue.trim() : '';
    return resolvedCandidate || null;
};

const toResolverAssetSource = (
    rawUrl: string | null | undefined,
    source: {
        id?: string | null;
        assetId?: string | null;
        url?: string | null;
    } | null | undefined
): GenerationReferenceSource | null => {
    if (!source && !rawUrl) {
        return null;
    }

    const normalizedUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    const normalizedId =
        typeof source?.assetId === 'string' && source.assetId.trim().length > 0
            ? source.assetId.trim()
            : typeof source?.id === 'string' && source.id.trim().length > 0
                ? source.id.trim()
                : '';

    return {
        id: normalizedId || undefined,
        path: normalizedUrl || undefined,
        url: normalizedUrl || (typeof source?.url === 'string' ? source.url : undefined),
    };
};

const toReferencePreviewSource = (
    value: unknown
): GenerationReferenceSource | null => {
    const normalizedString = normalizeOptionalString(value);
    if (normalizedString) {
        return normalizedString;
    }

    const record = asRecord(value);
    if (!record) {
        return null;
    }

    const id = readRecordString(record, ['id']);
    const assetId = readRecordString(record, ['assetId']);
    const path = readRecordString(record, ['path']);
    const url = readRecordString(record, ['url', 'src', 'uri', 'href']);
    const metadata = asRecord(record.metadata);

    if (!id && !assetId && !path && !url && !metadata) {
        return null;
    }

    return {
        ...(id ? { id } : {}),
        ...(assetId ? { assetId } : {}),
        ...(path ? { path } : {}),
        ...(url ? { url } : {}),
        ...(metadata ? { metadata } : {}),
    };
};

const buildDefaultReferenceItems = <TConfig extends object>(
    config: TConfig
): GenerationChatReferenceItem[] => {
    const record = asRecord(config);
    if (!record) {
        return [];
    }

    const items: GenerationChatReferenceItem[] = [];
    const pushItem = (value: unknown, key: string) => {
        const source = toReferencePreviewSource(value);
        if (source) {
            items.push({ key, source });
        }
    };

    for (const key of DEFAULT_REFERENCE_ARRAY_KEYS) {
        const value = record[key];
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                pushItem(item, `${key}:${index}`);
            });
        }
    }

    for (const key of DEFAULT_REFERENCE_SINGLE_KEYS) {
        pushItem(record[key], key);
    }

    return items;
};

const resolveReferenceItems = <
    TConfig extends object,
    TTask extends GenerationTask<TConfig>,
>(
    config: TConfig,
    adapter?: GenerationChatWindowAdapter<TConfig, TTask>
): GenerationChatReferenceItem[] => adapter?.getReferenceItems?.(config) || buildDefaultReferenceItems(config);

const resolveReferenceSourceRawUrl = (
    source: GenerationReferenceSource
): string | null => {
    if (typeof source === 'string') {
        return normalizeOptionalString(source);
    }

    return readRecordString(asRecord(source), ['url', 'path']);
};

const GenerationReferenceImage: React.FC<{
    source: GenerationReferenceSource;
    index: number;
    onRemove?: (index: number) => void;
}> = ({ source, index, onRemove }) => {
    const { url: resolvedUrl } = useAssetUrl(source, { resolver: resolveAssetUrlByAssetIdFirst });
    const previewUrl = pickRenderableUrl(resolveReferenceSourceRawUrl(source), resolvedUrl);

    return (
        <div className="relative">
            {previewUrl ? (
                <img src={previewUrl} alt={`Reference ${index}`} className="w-16 h-16 object-cover rounded" />
            ) : (
                <div className="w-16 h-16 rounded bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[10px] text-gray-500">
                    Pending
                </div>
            )}
            {onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 w-5 h-5 flex items-center justify-center"
                >
                    x
                </button>
            )}
        </div>
    );
};

const TaskResultPreview = <
    TConfig extends object,
    TResult extends GenerationResultRecord,
    TTask extends GenerationTask<TConfig, TResult>,
>({
    task,
    mode
}: {
    task: TTask;
    mode: GenerationChatMode;
}) => {
    const result = task.results?.[0];
    if (!result) {
        return null;
    }

    const renderKind = resolveGenerationResultRenderKind(result, resolveTaskFallbackMediaType(task, mode));
    const transcriptText = resolveGenerationResultTextContent(result);
    const rawPreviewUrl = resolveGenerationResultDeliveryUrl(result);
    const rawPosterUrl = resolveGenerationResultPosterUrl(result);
    const previewSource = toResolverAssetSource(rawPreviewUrl, {
        id: result.resource?.id || result.id,
        assetId: result.resource?.assetId || result.assetId,
        url: result.resource?.url || result.url,
    });
    const posterSource = toResolverAssetSource(rawPosterUrl, {
        id: result.coverResource?.id || result.id,
        assetId: result.coverResource?.assetId || result.assetId,
        url: result.coverResource?.url || result.posterUrl,
    });
    const { url: resolvedPreviewUrl } = useAssetUrl(previewSource, { resolver: resolveAssetUrlByAssetIdFirst });
    const { url: resolvedPosterUrl } = useAssetUrl(
        posterSource,
        { resolver: resolveAssetUrlByAssetIdFirst }
    );
    const previewUrl = pickRenderableUrl(rawPreviewUrl, resolvedPreviewUrl);
    const posterUrl = pickRenderableUrl(rawPosterUrl, resolvedPosterUrl);

    if (renderKind === 'text') {
        return (
            <div className="mt-2 rounded-lg border border-[#333] bg-[#1f1f1f] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#333] text-xs uppercase tracking-wider text-cyan-300 font-semibold">
                    Transcript
                </div>
                <div className="p-4">
                    <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-200 font-sans">
                        {transcriptText || 'No transcript content'}
                    </pre>
                </div>
            </div>
        );
    }

    if (!previewUrl) {
        return null;
    }

    if (renderKind === 'video') {
        return (
            <div className="mt-2">
                <video
                    src={previewUrl}
                    poster={posterUrl || undefined}
                    controls
                    className="max-w-full h-auto rounded-lg bg-black"
                />
            </div>
        );
    }

    if (renderKind === 'audio') {
        return (
            <div className="mt-2 rounded-lg border border-[#333] bg-[#1f1f1f] overflow-hidden">
                {posterUrl && (
                    <img
                        src={posterUrl}
                        alt="Generated cover"
                        className="w-full h-40 object-cover border-b border-[#333]"
                    />
                )}
                <div className="p-4">
                    <audio src={previewUrl} controls className="w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2">
            <img
                src={previewUrl}
                alt="Generated"
                className="max-w-full h-auto rounded-lg"
            />
        </div>
    );
};

export function GenerationChatWindow<
    TConfig extends object = GenerationConfig,
    TResult extends GenerationResultRecord = GenerationResultRecord,
    TTask extends GenerationTask<TConfig, TResult> = GenerationTask<TConfig, TResult>,
>({
    mode,
    title,
    backLabel,
    onNavigateBack,
    history,
    isGenerating,
    onDelete,
    onReuse,
    config,
    setConfig,
    onGenerate,
    canGenerate = true,
    allowEmptyPromptSubmit = false,
    generateDisabledReason,
    onUpload,
    onRemoveReferenceImage,
    adapter,
}: GenerationChatWindowProps<TConfig, TResult, TTask>) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const input = resolveConfigPrompt(config, adapter);
    const referenceItems = resolveReferenceItems(config, adapter);
    const canSubmit = canGenerate && (allowEmptyPromptSubmit || input.trim().length > 0);
    const resolvedGenerateDisabledReason = !canGenerate
        ? generateDisabledReason || 'Generation is unavailable in the current runtime.'
        : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isGenerating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isGenerating || !canSubmit) return;

        await onGenerate();
        setConfig(createPromptPatch('', config, adapter));
    };

    return (
        <div className="flex flex-col h-full bg-[#212121] text-gray-100">
            <div className="flex-none p-4 border-b border-[#333] flex items-center gap-3">
                <button
                    onClick={onNavigateBack}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                >
                    {backLabel || 'Back'}
                </button>
                <h1 className="text-lg font-semibold">{title}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="text-4xl font-semibold tracking-[0.4em] mb-4 text-gray-600">AI</div>
                        <p className="text-lg font-medium">Start Creating</p>
                        <p className="text-sm">Enter a prompt to generate {mode}</p>
                    </div>
                ) : (
                    history.map((task) => (
                        <div key={resolveEntityKey(task)} className="bg-[#2a2a2a] rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-gray-400">Prompt: {resolveTaskPrompt(task, adapter)}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onReuse(task)}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                        Reuse
                                    </button>
                                    <button
                                        onClick={() => onDelete(resolveEntityKey(task))}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            {task.status === 'completed' && task.results && task.results.length > 0 && (
                                <TaskResultPreview task={task} mode={mode} />
                            )}
                            {task.status === 'failed' && (
                                <p className="text-red-400 text-sm">Error: {task.error}</p>
                            )}
                        </div>
                    ))
                )}
                {isGenerating && (
                    <div className="bg-[#2a2a2a] rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span>Generating...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-[#333]">
                {onUpload && (
                    <div className="flex gap-2 mb-2">
                        {referenceItems.map((item, idx) => (
                            <GenerationReferenceImage
                                key={item.key}
                                source={item.source}
                                index={idx}
                                onRemove={onRemoveReferenceImage}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={onUpload}
                            className="px-3 py-2 bg-[#333] hover:bg-[#444] rounded-lg text-sm text-gray-300"
                        >
                            Upload Reference
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setConfig(createPromptPatch(e.target.value, config, adapter))}
                        placeholder={`Enter your ${mode} prompt...`}
                        className="flex-1 bg-[#2a2a2a] border border-[#333] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        disabled={isGenerating}
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !canSubmit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                        Generate
                    </button>
                </div>
                {resolvedGenerateDisabledReason && (
                    <p className="mt-2 text-xs text-amber-400 leading-5">
                        {resolvedGenerateDisabledReason}
                    </p>
                )}
            </form>
        </div>
    );
}

export default GenerationChatWindow;
