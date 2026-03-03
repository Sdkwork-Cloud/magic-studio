import React, { useMemo, useState } from 'react';
import { Mic2, ChevronDown, Sparkles } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { ChooseVoiceSpeakerModal } from './ChooseVoiceSpeakerModal';
import { VoicePreviewButton } from './VoicePreviewButton';
import type { ChooseVoiceSpeakerProps, IVoice } from './types';

export const ChooseVoiceSpeaker: React.FC<ChooseVoiceSpeakerProps> = ({
    value,
    onChange,
    label,
    voices,
    className = '',
    readOnly = false
}) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialView, setInitialView] = useState<'library' | 'lab'>('library');

    const selectedVoice = useMemo<IVoice | null>(() => {
        if (typeof value === 'object' && value) {
            return value;
        }
        const selectedId = typeof value === 'string' ? value : '';
        if (!selectedId || !voices || voices.length === 0) {
            return null;
        }
        return voices.find((item) => item.id === selectedId) || null;
    }, [value, voices]);

    const selectedVoiceId = typeof value === 'object' ? value?.id : value;

    const handleConfirm = (voice: IVoice): void => {
        onChange(voice);
    };

    const displayLabel = label || t('voice.choose.defaultLabel', 'Voice');

    const openLibrary = (): void => {
        if (readOnly) {
            return;
        }
        setInitialView('library');
        setIsModalOpen(true);
    };

    const openLab = (event: React.MouseEvent): void => {
        event.stopPropagation();
        if (readOnly) {
            return;
        }
        setInitialView('lab');
        setIsModalOpen(true);
    };

    const handleContainerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (readOnly) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLibrary();
        }
    };

    const selectedGender = useMemo(() => {
        const normalized = String(selectedVoice?.gender || 'neutral').toLowerCase();
        if (normalized === 'male') {
            return t('voice.common.gender.male', 'Male');
        }
        if (normalized === 'female') {
            return t('voice.common.gender.female', 'Female');
        }
        return t('voice.common.gender.neutral', 'Neutral');
    }, [selectedVoice?.gender, t]);

    const selectedStyle = (selectedVoice?.style || '').trim() || t('voice.card.styleFallback', 'Neutral');

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Mic2 size={12} className="text-indigo-400" />
                    {displayLabel}
                </label>
                {!readOnly && (
                    <button
                        onClick={openLab}
                        className="h-7 px-2.5 rounded-md text-[10px] font-semibold text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors inline-flex items-center gap-1"
                        title={t('voice.choose.openLabTitle', 'Open Voice Lab')}
                    >
                        <Sparkles size={10} />
                        {t('voice.choose.openLab', 'Lab')}
                    </button>
                )}
            </div>

            <div
                onClick={openLibrary}
                onKeyDown={handleContainerKeyDown}
                role={readOnly ? undefined : 'button'}
                tabIndex={readOnly ? -1 : 0}
                className={`
                    group relative flex items-center justify-between gap-3 p-3 rounded-xl border transition-all outline-none
                    ${readOnly
                        ? 'border-[#333] bg-[#161618] cursor-default opacity-80'
                        : 'border-[#333] bg-[#18181b] hover:border-[#555] hover:bg-[#202023] cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500/60'
                    }
                `}
            >
                <div className="absolute inset-0 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_65%)]" />

                <div className="relative flex items-center gap-3 min-w-0 flex-1">
                    <div
                        className={`
                            w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0
                            ${selectedVoiceId
                                ? 'bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 border-indigo-400/30 text-indigo-200'
                                : 'bg-[#252526] border-[#333] text-gray-500'
                            }
                        `}
                    >
                        {selectedVoice?.name ? selectedVoice.name[0]?.toUpperCase() : <Mic2 size={14} />}
                    </div>

                    <div className="min-w-0 flex-1">
                        {selectedVoiceId ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold text-gray-100 truncate">
                                        {selectedVoice?.name || selectedVoiceId}
                                    </div>
                                    <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[9px] text-indigo-200 shrink-0">
                                        {t('voice.choose.selectedTag', 'Current')}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                    {selectedVoice?.provider || t('voice.choose.providerFallback', 'Voice')}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                                    <span className="rounded bg-[#232327] border border-[#34343a] px-1.5 py-0.5 text-gray-300">
                                        {(selectedVoice?.language || 'en-US').toUpperCase()}
                                    </span>
                                    <span className="rounded bg-[#232327] border border-[#34343a] px-1.5 py-0.5 text-gray-300">
                                        {selectedGender}
                                    </span>
                                    <span className="rounded bg-[#232327] border border-[#34343a] px-1.5 py-0.5 text-gray-300 truncate max-w-[8rem]">
                                        {selectedStyle}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-gray-300">
                                    {t('voice.choose.emptyTitle', 'Select Voice')}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    {t('voice.choose.emptySubtitle', 'Supports market voices and custom cloning')}
                                </div>
                                <div className="mt-1 text-[10px] text-gray-600">
                                    {t('voice.choose.hint', 'Tap to open the voice market and voice lab')}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="relative flex items-center gap-2 ml-2">
                    {selectedVoice?.previewUrl && (
                        <div onClick={(event) => event.stopPropagation()}>
                            <VoicePreviewButton url={selectedVoice.previewUrl} className="w-7 h-7" />
                        </div>
                    )}

                    {!readOnly && (
                        <>
                            <div className="w-px h-4 bg-[#333]" />
                            <ChevronDown size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </>
                    )}
                </div>
            </div>

            <ChooseVoiceSpeakerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                selectedId={selectedVoiceId}
                voices={voices}
                title={displayLabel}
                initialView={initialView}
            />
        </div>
    );
};
