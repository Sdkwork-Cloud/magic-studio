import React, { useMemo } from 'react';
import { Play, Pause, Check, User, Mic2, Sparkles, Database, AudioLines, Languages } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import type { IVoice } from './types';

interface VoiceCardProps {
    voice: IVoice;
    isSelected: boolean;
    isPlaying: boolean;
    onClick: () => void;
    onPlay: (e: React.MouseEvent) => void;
}

const sourceBadge = (
    source: string | undefined,
    t: (key: string, paramsOrDefault?: Record<string, string> | string) => string
): { label: string; icon: React.ReactNode; className: string } => {
    if (source === 'custom') {
        return {
            label: t('voice.card.sourceCustom', 'Custom'),
            icon: <Sparkles size={10} />,
            className: 'bg-emerald-600/20 text-emerald-300 border-emerald-400/30'
        };
    }
    if (source === 'workspace') {
        return {
            label: t('voice.card.sourceWorkspace', 'Workspace'),
            icon: <Database size={10} />,
            className: 'bg-cyan-600/20 text-cyan-300 border-cyan-400/30'
        };
    }
    return {
        label: t('voice.card.sourceMarket', 'Market'),
        icon: <Mic2 size={10} />,
        className: 'bg-indigo-600/20 text-indigo-300 border-indigo-400/30'
    };
};

const normalizeHash = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) % 997;
    }
    return hash;
};

export const VoiceCard: React.FC<VoiceCardProps> = ({
    voice,
    isSelected,
    isPlaying,
    onClick,
    onPlay
}) => {
    const { t } = useTranslation();

    const displayGender = useMemo(() => {
        const normalized = String(voice.gender || '').toLowerCase();
        if (normalized === 'male') {
            return t('voice.common.gender.male', 'Male');
        }
        if (normalized === 'female') {
            return t('voice.common.gender.female', 'Female');
        }
        if (normalized === 'neutral') {
            return t('voice.common.gender.neutral', 'Neutral');
        }
        return voice.gender;
    }, [t, voice.gender]);

    const bars = useMemo(() => {
        const seed = normalizeHash(voice.id || voice.name);
        return Array.from({ length: 12 }).map((_, index) => {
            const value = ((seed + index * 17) % 70) + 20;
            return value;
        });
    }, [voice.id, voice.name]);

    const badge = sourceBadge(voice.source, t);
    const providerLabel = voice.provider || t('voice.card.providerFallback', 'Voice Provider');
    const styleLabel = (voice.style || '').trim() || t('voice.card.styleFallback', 'Neutral');
    const languageLabel = (voice.language || 'en-US').toUpperCase();
    const description =
        (voice.description || '').trim() ||
        (voice.previewText || '').trim() ||
        t('voice.card.descriptionFallback', 'Good for narration, video, and character dubbing');

    return (
        <div
            onClick={onClick}
            className={`
                group relative flex flex-col p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                ${isSelected
                    ? 'bg-[#1d1f35] border-indigo-500 ring-1 ring-indigo-500/45 shadow-lg shadow-indigo-900/20'
                    : 'bg-[#222225] border-[#333] hover:border-[#4a4a52] hover:bg-[#2a2a2f] hover:shadow-md'
                }
            `}
        >
            <div
                className={`
                    absolute inset-0 pointer-events-none transition-opacity
                    ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}
                `}
            >
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_65%)]" />
            </div>

            <div className="relative flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                        <div
                            className={`
                                w-11 h-11 rounded-xl border flex items-center justify-center overflow-hidden
                                ${isSelected
                                    ? 'bg-indigo-500/30 border-indigo-400/60 text-indigo-100'
                                    : 'bg-[#17171a] text-gray-500 border-[#333] group-hover:text-gray-300'
                                }
                            `}
                        >
                            <User size={18} strokeWidth={2.2} />
                        </div>

                        <button
                            onClick={onPlay}
                            title={
                                isPlaying
                                    ? t('voice.card.pausePreview', 'Pause preview')
                                    : t('voice.card.playPreview', 'Play preview')
                            }
                            className={`
                                absolute -right-1 -bottom-1 h-6 w-6 rounded-full border flex items-center justify-center transition-colors
                                ${isPlaying
                                    ? 'bg-indigo-500 border-indigo-300 text-white'
                                    : 'bg-[#111115] border-[#303037] text-gray-300 hover:bg-indigo-500 hover:border-indigo-400 hover:text-white'
                                }
                            `}
                        >
                            {isPlaying ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-[1px]" />}
                        </button>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-100' : 'text-gray-100'}`}>
                            {voice.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{providerLabel}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${badge.className}`}
                    >
                        {badge.icon}
                        {badge.label}
                    </span>
                    {isSelected && (
                        <div className="bg-indigo-500 text-white rounded-full p-1 shadow-sm">
                            <Check size={10} strokeWidth={3.5} />
                        </div>
                    )}
                </div>
            </div>

            <div className="relative text-[11px] text-gray-400 leading-relaxed min-h-[2.9rem] mb-2">
                <p className="line-clamp-2">{description}</p>
            </div>

            <div className="relative h-6 flex items-end gap-0.5 mt-auto opacity-60 group-hover:opacity-80 transition-opacity">
                {bars.map((height, index) => (
                    <div
                        key={`${voice.id}-bar-${index}`}
                        className={`w-1 rounded-full transition-all duration-300 ${
                            isPlaying ? 'bg-indigo-300 animate-music-bar' : 'bg-gray-500'
                        }`}
                        style={{
                            height: `${height}%`,
                            animationDelay: `${index * 0.05}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#333]/60">
                <Badge icon={<Languages size={10} />} label={languageLabel} />
                <Badge icon={<User size={10} />} label={displayGender} />
                <Badge icon={<Mic2 size={10} />} label={styleLabel} />
                {isPlaying && <Badge icon={<AudioLines size={10} />} label={t('voice.card.playing', 'Playing')} />}
            </div>

            <style>{`
                @keyframes music-bar {
                    0%, 100% { transform: scaleY(0.35); }
                    50% { transform: scaleY(1); }
                }
                .animate-music-bar {
                    transform-origin: bottom center;
                    animation: music-bar 0.9s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

const Badge: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <span className="flex items-center gap-1 text-[9px] text-gray-300 capitalize bg-[#1a1a1c] px-1.5 py-0.5 rounded border border-[#333]">
        {icon}
        {label}
    </span>
);
