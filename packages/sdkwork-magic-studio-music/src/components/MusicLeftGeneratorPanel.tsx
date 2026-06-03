import {
    PromptTextInput,
    createPromptTextInputCapabilityProps,
} from '@sdkwork/magic-studio-assets/generation';
import { ChooseAsset } from '@sdkwork/magic-studio-assets/choose-asset';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import type { Asset } from '@sdkwork/magic-studio-assets/entities';
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React from 'react';
import { useMusicStore } from '../store/musicStore';
import { MusicModelSelector } from './MusicModelSelector';
import { MUSIC_STYLES } from '../constants';
import {
    AudioLines,
    Clock3,
    Guitar,
    ListMusic,
    Loader2,
    Mic2,
    Music,
    Repeat2,
    Sparkles,
    StretchHorizontal,
    ToggleLeft,
    ToggleRight,
    Type,
} from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import type { MusicConfig, MusicWorkflowMode } from '../entities';
import { toGeneratedMusicResultFromAsset } from '../utils/musicSourceAsset';
import { normalizeMusicModel } from '../utils/musicModel';

const WORKFLOW_MODES: Array<{
    id: MusicWorkflowMode;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'similar', label: 'Similar', icon: AudioLines },
    { id: 'remix', label: 'Remix', icon: Repeat2 },
    { id: 'extend', label: 'Extend', icon: StretchHorizontal },
];

const resolveMusicMode = (config: MusicConfig): MusicWorkflowMode => config.mode || 'generate';

const resolveCanGenerate = (config: MusicConfig): boolean => {
    const mode = resolveMusicMode(config);
    if (mode === 'similar') {
        return Boolean(config.sourceMusic);
    }
    if (mode === 'remix') {
        return Boolean(config.sourceMusic && config.style.trim());
    }
    if (mode === 'extend') {
        return Boolean(config.sourceMusic && (config.extendDuration || 0) > 0);
    }
    return Boolean(config.prompt.trim());
};

const parsePositiveNumber = (value: string): number | undefined => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return undefined;
    }
    return parsed;
};

const formatDurationLabel = (duration?: number): string | null => {
    if (!duration || duration <= 0) {
        return null;
    }
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const MusicLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useMusicStore();
    const { t } = useTranslation();
    const createCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'create',
        {
            feature: 'MusicLeftGeneratorPanel'
        }
    );
    const similarCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'similar',
        {
            feature: 'MusicLeftGeneratorPanel'
        }
    );
    const remixCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'remix',
        {
            feature: 'MusicLeftGeneratorPanel'
        }
    );
    const extendCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'music-generation',
        'extend',
        {
            feature: 'MusicLeftGeneratorPanel'
        }
    );

    const mode = resolveMusicMode(config);
    const isGenerateMode = mode === 'generate';
    const sourceMusicDurationLabel = formatDurationLabel(config.sourceMusic?.duration);
    const workflowAvailability = {
        generate: {
            enabled: createCapability.ready,
            reason: createCapability.disabledReason,
        },
        similar: {
            enabled: similarCapability.ready,
            reason: similarCapability.disabledReason,
        },
        remix: {
            enabled: remixCapability.ready,
            reason: remixCapability.disabledReason,
        },
        extend: {
            enabled: extendCapability.ready,
            reason: extendCapability.disabledReason,
        },
    } satisfies Record<
        MusicWorkflowMode,
        {
            enabled: boolean;
            reason: string | null;
        }
    >;
    const activeModeReason = workflowAvailability[mode].enabled
        ? null
        : workflowAvailability[mode].reason;
    const canGenerate = workflowAvailability[mode].enabled && resolveCanGenerate(config);

    React.useEffect(() => {
        if (workflowAvailability[mode].enabled) {
            return;
        }

        const fallbackMode = WORKFLOW_MODES.find(
            (item) => workflowAvailability[item.id].enabled
        )?.id;
        if (fallbackMode && fallbackMode !== mode) {
            setConfig({ mode: fallbackMode });
        }
    }, [mode, setConfig, workflowAvailability]);

    const handleStyleTag = (styleValue: string) => {
        const current = config.style || '';
        const parts = current.split(',').map((segment) => segment.trim()).filter(Boolean);
        if (!parts.includes(styleValue)) {
            const nextValue = parts.length > 0 ? `${current}, ${styleValue}` : styleValue;
            setConfig({ style: nextValue });
        }
    };

    const handleModeChange = (nextMode: MusicWorkflowMode) => {
        if (!workflowAvailability[nextMode].enabled) {
            return;
        }

        setConfig({ mode: nextMode });
    };

    const handleSourceMusicChange = async (asset: Asset | null) => {
        if (!asset) {
            setConfig({ sourceMusic: null });
            return;
        }

        const resolvedUrl =
            (await resolveAssetUrlByAssetIdFirst(
                asset as Parameters<typeof resolveAssetUrlByAssetIdFirst>[0]
            )) ||
            (typeof asset.path === 'string' ? asset.path : undefined);
        const mappedSource = toGeneratedMusicResultFromAsset(asset, resolvedUrl);
        setConfig({ sourceMusic: mappedSource || null });
    };

    const renderSourceMusicSection = () => (
        <div className="space-y-3">
            <Label icon={<AudioLines size={12} className="text-emerald-400" />}>
                {t('studio.music.source_music', 'Source Music')}
            </Label>
            <ChooseAsset
                value={config.sourceMusic?.resource.path || config.sourceMusic?.resource.url || null}
                onChange={handleSourceMusicChange}
                accepts={['music', 'audio']}
                domain="music"
                projectReference={{
                    slot: 'source-music',
                    metadata: {
                        source: 'music-left-generator-panel',
                    },
                }}
                label={t('studio.music.source_music', 'Source Music')}
                aspectRatio="aspect-[16/6]"
                className="bg-[#121214] border-[#27272a] hover:border-emerald-500/30"
                imageFit="contain"
                readOnly={isGenerating}
            />
            {config.sourceMusic && (
                <div className="rounded-xl border border-[#27272a] bg-[#121214] px-3 py-2.5">
                    <div className="text-xs font-semibold text-white">
                        {config.sourceMusic.title || t('studio.music.source_music', 'Source Music')}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                        {sourceMusicDurationLabel && (
                            <span>{sourceMusicDurationLabel}</span>
                        )}
                        {config.sourceMusic.style && (
                            <span className="truncate">{config.sourceMusic.style}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderStyleField = (label: string) => (
        <div>
            <Label icon={<Guitar size={12} />}>{label}</Label>
            <input
                type="text"
                value={config.style}
                onChange={(event) => setConfig({ style: event.target.value })}
                placeholder={t('studio.music.style_placeholder', 'Pop, Rock, Electronic, Upbeat...')}
                className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600 mb-3"
                disabled={isGenerating}
            />
            <div className="flex flex-wrap gap-2">
                {MUSIC_STYLES.map((style) => (
                    <button
                        key={style.id}
                        type="button"
                        onClick={() => handleStyleTag(style.id)}
                        className="text-[10px] px-2 py-1 bg-[#18181b] hover:bg-[#252526] border border-[#27272a] rounded-md text-gray-400 hover:text-white transition-colors"
                    >
                        {style.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderTitleField = () => (
        <div>
            <Label icon={<Type size={12} />}>{t('studio.music.track_title', 'Track Title')}</Label>
            <input
                type="text"
                value={config.title}
                onChange={(event) => setConfig({ title: event.target.value })}
                placeholder={t('studio.music.track_title_placeholder', 'Song Title')}
                className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600"
                disabled={isGenerating}
            />
        </div>
    );

    const renderGenerateMode = () => (
        <>
            {!config.customMode ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <Label icon={<Sparkles size={12} className="text-yellow-500" />}>
                            {t('studio.music.description', 'Description')}
                        </Label>
                        <PromptTextInput
                            {...createPromptTextInputCapabilityProps('MUSIC')}
                            label={null}
                            placeholder="A chill lofi beat to study to, raining outside, cozy vibes..."
                            value={config.prompt}
                            onChange={(value) => setConfig({ prompt: value })}
                            disabled={isGenerating}
                            rows={6}
                            className="bg-[#121214]"
                        />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-[#18181b] border border-[#27272a] rounded-xl">
                        <span className="text-xs font-medium text-gray-300">
                            {t('studio.music.instrumental', 'Instrumental')}
                        </span>
                        <button
                            type="button"
                            onClick={() => setConfig({ instrumental: !config.instrumental })}
                            className={`text-2xl transition-colors ${config.instrumental ? 'text-green-500' : 'text-gray-600'}`}
                        >
                            {config.instrumental ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label icon={<Mic2 size={12} />}>{t('studio.music.lyrics', 'Lyrics')}</Label>
                            <button
                                type="button"
                                className="text-[10px] text-gray-500 hover:text-indigo-400 transition-colors"
                            >
                                {t('studio.common.generate', 'Generate')}
                            </button>
                        </div>
                        <textarea
                            value={config.lyrics}
                            onChange={(event) => setConfig({ lyrics: event.target.value })}
                            placeholder={t('studio.music.lyrics_placeholder', 'Enter lyrics or leave empty...')}
                            className="w-full bg-[#121214] border border-[#27272a] rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 min-h-[160px] resize-y placeholder-gray-600"
                            disabled={isGenerating}
                        />
                    </div>
                    {renderStyleField(t('studio.music.style', 'Style'))}
                    {renderTitleField()}
                </div>
            )}
        </>
    );

    const renderSimilarMode = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {renderSourceMusicSection()}
            <div>
                <Label icon={<Clock3 size={12} />}>{t('studio.music.duration', 'Duration')}</Label>
                <input
                    type="number"
                    min={1}
                    step={1}
                    value={config.duration || ''}
                    onChange={(event) => setConfig({ duration: parsePositiveNumber(event.target.value) })}
                    placeholder="180"
                    className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600"
                    disabled={isGenerating}
                />
            </div>
            {renderTitleField()}
        </div>
    );

    const renderRemixMode = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {renderSourceMusicSection()}
            {renderStyleField(t('studio.music.target_style', 'Target Style'))}
            {renderTitleField()}
        </div>
    );

    const renderExtendMode = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {renderSourceMusicSection()}
            <div>
                <Label icon={<Clock3 size={12} />}>
                    {t('studio.music.extend_duration', 'Extend Duration')}
                </Label>
                <input
                    type="number"
                    min={1}
                    step={1}
                    value={config.extendDuration || ''}
                    onChange={(event) => setConfig({ extendDuration: parsePositiveNumber(event.target.value) })}
                    placeholder="30"
                    className="w-full bg-[#121214] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600"
                    disabled={isGenerating}
                />
            </div>
            {renderStyleField(t('studio.music.extend_style', 'Extension Style'))}
            {renderTitleField()}
        </div>
    );

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10">
                            <Music size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">
                                {t('studio.music.title', 'Music')}
                            </h2>
                            <span className="text-[10px] text-gray-500 font-medium">AI Audio Generation</span>
                        </div>
                    </div>

                    <MusicModelSelector
                        value={config.model}
                        onChange={(model) => setConfig({ model: normalizeMusicModel(model) })}
                        className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                    />
                </div>

                <div className="px-6 pb-2 space-y-2">
                    <div className="flex items-center justify-between p-1 bg-[#18181b] border border-[#27272a] rounded-lg gap-1">
                        {WORKFLOW_MODES.map((modeOption) => {
                            const Icon = modeOption.icon;
                            const active = mode === modeOption.id;
                            const available = workflowAvailability[modeOption.id];
                            return (
                                <button
                                    key={modeOption.id}
                                    type="button"
                                    onClick={() => handleModeChange(modeOption.id)}
                                    disabled={!available.enabled}
                                    title={available.reason || undefined}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        active
                                            ? 'bg-[#27272a] text-white shadow-sm'
                                            : available.enabled
                                                ? 'text-gray-500 hover:text-gray-300'
                                                : 'text-gray-700 cursor-not-allowed'
                                    }`}
                                >
                                    <Icon size={12} />
                                    <span>{modeOption.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {activeModeReason && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-200">
                            {activeModeReason}
                        </div>
                    )}

                    {isGenerateMode && (
                        <div className="flex items-center justify-between p-1 bg-[#18181b] border border-[#27272a] rounded-lg">
                            <button
                                type="button"
                                onClick={() => setConfig({ customMode: false })}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${!config.customMode ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Sparkles size={12} /> {t('studio.music.simple_mode', 'Simple')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfig({ customMode: true })}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${config.customMode ? 'bg-[#27272a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <ListMusic size={12} /> {t('studio.music.custom_mode', 'Custom')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                {mode === 'similar' && renderSimilarMode()}
                {mode === 'remix' && renderRemixMode()}
                {mode === 'extend' && renderExtendMode()}
                {mode === 'generate' && renderGenerateMode()}
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button
                    type="button"
                    onClick={generate}
                    disabled={isGenerating || !canGenerate}
                    title={activeModeReason || undefined}
                    className={`w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${isGenerating || !canGenerate ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/20 active:scale-[0.98]'}`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{t('studio.common.creating', 'Creating')}</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} fill="currentColor" />
                            <span>{t('studio.common.create', 'Create')}</span>
                        </>
                    )}
                </button>
                {!isGenerating && activeModeReason && (
                    <p className="mt-2 text-[11px] leading-5 text-amber-300">
                        {activeModeReason}
                    </p>
                )}
            </div>
        </>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);
