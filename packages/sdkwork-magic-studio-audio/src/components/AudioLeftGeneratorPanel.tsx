import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    PromptTextInput,
    createPromptTextInputCapabilityProps,
} from '@sdkwork/magic-studio-assets/generation';
import {
    ChooseAssetModal,
    persistChooseAssetProjectReference,
    type ChooseAssetProjectReference,
} from '@sdkwork/magic-studio-assets/choose-asset';
import { importAssetBySdk } from '@sdkwork/magic-studio-assets/services';
import { resolveAssetUrlByAssetIdFirst } from '@sdkwork/magic-studio-assets/asset-center';
import type { Asset } from '@sdkwork/magic-studio-assets/entities';
import { isRenderableInputResourceUrl } from '@sdkwork/magic-studio-types/input-resource';
import {
    hasAudioInputResourceReference,
    resolveAudioInputResourcePath,
    resolveAudioInputResourceReference,
    resolveAudioInputResourceUrl
} from '../entities';
import { useAudioStore } from '../store/audioStore';
import { AudioModelSelector } from './AudioModelSelector';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import {
    FileAudio,
    FileText,
    FolderOpen,
    Languages,
    Loader2,
    Play,
    Settings2,
    Trash2,
    Type,
    Upload,
    Volume2
} from 'lucide-react';
import { toAudioInputResourceRefFromAsset } from '../utils/audioInputResource';
import {
    DEFAULT_AUDIO_TTS_MODEL,
    TRANSCRIPTION_AUDIO_MODEL,
    normalizeAudioTtsModel,
} from '../utils/audioModel';

const AUDIO_ACCEPT = 'audio/*,.wav,.mp3,.m4a,.flac,.ogg,.aac,.webm';
const AUDIO_SOURCE_PROJECT_REFERENCE = {
    slot: 'audio-source-audio',
    metadata: {
        source: 'audio-left-generator-panel',
    },
} satisfies ChooseAssetProjectReference;

export const AudioLeftGeneratorPanel: React.FC = () => {
    const { t } = useTranslation();
    const { config, setConfig, generate, isGenerating } = useAudioStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const [showSourceAssetModal, setShowSourceAssetModal] = useState(false);
    const [isUploadingSourceAudio, setIsUploadingSourceAudio] = useState(false);

    const mode = config.mode || 'text-to-speech';
    const isTranscriptionMode = mode === 'transcription';
    const isTranslationMode = mode === 'translation';
    const isTextAudioMode = isTranscriptionMode || isTranslationMode;
    const canGenerate = useMemo(() => {
        if (isTranscriptionMode) {
            return hasAudioInputResourceReference(config.sourceAudio);
        }
        if (isTranslationMode) {
            return Boolean(hasAudioInputResourceReference(config.sourceAudio) && config.targetLanguage?.trim());
        }
        return Boolean(config.prompt?.trim());
    }, [config.prompt, config.sourceAudio, config.targetLanguage, isTranscriptionMode, isTranslationMode]);

    useEffect(() => {
        return () => {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current.currentTime = 0;
                previewAudioRef.current = null;
            }
        };
    }, []);

    const handleModeChange = (nextMode: 'text-to-speech' | 'transcription' | 'translation') => {
        if (nextMode === mode) {
            return;
        }

        if (nextMode === 'transcription' || nextMode === 'translation') {
            setConfig({
                mode: nextMode,
                model: TRANSCRIPTION_AUDIO_MODEL,
                format: config.format || 'text',
                ...(nextMode === 'translation'
                    ? { targetLanguage: config.targetLanguage || '' }
                    : {}),
            });
            return;
        }

        setConfig({
            mode: 'text-to-speech',
            model: normalizeAudioTtsModel(config.model),
        });
    };

    const bindSourceAudio = (asset: Asset): void => {
        const sourceAudio = toAudioInputResourceRefFromAsset(asset, 'audio');
        if (sourceAudio) {
            setConfig({ sourceAudio });
        }
    };

    const handleLocalUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSourceAudioUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            setIsUploadingSourceAudio(true);
            const bytes = new Uint8Array(await file.arrayBuffer());
            const imported = await importAssetBySdk(
                {
                    name: file.name,
                    data: bytes,
                },
                'audio',
                { domain: 'audio-studio' }
            );
            const resolvedUrl =
                (await resolveAssetUrlByAssetIdFirst(imported as any)) ||
                imported.path ||
                imported.id ||
                '';
            await persistChooseAssetProjectReference({
                uploaded: imported,
                resolvedUrl,
                fallbackType: 'audio',
                domain: 'audio-studio',
                projectReference: AUDIO_SOURCE_PROJECT_REFERENCE,
            });
            bindSourceAudio(imported);
        } catch (error) {
            console.error('Failed to import transcription source audio', error);
        } finally {
            event.target.value = '';
            setIsUploadingSourceAudio(false);
        }
    };

    const handlePlaySourceAudio = async (): Promise<void> => {
        const source = config.sourceAudio;
        if (!source) {
            return;
        }

        const resolvedUrl =
            (await resolveAssetUrlByAssetIdFirst(source as any)) ||
            (isRenderableInputResourceUrl(resolveAudioInputResourceUrl(source))
                ? resolveAudioInputResourceUrl(source)
                : null) ||
            (isRenderableInputResourceUrl(resolveAudioInputResourcePath(source))
                ? resolveAudioInputResourcePath(source)
                : null) ||
            '';
        if (!resolvedUrl) {
            return;
        }

        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.currentTime = 0;
            previewAudioRef.current = null;
        }

        const audio = new Audio(resolvedUrl);
        audio.onended = () => {
            previewAudioRef.current = null;
        };
        audio.onerror = () => {
            previewAudioRef.current = null;
        };

        try {
            await audio.play();
            previewAudioRef.current = audio;
        } catch (error) {
            console.error('Failed to play transcription source audio', error);
        }
    };

    const handleRemoveSourceAudio = () => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.currentTime = 0;
            previewAudioRef.current = null;
        }
        setConfig({ sourceAudio: undefined });
    };

    const subtitle = isTranscriptionMode
        ? 'Audio Transcription'
        : isTranslationMode
            ? 'Audio Translation'
            : t('audio.common.subtitle');
    const sourceAudioReference = resolveAudioInputResourceReference(config.sourceAudio);

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/10">
                            <Volume2 size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">{t('audio.common.title')}</h2>
                            <span className="text-[10px] text-gray-500 font-medium">{subtitle}</span>
                        </div>
                    </div>

                    {isTextAudioMode ? (
                        <select
                            value={config.model || TRANSCRIPTION_AUDIO_MODEL}
                            onChange={(event) => setConfig({ model: TRANSCRIPTION_AUDIO_MODEL })}
                            className="h-8 rounded-lg border border-[#333] bg-[#18181b] px-3 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                        >
                            <option value={TRANSCRIPTION_AUDIO_MODEL}>Whisper 1</option>
                        </select>
                    ) : (
                        <AudioModelSelector
                            value={config.model || DEFAULT_AUDIO_TTS_MODEL}
                            onChange={(model) => setConfig({ model: normalizeAudioTtsModel(model) })}
                            className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                        />
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                <div className="flex bg-[#121214] p-1 rounded-xl border border-[#27272a]">
                    <button
                        type="button"
                        onClick={() => handleModeChange('text-to-speech')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            !isTextAudioMode
                                ? 'bg-[#27272a] text-white border border-[#333]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {t('audio.common.subtitle')}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange('transcription')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            isTranscriptionMode
                                ? 'bg-[#27272a] text-white border border-[#333]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Transcription
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange('translation')}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            isTranslationMode
                                ? 'bg-[#27272a] text-white border border-[#333]'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Translation
                    </button>
                </div>

                {isTextAudioMode ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <Label icon={<FileAudio size={12} />}>Source Audio</Label>
                            {config.sourceAudio ? (
                                <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                                            <FileAudio size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold text-gray-100 truncate">
                                                {config.sourceAudio.name || 'Source Audio'}
                                            </div>
                                            <div className="text-[11px] text-gray-500 truncate">
                                                {sourceAudioReference || 'Audio asset ready'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => void handlePlaySourceAudio()}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-[#252526] rounded-lg transition-colors"
                                                title="Play Source Audio"
                                            >
                                                <Play size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRemoveSourceAudio}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#252526] rounded-lg transition-colors"
                                                title="Remove Source Audio"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={handleLocalUploadClick}
                                            className="inline-flex items-center gap-2 rounded-lg border border-[#333] bg-[#18181b] px-3 py-2 text-xs text-gray-200 hover:bg-[#202024] transition-colors"
                                        >
                                            <Upload size={12} />
                                            Replace Local File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowSourceAssetModal(true)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-[#333] bg-[#18181b] px-3 py-2 text-xs text-gray-200 hover:bg-[#202024] transition-colors"
                                        >
                                            <FolderOpen size={12} />
                                            Select from Assets
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={handleLocalUploadClick}
                                        disabled={isUploadingSourceAudio}
                                        className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                                            isUploadingSourceAudio
                                                ? 'border-[#333] bg-[#111214] text-gray-500'
                                                : 'border-[#27272a] bg-[#121214] hover:border-cyan-500/30 hover:bg-[#17181c] text-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                                                {isUploadingSourceAudio ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold">Upload Local</div>
                                                <div className="text-[11px] text-gray-500">
                                                    {isUploadingSourceAudio ? 'Importing audio...' : 'Import source audio through S3 presigned upload'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowSourceAssetModal(true)}
                                        className="rounded-xl border border-[#27272a] bg-[#121214] px-4 py-4 text-left hover:border-blue-500/30 hover:bg-[#17181c] transition-colors text-gray-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300 flex items-center justify-center">
                                                <FolderOpen size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold">Select from Assets</div>
                                                <div className="text-[11px] text-gray-500">
                                                    Reuse audio already managed by asset center
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={AUDIO_ACCEPT}
                                className="hidden"
                                onChange={(event) => {
                                    void handleSourceAudioUpload(event);
                                }}
                            />

                            <p className="mt-3 text-[11px] leading-5 text-gray-500">
                                Uploads use the shared S3 presigned URL flow and are registered back into asset center before {isTranslationMode ? 'translation' : 'transcription'} starts.
                            </p>
                        </div>

                        <div className={`grid gap-4 ${isTranslationMode ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                            <div>
                                <Label icon={<Languages size={12} />}>{isTranslationMode ? 'Source Language Hint' : 'Language Hint'}</Label>
                                <input
                                    type="text"
                                    value={isTranslationMode ? (config.sourceLanguage || '') : (config.language || '')}
                                    onChange={(event) => setConfig(
                                        isTranslationMode
                                            ? { sourceLanguage: event.target.value }
                                            : { language: event.target.value }
                                    )}
                                    placeholder="Auto detect"
                                    className="w-full rounded-xl border border-[#27272a] bg-[#121214] px-3 py-3 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {isTranslationMode && (
                                <div>
                                    <Label icon={<Languages size={12} />}>Target Language</Label>
                                    <input
                                        type="text"
                                        value={config.targetLanguage || ''}
                                        onChange={(event) => setConfig({ targetLanguage: event.target.value })}
                                        placeholder="Target language"
                                        className="w-full rounded-xl border border-[#27272a] bg-[#121214] px-3 py-3 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            )}

                            <div>
                                <Label icon={<FileText size={12} />}>Output Format</Label>
                                <select
                                    value={config.format || 'text'}
                                    onChange={(event) => setConfig({ format: event.target.value })}
                                    className="w-full rounded-xl border border-[#27272a] bg-[#121214] px-3 py-3 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="text">Plain Text</option>
                                    <option value="json">JSON</option>
                                    <option value="srt">SRT</option>
                                    <option value="vtt">WebVTT</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <Label icon={<Type size={12} />}>{t('audio.page.script')}</Label>
                            <PromptTextInput
                                {...createPromptTextInputCapabilityProps('TEXT')}
                                label={null}
                                placeholder={t('audio.page.placeholder')}
                                value={config.prompt || ''}
                                onChange={(val) => setConfig({ prompt: val })}
                                disabled={isGenerating}
                                rows={8}
                                className="bg-[#121214]"
                            />
                        </div>

                        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Settings2 size={12} className="text-gray-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('audio.page.settings')}</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{t('audio.page.duration')}</span>
                                    <span className="font-mono text-gray-300">{config.duration || 10}s</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    step="5"
                                    value={config.duration || 10}
                                    onChange={(e) => setConfig({ duration: parseInt(e.target.value, 10) })}
                                    className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button
                    onClick={generate}
                    disabled={isGenerating || !canGenerate}
                    className={`
                        w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2
                        ${isGenerating
                            ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]'
                            : !canGenerate
                                ? 'bg-[#18181b] text-gray-500 cursor-not-allowed border border-[#333]'
                                : isTextAudioMode
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/20 active:scale-[0.98]'
                                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 hover:shadow-indigo-500/20 active:scale-[0.98]'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{t('audio.common.creating')}</span>
                        </>
                    ) : (
                        <>
                            <Play size={16} fill="currentColor" />
                            <span>{isTranscriptionMode ? 'Transcribe Audio' : isTranslationMode ? 'Translate Audio' : t('audio.common.generate')}</span>
                        </>
                    )}
                </button>
            </div>

            <ChooseAssetModal
                isOpen={showSourceAssetModal}
                onClose={() => setShowSourceAssetModal(false)}
                onConfirm={(assets) => {
                    const first = assets[0];
                    if (!first) {
                        setShowSourceAssetModal(false);
                        return;
                    }
                    bindSourceAudio(first);
                    setShowSourceAssetModal(false);
                }}
                accepts={['audio', 'voice', 'music', 'sfx']}
                domain="audio-studio"
                projectReference={AUDIO_SOURCE_PROJECT_REFERENCE}
                title="Select Source Audio"
            />
        </>
    );
};

const Label: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {children}
    </label>
);
