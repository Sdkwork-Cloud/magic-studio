import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
    Mic2,
    Sparkles,
    AudioLines,
    X,
    UserRound,
    ScanFace,
    User,
    Upload,
    Mic,
    Library,
    Loader2,
    Play,
    Pause,
    Trash2
} from 'lucide-react';
import { Button, AudioUpload } from '@sdkwork/react-commons';
import {
    Dialog,
    DialogContent,
    DialogClose,
    Input,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Textarea,
    Label
} from '@sdkwork/react-commons/ui';
import { AudioRecorder } from '@sdkwork/react-audio';
import { useTranslation } from '@sdkwork/react-i18n';
import { ChooseAsset, type Asset } from '@sdkwork/react-assets';
import { AIImageGeneratorModal } from '@sdkwork/react-image';
import { voiceBusinessService, type UploadedVoiceReferenceInput } from '../../services';
import type { IVoice } from './types';

type VoiceLabMode = 'design' | 'clone';
type AvatarViewMode = 'portrait' | 'full-body' | 'three-view';
type CloneInputMethod = 'upload' | 'record' | 'library';

interface VoiceLabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (voice: IVoice) => void;
    defaultMode?: VoiceLabMode;
}

interface AssetAIGeneratorProps {
    contextText?: string;
    onClose: () => void;
    onSuccess: (result: string | string[]) => void;
}

const DEFAULT_PREVIEW = voiceBusinessService.voiceSpeakerService.DEFAULT_PREVIEW;
const STORAGE_SAFE_PREVIEW = DEFAULT_PREVIEW;

const LANGUAGE_OPTIONS = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR'];
const STYLE_OPTIONS = ['neutral', 'expressive', 'story', 'news', 'whisper'];
const GENDER_OPTIONS: Array<'male' | 'female' | 'neutral'> = ['male', 'female', 'neutral'];
const AVATAR_VIEW_OPTIONS: ReadonlyArray<{
    id: AvatarViewMode;
    aspectRatio: '1:1' | '3:4' | '16:9';
    icon: React.ComponentType<{ size?: number }>;
}> = [
    { id: 'portrait', aspectRatio: '1:1', icon: UserRound },
    { id: 'full-body', aspectRatio: '3:4', icon: User },
    { id: 'three-view', aspectRatio: '16:9', icon: ScanFace }
];

const cleanName = (value: string, fallback: string): string => {
    const trimmed = value.trim();
    if (!trimmed) {
        return fallback;
    }
    return trimmed;
};

export const VoiceLabModal: React.FC<VoiceLabModalProps> = ({
    isOpen,
    onClose,
    onSave,
    defaultMode = 'design'
}) => {
    const { t } = useTranslation();
    const speakerService = voiceBusinessService.voiceSpeakerService;
    const [mode, setMode] = useState<VoiceLabMode>(defaultMode);
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('en-US');
    const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
    const [style, setStyle] = useState('neutral');
    const [description, setDescription] = useState('');
    const [previewText, setPreviewText] = useState('');
    const [referenceAsset, setReferenceAsset] = useState<Asset | null>(null);
    const [avatarAsset, setAvatarAsset] = useState<Asset | null>(null);
    const [avatarViewMode, setAvatarViewMode] = useState<AvatarViewMode>('portrait');
    const [cloneInputMethod, setCloneInputMethod] = useState<CloneInputMethod>('upload');
    const [isReferenceImporting, setIsReferenceImporting] = useState(false);
    const [isReferencePlaying, setIsReferencePlaying] = useState(false);
    const referenceAudioRef = useRef<HTMLAudioElement | null>(null);
    const [referencePreviewUrl, setReferencePreviewUrl] = useState<string>('');

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        setMode(defaultMode);
        setName('');
        setLanguage('en-US');
        setGender('neutral');
        setStyle('neutral');
        setDescription('');
        setPreviewText('');
        setReferenceAsset(null);
        setAvatarAsset(null);
        setAvatarViewMode('portrait');
        setCloneInputMethod('upload');
        setIsReferenceImporting(false);
        setIsReferencePlaying(false);
        setReferencePreviewUrl('');
    }, [defaultMode, isOpen]);

    const stopReferencePlayback = () => {
        if (referenceAudioRef.current) {
            speakerService.stopPreviewAudio(referenceAudioRef.current);
            referenceAudioRef.current = null;
        }
        setIsReferencePlaying(false);
    };

    const closeModal = useCallback(() => {
        stopReferencePlayback();
        onClose();
    }, [onClose, stopReferencePlayback]);

    useEffect(() => {
        if (!isOpen) {
            stopReferencePlayback();
        }
        return () => {
            stopReferencePlayback();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!referenceAsset) {
            setReferencePreviewUrl('');
            return;
        }

        let cancelled = false;
        const resolveReference = async () => {
            const resolved = await speakerService.resolveVoiceAssetUrl(referenceAsset);

            if (!cancelled) {
                setReferencePreviewUrl(resolved || '');
            }
        };

        void resolveReference();

        return () => {
            cancelled = true;
        };
    }, [referenceAsset, speakerService]);

    const avatarUrl = useMemo(() => avatarAsset?.path || avatarAsset?.id || undefined, [avatarAsset]);
    const activeAvatarView = useMemo(
        () => AVATAR_VIEW_OPTIONS.find((item) => item.id === avatarViewMode) || AVATAR_VIEW_OPTIONS[0],
        [avatarViewMode]
    );
    const resolveAvatarModeLabel = (value: AvatarViewMode): string => {
        if (value === 'full-body') {
            return t('voice.lab.avatarMode.fullBody', 'Full Body');
        }
        if (value === 'three-view') {
            return t('voice.lab.avatarMode.threeView', 'Three View');
        }
        return t('voice.lab.avatarMode.portrait', 'Portrait');
    };
    const resolveAvatarModeHelper = (value: AvatarViewMode): string => {
        if (value === 'full-body') {
            return t('voice.lab.avatarMode.fullBodyHelper', 'Keep the full character frame for presentation.');
        }
        if (value === 'three-view') {
            return t('voice.lab.avatarMode.threeViewHelper', 'Multi-angle layout for downstream design extension.');
        }
        return t('voice.lab.avatarMode.portraitHelper', 'Focus on facial details for stronger identity.');
    };
    const resolveGenderLabel = (value: 'male' | 'female' | 'neutral'): string => {
        if (value === 'male') {
            return t('voice.common.gender.male', 'Male');
        }
        if (value === 'female') {
            return t('voice.common.gender.female', 'Female');
        }
        return t('voice.common.gender.neutral', 'Neutral');
    };
    const activeAvatarLabel = resolveAvatarModeLabel(activeAvatarView.id);
    const activeAvatarHelper = resolveAvatarModeHelper(activeAvatarView.id);
    const canSave = name.trim().length > 0 && (mode === 'design' || !!referenceAsset);

    const avatarContextText = useMemo(() => {
        const safeName = name.trim() || 'voice persona';
        const segments = [
            safeName,
            `voice style ${style}`,
            `gender ${gender}`,
            `avatar composition ${activeAvatarLabel}`,
            description.trim()
        ].filter((item) => item && item.length > 0);
        return segments.join(', ');
    }, [activeAvatarLabel, description, gender, name, style]);

    const AvatarAIGenerator: React.FC<AssetAIGeneratorProps> = ({ contextText, onClose: handleClose, onSuccess }) => (
        <AIImageGeneratorModal
            contextText={contextText}
            config={{ aspectRatio: activeAvatarView.aspectRatio }}
            onClose={handleClose}
            onSuccess={(result) => onSuccess(result)}
        />
    );

    const handleReferenceAssetChange = (asset: Asset | null) => {
        setReferenceAsset(asset);
        if (asset) {
            setCloneInputMethod('library');
        }
    };

    const handleReferenceUpload = async (file: UploadedVoiceReferenceInput) => {
        if (isReferenceImporting) {
            return;
        }
        setIsReferenceImporting(true);
        try {
            const imported = await speakerService.importReferenceAudioFromUpload(file, 'voice-lab-upload');
            setReferenceAsset(imported);
        } catch (error) {
            console.error('Failed to upload reference audio', error);
        } finally {
            setIsReferenceImporting(false);
        }
    };

    const handleRecordingComplete = async (blob: Blob) => {
        if (isReferenceImporting) {
            return;
        }
        setIsReferenceImporting(true);
        try {
            const fileName = `voice-lab-recording-${Date.now()}.webm`;
            const imported = await speakerService.importReferenceAudioFromBlob(blob, fileName, 'voice-lab-recorder');
            setReferenceAsset(imported);
        } catch (error) {
            console.error('Failed to import recorded reference audio', error);
        } finally {
            setIsReferenceImporting(false);
        }
    };

    const handleRecordingDelete = () => {
        setReferenceAsset(null);
        setReferencePreviewUrl('');
        stopReferencePlayback();
    };

    const handleToggleReferencePreview = async () => {
        if (!referencePreviewUrl) {
            return;
        }
        if (isReferencePlaying) {
            stopReferencePlayback();
            return;
        }

        stopReferencePlayback();
        const audio = await speakerService.playPreviewAudio(referencePreviewUrl, {
            onPlaying: () => setIsReferencePlaying(true),
            onEnded: () => {
                setIsReferencePlaying(false);
                referenceAudioRef.current = null;
            },
            onError: (error) => {
                console.error('Failed to play reference audio', error);
                setIsReferencePlaying(false);
                referenceAudioRef.current = null;
            }
        });
        referenceAudioRef.current = audio;
    };

    const clearReferenceAudio = () => {
        setReferenceAsset(null);
        setReferencePreviewUrl('');
        stopReferencePlayback();
    };

    const handleSave = async () => {
        if (!canSave) {
            return;
        }

        const now = Date.now();
        const voiceName = cleanName(
            name,
            mode === 'clone'
                ? t('voice.lab.fallback.clonedVoice', 'Cloned Voice')
                : t('voice.lab.fallback.customVoice', 'Custom Voice')
        );
        let sdkCloneTaskId: string | null = null;
        if (mode === 'clone' && referencePreviewUrl) {
            try {
                sdkCloneTaskId = await speakerService.submitCloneTask({
                    sampleAudioUrl: referencePreviewUrl,
                    speakerName: voiceName,
                    language
                });
            } catch (error) {
                console.warn('Failed to submit clone task to SDK', error);
            }
        }

        const cloneTags = ['clone', style];
        if (sdkCloneTaskId) {
            cloneTags.push(`sdk-task:${sdkCloneTaskId}`);
        }

        const voice: IVoice = {
            id: `voice-${mode}-${now}`,
            name: voiceName,
            language,
            gender,
            style,
            previewUrl: mode === 'clone' ? (referencePreviewUrl || STORAGE_SAFE_PREVIEW) : STORAGE_SAFE_PREVIEW,
            previewText: previewText.trim() || undefined,
            provider: mode === 'clone' ? 'SDK Voice Clone Lab' : 'Voice Design Lab',
            source: 'custom',
            description: description.trim() || undefined,
            avatarUrl,
            tags: mode === 'clone' ? cloneTags : ['design', style],
            createdAt: now
        };

        onSave(voice);
        closeModal();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="w-full max-w-4xl h-[84vh] rounded-2xl border border-[#2f2f34] bg-[#121214] shadow-2xl overflow-hidden flex flex-col p-0" showCloseButton={false}>
                <div className="h-16 px-6 border-b border-[#2a2a30] bg-[#18181b] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/25">
                            <AudioLines size={18} />
                        </div>
                        <div>
                            <h3 className="text-white text-base font-bold leading-tight">
                                {t('voice.lab.title', 'Voice Lab')}
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium">
                                {t('voice.lab.subtitle', 'Start with avatar to quickly design or clone a voice persona')}
                            </p>
                        </div>
                    </div>

                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            className="w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a30] transition-colors flex items-center justify-center"
                        >
                            <X size={18} />
                        </Button>
                    </DialogClose>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    <div className="flex items-center gap-2 bg-[#161618] border border-[#2c2c31] p-1 rounded-xl w-fit">
                        <Button
                            onClick={() => setMode('design')}
                            variant={mode === 'design' ? 'secondary' : 'ghost'}
                            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                            <Sparkles size={12} />
                            {t('voice.lab.modeDesign', 'Design Voice')}
                        </Button>
                        <Button
                            onClick={() => setMode('clone')}
                            variant={mode === 'clone' ? 'secondary' : 'ghost'}
                            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                            <Mic2 size={12} />
                            {t('voice.lab.modeClone', 'Clone Voice')}
                        </Button>
                    </div>

                    <div className="rounded-2xl border border-[#313138] bg-[#17171a] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                                    <ScanFace size={11} />
                                    {t('voice.lab.avatarTitle', 'Voice Avatar')}
                                </label>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {mode === 'clone'
                                        ? t(
                                              'voice.lab.avatarHintClone',
                                              'Clone persona cover - supports upload and AI generation'
                                          )
                                        : t(
                                              'voice.lab.avatarHintDesign',
                                              'Voice persona cover - supports upload and AI generation'
                                          )}
                                </p>
                            </div>
                            <div className="flex bg-[#18181b] rounded-lg p-0.5 border border-[#333] shrink-0">
                                {AVATAR_VIEW_OPTIONS.map((item) => {
                                    const Icon = item.icon;
                                    const label = resolveAvatarModeLabel(item.id);
                                    const helper = resolveAvatarModeHelper(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setAvatarViewMode(item.id)}
                                            className={`px-2.5 py-1 text-[10px] rounded-md transition-all inline-flex items-center gap-1.5 ${
                                                avatarViewMode === item.id
                                                    ? 'bg-[#333] text-white shadow-sm font-medium'
                                                    : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                            title={helper}
                                        >
                                            <Icon size={11} />
                                            <span className="hidden md:inline">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="relative h-[clamp(240px,38vh,340px)] rounded-xl border border-[#27272a] bg-[#101013] p-3">
                            <ChooseAsset
                                value={avatarAsset}
                                onChange={(asset) => setAvatarAsset(asset)}
                                accepts={['image']}
                                domain="voice-speaker"
                                label={t('voice.lab.avatarUploadLabel', 'Upload Avatar')}
                                className="h-full w-full bg-[#121214] border-[#27272a] hover:border-emerald-500/35"
                                aspectRatio="h-full"
                                imageFit="contain"
                                aiGenerator={AvatarAIGenerator}
                                contextText={avatarContextText}
                            />

                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[9px] font-bold text-gray-300 px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider pointer-events-none z-10">
                                {mode === 'clone'
                                    ? t('voice.lab.summary.modeClone', 'Clone')
                                    : t('voice.lab.summary.modeDesign', 'Design')}
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-gradient-to-r from-black/70 via-black/50 to-black/20 px-3 py-2 pointer-events-none z-10">
                                <div className="text-[10px] text-gray-100 font-semibold">
                                    {t('voice.lab.composition', 'Composition')}: {activeAvatarLabel}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{activeAvatarHelper}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#313138] bg-[#17171a] p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label={t('voice.lab.form.name', 'Voice Name *')}>
                            <Input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder={
                                    mode === 'clone'
                                        ? t('voice.lab.form.nameClonePlaceholder', 'e.g. My Clone Narration')
                                        : t('voice.lab.form.nameDesignPlaceholder', 'e.g. Tech Narrator')
                                }
                                className="bg-[#1a1a1d] border-[#313138] focus:border-emerald-500/60 placeholder:text-gray-500"
                            />
                        </Field>

                        <Field label={t('voice.lab.form.language', 'Language')}>
                            <Select value={language} onValueChange={(value) => setLanguage(value)}>
                                <SelectTrigger className="w-full h-10 rounded-xl bg-[#1a1a1d] border border-[#313138] px-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/60">
                                    <SelectValue placeholder={LANGUAGE_OPTIONS[0]} />
                                </SelectTrigger>
                                <SelectContent className="border-[#27272a] bg-[#1a1a1c] text-[#ffffff]">
                                    {LANGUAGE_OPTIONS.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label={t('voice.lab.form.gender', 'Gender')}>
                            <div className="flex items-center gap-1.5 bg-[#1a1a1d] border border-[#313138] rounded-xl p-1">
                                {GENDER_OPTIONS.map((item) => (
                                    <Button
                                        key={item}
                                        onClick={() => setGender(item)}
                                        variant={gender === item ? 'secondary' : 'ghost'}
                                        className="flex-1 h-8 rounded-lg text-xs font-semibold capitalize transition-colors"
                                    >
                                        {resolveGenderLabel(item)}
                                    </Button>
                                ))}
                            </div>
                            </Field>

                            <Field label={t('voice.lab.form.style', 'Style')}>
                            <Select value={style} onValueChange={(value) => setStyle(value)}>
                                <SelectTrigger className="w-full h-10 rounded-xl bg-[#1a1a1d] border border-[#313138] px-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/60">
                                    <SelectValue placeholder={STYLE_OPTIONS[0]} />
                                </SelectTrigger>
                                <SelectContent className="border-[#27272a] bg-[#1a1a1c] text-[#ffffff]">
                                    {STYLE_OPTIONS.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            </Field>
                        </div>

                        <Field label={t('voice.lab.form.description', 'Voice Description')}>
                            <Textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder={t(
                                    'voice.lab.form.descriptionPlaceholder',
                                    'Describe voice traits, e.g. warm, steady, clear rhythm, suitable for brand narration'
                                )}
                                rows={4}
                                className="bg-[#1a1a1d] border-[#313138] focus:border-emerald-500/60 resize-none"
                            />
                        </Field>

                        <Field label={t('voice.lab.form.previewText', 'Preview Text')}>
                            <Textarea
                                value={previewText}
                                onChange={(event) => setPreviewText(event.target.value)}
                                placeholder={t(
                                    'voice.lab.form.previewTextPlaceholder',
                                    'Enter text for voice preview playback'
                                )}
                                rows={3}
                                className="bg-[#1a1a1d] border-[#313138] focus:border-emerald-500/60 resize-none"
                            />
                        </Field>

                        {mode === 'clone' && (
                            <Field label={t('voice.lab.cloneReference.label', 'Clone Reference Audio *')}>
                                <div className="space-y-3">
                                    <div className="flex bg-[#1a1a1d] border border-[#313138] rounded-xl p-1">
                                        <Button
                                            onClick={() => setCloneInputMethod('upload')}
                                            variant={cloneInputMethod === 'upload' ? 'secondary' : 'ghost'}
                                            className="flex-1 h-8 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                                        >
                                            <Upload size={12} />
                                            {t('voice.lab.cloneReference.methodUpload', 'Upload')}
                                        </Button>
                                        <Button
                                            onClick={() => setCloneInputMethod('record')}
                                            variant={cloneInputMethod === 'record' ? 'secondary' : 'ghost'}
                                            className="flex-1 h-8 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                                        >
                                            <Mic size={12} />
                                            {t('voice.lab.cloneReference.methodRecord', 'Record')}
                                        </Button>
                                        <Button
                                            onClick={() => setCloneInputMethod('library')}
                                            variant={cloneInputMethod === 'library' ? 'secondary' : 'ghost'}
                                            className="flex-1 h-8 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                                        >
                                            <Library size={12} />
                                            {t('voice.lab.cloneReference.methodLibrary', 'Library')}
                                        </Button>
                                    </div>

                                    {referenceAsset ? (
                                        <div className="h-28 rounded-xl border border-[#313138] bg-[#1a1a1d] px-3 py-2 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-gray-200 truncate">
                                                    {t('voice.lab.cloneReference.readyTitle', 'Reference Audio Ready')}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1 truncate">
                                                    {referenceAsset.name || t('voice.lab.cloneReference.audioSample', 'Audio Sample')}
                                                </div>
                                                <div className="text-[10px] text-gray-600 mt-1">
                                                    {t(
                                                        'voice.lab.cloneReference.replaceHint',
                                                        'You can switch the source method to replace the sample.'
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Button
                                                    onClick={() => {
                                                        void handleToggleReferencePreview();
                                                    }}
                                                    disabled={!referencePreviewUrl}
                                                    variant="ghost"
                                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                                                        !referencePreviewUrl
                                                            ? 'border-[#2f2f34] text-gray-600 cursor-not-allowed'
                                                            : 'border-[#3a3a40] text-gray-300 hover:text-white hover:bg-[#26262a]'
                                                    }`}
                                                    title={t('voice.lab.cloneReference.play', 'Play')}
                                                >
                                                    {isReferencePlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                                                </Button>
                                                <Button
                                                    onClick={clearReferenceAudio}
                                                    variant="ghost"
                                                    className="w-8 h-8 rounded-lg border border-red-500/40 text-red-300 hover:text-white hover:bg-red-500/20 transition-colors flex items-center justify-center"
                                                    title={t('voice.lab.cloneReference.remove', 'Remove')}
                                                >
                                                    <Trash2 size={13} />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="min-h-[120px]">
                                            {cloneInputMethod === 'upload' && (
                                                <AudioUpload
                                                    value={null}
                                                    onChange={handleReferenceUpload}
                                                    label={t('voice.lab.cloneReference.localUploadLabel', 'Upload local reference audio')}
                                                    className="h-32 bg-[#1a1a1d] border-[#313138] hover:border-emerald-500/40"
                                                    aspectRatio="h-full"
                                                />
                                            )}

                                            {cloneInputMethod === 'record' && (
                                                <AudioRecorder
                                                    onRecordingComplete={handleRecordingComplete}
                                                    onDelete={handleRecordingDelete}
                                                    className="h-32 bg-[#1a1a1d] border-[#313138]"
                                                />
                                            )}

                                            {cloneInputMethod === 'library' && (
                                                <ChooseAsset
                                                    value={referenceAsset}
                                                    onChange={handleReferenceAssetChange}
                                                    accepts={['voice', 'audio', 'file']}
                                                    domain="voice-speaker"
                                                    label={t(
                                                        'voice.lab.cloneReference.uploadLabel',
                                                        'Select or upload reference audio'
                                                    )}
                                                    className="h-32 bg-[#1a1a1d] border-[#313138] hover:border-emerald-500/40"
                                                    aspectRatio="h-full"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {isReferenceImporting && (
                                        <div className="text-[10px] text-emerald-300 inline-flex items-center gap-1.5">
                                            <Loader2 size={11} className="animate-spin" />
                                            {t('voice.lab.cloneReference.importing', 'Importing reference audio...')}
                                        </div>
                                    )}
                                </div>
                            </Field>
                        )}
                    </div>

                    <div className="rounded-xl border border-[#313138] bg-[#17171a] p-4 space-y-2">
                        <div className="flex items-center gap-2 text-gray-300">
                            <UserRound size={14} />
                            <span className="text-xs font-semibold">
                                {t('voice.lab.summary.title', 'Preview Summary')}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400">
                            {mode === 'clone'
                                ? t(
                                      'voice.lab.summary.cloneDesc',
                                      'Generate similar timbre from reference audio for personalized narration and character dubbing.'
                                  )
                                : t(
                                      'voice.lab.summary.designDesc',
                                      'Create a reusable voice preset quickly with style and description.'
                                  )}
                        </p>
                        <div className="text-[11px] text-gray-500">
                            <div>
                                {t('voice.lab.summary.name', 'Name')}:{' '}
                                {cleanName(
                                    name,
                                    mode === 'clone'
                                        ? t('voice.lab.fallback.clonedVoice', 'Cloned Voice')
                                        : t('voice.lab.fallback.customVoice', 'Custom Voice')
                                )}
                            </div>
                            <div>{t('voice.lab.summary.language', 'Language')}: {language}</div>
                            <div>{t('voice.lab.summary.style', 'Style')}: {style}</div>
                            <div>
                                {t('voice.lab.summary.previewText', 'Preview Text')}:{' '}
                                {previewText.trim() || t('voice.lab.summary.previewTextEmpty', 'Not set')}
                            </div>
                            <div>{t('voice.lab.summary.composition', 'Avatar Composition')}: {activeAvatarLabel}</div>
                            <div>
                                {t('voice.lab.summary.mode', 'Mode')}:{' '}
                                {mode === 'clone'
                                    ? t('voice.lab.summary.modeClone', 'Clone')
                                    : t('voice.lab.summary.modeDesign', 'Design')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-16 border-t border-[#2a2a30] bg-[#18181b] px-6 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        {mode === 'clone'
                            ? t('voice.lab.footer.cloneHint', 'Recommended: upload 10-60 seconds of clean speech sample')
                            : t('voice.lab.footer.designHint', 'After saving, it will appear in "My Voices"')}
                    </span>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={closeModal} className="px-5">
                            {t('voice.lab.footer.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                void handleSave();
                            }}
                            disabled={!canSave}
                            className="px-6 bg-emerald-600 hover:bg-emerald-500 border-0"
                        >
                            {t('voice.lab.footer.save', 'Save to Voice Library')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{label}</Label>
        {children}
    </div>
);
