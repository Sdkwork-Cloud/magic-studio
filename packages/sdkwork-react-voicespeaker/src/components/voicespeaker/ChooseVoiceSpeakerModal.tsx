import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Search,
    X,
    Filter,
    Mic2,
    Users,
    Globe,
    Volume2,
    Sparkles,
    FileAudio,
    RefreshCcw,
    SlidersHorizontal,
    Wand2
} from 'lucide-react';
import { Button } from '@sdkwork/react-commons';
import { useTranslation } from '@sdkwork/react-i18n';
import { voiceBusinessService } from '../../services';
import { VoiceCard } from './VoiceCard';
import { VoiceLabModal } from './VoiceLabModal';
import type { ChooseVoiceSpeakerModalProps, IVoice } from './types';

const DEFAULT_PREVIEW = voiceBusinessService.voiceSpeakerService.DEFAULT_PREVIEW;

type VoiceCollection = 'market' | 'mine';
type VoiceLabEntry = 'design' | 'clone';
type VoiceSortBy = 'recommended' | 'newest' | 'name';

const SORT_OPTIONS: ReadonlyArray<VoiceSortBy> = ['recommended', 'newest', 'name'];

export const ChooseVoiceSpeakerModal: React.FC<ChooseVoiceSpeakerModalProps> = ({
    isOpen,
    onClose,
    selectedId,
    onConfirm,
    voices: propVoices,
    title,
    initialView = 'library'
}) => {
    const { t } = useTranslation();
    const speakerService = voiceBusinessService.voiceSpeakerService;
    const [marketVoices, setMarketVoices] = useState<IVoice[]>([]);
    const [workspaceVoices, setWorkspaceVoices] = useState<IVoice[]>([]);
    const [customVoices, setCustomVoices] = useState<IVoice[]>([]);

    const [loadingMarket, setLoadingMarket] = useState(false);
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);

    const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(selectedId || null);
    const [activeCollection, setActiveCollection] = useState<VoiceCollection>('market');

    const [showVoiceLab, setShowVoiceLab] = useState(false);
    const [voiceLabEntry, setVoiceLabEntry] = useState<VoiceLabEntry>('design');

    const [searchQuery, setSearchQuery] = useState('');
    const [activeGender, setActiveGender] = useState<string>('all');
    const [activeLang, setActiveLang] = useState<string>('all');
    const [activeProvider, setActiveProvider] = useState<string>('all');
    const [activeStyle, setActiveStyle] = useState<string>('all');
    const [sortBy, setSortBy] = useState<VoiceSortBy>('recommended');

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const genderOptions: ReadonlyArray<'all' | 'male' | 'female' | 'neutral'> = ['all', 'male', 'female', 'neutral'];
    const resolveGenderLabel = (value: 'all' | 'male' | 'female' | 'neutral'): string => {
        if (value === 'all') {
            return t('voice.selector.all', 'All');
        }
        if (value === 'male') {
            return t('voice.common.gender.male', 'Male');
        }
        if (value === 'female') {
            return t('voice.common.gender.female', 'Female');
        }
        return t('voice.common.gender.neutral', 'Neutral');
    };

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            speakerService.stopPreviewAudio(audioRef.current);
            audioRef.current = null;
        }
        setPlayingVoiceId(null);
    }, [speakerService]);

    const loadMarket = useCallback(async () => {
        setLoadingMarket(true);
        try {
            const voices = await speakerService.getMarketVoices(propVoices);
            setMarketVoices(voices);
        } catch (error) {
            console.error('Failed to load market voices', error);
            setMarketVoices([]);
        } finally {
            setLoadingMarket(false);
        }
    }, [propVoices, speakerService]);

    const loadWorkspace = useCallback(async () => {
        setLoadingWorkspace(true);
        try {
            const voices = await speakerService.getWorkspaceVoices();
            setWorkspaceVoices(voices);
        } catch (error) {
            console.warn('Failed to load workspace voices', error);
            setWorkspaceVoices([]);
        } finally {
            setLoadingWorkspace(false);
        }
    }, [speakerService]);

    useEffect(() => {
        if (!isOpen) {
            stopAudio();
            return;
        }

        setCurrentSelectedId(selectedId || null);
        setSearchQuery('');
        setActiveGender('all');
        setActiveLang('all');
        setActiveProvider('all');
        setActiveStyle('all');
        setSortBy('recommended');
        setCustomVoices(speakerService.loadCustomVoices());

        if (initialView === 'lab') {
            setActiveCollection('mine');
            setShowVoiceLab(true);
            setVoiceLabEntry('design');
        } else {
            setActiveCollection('market');
            setShowVoiceLab(false);
        }

        void loadMarket();
        void loadWorkspace();
    }, [initialView, isOpen, loadMarket, loadWorkspace, selectedId, stopAudio]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const mineVoices = useMemo(
        () => speakerService.dedupeVoices([...customVoices, ...workspaceVoices]),
        [customVoices, speakerService, workspaceVoices]
    );
    const visibleVoices = activeCollection === 'market' ? marketVoices : mineVoices;

    const languages = useMemo(() => {
        const languageSet = new Set<string>();
        visibleVoices.forEach((voice) => {
            const lang = speakerService.safeString(voice.language, 'en-US');
            const shortLang = lang.split('-')[0];
            languageSet.add(shortLang);
        });
        return Array.from(languageSet).sort();
    }, [speakerService, visibleVoices]);

    const providerOptions = useMemo(() => {
        const providerSet = new Set<string>();
        visibleVoices.forEach((voice) => {
            const provider = speakerService.safeString(
                voice.provider,
                t('voice.selector.providerUnknown', 'Unknown')
            );
            providerSet.add(provider);
        });
        return Array.from(providerSet).sort((left, right) => left.localeCompare(right));
    }, [speakerService, t, visibleVoices]);

    const styleOptions = useMemo(() => {
        const styleSet = new Set<string>();
        visibleVoices.forEach((voice) => {
            const style = speakerService.safeString(voice.style, t('voice.selector.styleNeutral', 'Neutral'));
            styleSet.add(style);
        });
        return Array.from(styleSet).sort((left, right) => left.localeCompare(right));
    }, [speakerService, t, visibleVoices]);

    useEffect(() => {
        if (activeLang !== 'all' && !languages.includes(activeLang)) {
            setActiveLang('all');
        }
    }, [activeLang, languages]);

    useEffect(() => {
        if (activeProvider !== 'all' && !providerOptions.includes(activeProvider)) {
            setActiveProvider('all');
        }
    }, [activeProvider, providerOptions]);

    useEffect(() => {
        if (activeStyle !== 'all' && !styleOptions.includes(activeStyle)) {
            setActiveStyle('all');
        }
    }, [activeStyle, styleOptions]);

    const filteredVoices = useMemo(() => {
        return visibleVoices.filter((voice) => {
            const target = `${voice.name} ${voice.style || ''} ${voice.provider || ''}`.toLowerCase();
            const keyword = searchQuery.trim().toLowerCase();
            const matchSearch = !keyword || target.includes(keyword);
            const matchGender = activeGender === 'all' || speakerService.safeGender(voice.gender) === activeGender;
            const matchLang =
                activeLang === 'all' ||
                speakerService.safeString(voice.language).toLowerCase().startsWith(activeLang.toLowerCase());
            const matchProvider =
                activeProvider === 'all' ||
                speakerService.safeString(voice.provider, t('voice.selector.providerUnknown', 'Unknown')) ===
                    activeProvider;
            const matchStyle =
                activeStyle === 'all' ||
                speakerService.safeString(voice.style, t('voice.selector.styleNeutral', 'Neutral')) === activeStyle;
            return matchSearch && matchGender && matchLang && matchProvider && matchStyle;
        });
    }, [activeGender, activeLang, activeProvider, activeStyle, searchQuery, speakerService, t, visibleVoices]);

    const sortedVoices = useMemo(() => {
        const list = [...filteredVoices];
        const sourcePriority: Record<string, number> = { custom: 0, workspace: 1, market: 2 };
        if (sortBy === 'name') {
            list.sort((left, right) => left.name.localeCompare(right.name));
            return list;
        }

        if (sortBy === 'newest') {
            list.sort((left, right) => {
                const leftCreated = typeof left.createdAt === 'number' ? left.createdAt : 0;
                const rightCreated = typeof right.createdAt === 'number' ? right.createdAt : 0;
                return rightCreated - leftCreated;
            });
            return list;
        }

        list.sort((left, right) => {
            if (left.id === currentSelectedId) {
                return -1;
            }
            if (right.id === currentSelectedId) {
                return 1;
            }
            const leftPriority = sourcePriority[speakerService.safeString(left.source, 'market')] ?? 99;
            const rightPriority = sourcePriority[speakerService.safeString(right.source, 'market')] ?? 99;
            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }
            const leftCreated = typeof left.createdAt === 'number' ? left.createdAt : 0;
            const rightCreated = typeof right.createdAt === 'number' ? right.createdAt : 0;
            return rightCreated - leftCreated;
        });
        return list;
    }, [currentSelectedId, filteredVoices, sortBy, speakerService]);

    const allVoices = useMemo(
        () => speakerService.dedupeVoices([...marketVoices, ...mineVoices]),
        [marketVoices, mineVoices, speakerService]
    );
    const selectedVoice = useMemo(
        () => allVoices.find((voice) => voice.id === currentSelectedId) || null,
        [allVoices, currentSelectedId]
    );

    const isLoading = loadingMarket || (activeCollection === 'mine' && loadingWorkspace);
    const displayTitle = title || t('voice.selector.title', 'Select Voice');
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim().length > 0) {
            count += 1;
        }
        if (activeGender !== 'all') {
            count += 1;
        }
        if (activeLang !== 'all') {
            count += 1;
        }
        if (activeProvider !== 'all') {
            count += 1;
        }
        if (activeStyle !== 'all') {
            count += 1;
        }
        return count;
    }, [activeGender, activeLang, activeProvider, activeStyle, searchQuery]);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setActiveGender('all');
        setActiveLang('all');
        setActiveProvider('all');
        setActiveStyle('all');
        setSortBy('recommended');
    }, []);

    const selectedMeta = useMemo(() => {
        if (!selectedVoice) {
            return [];
        }
        return [
            speakerService.safeString(selectedVoice.language, 'en-US'),
            resolveGenderLabel(speakerService.safeGender(selectedVoice.gender)),
            speakerService.safeString(selectedVoice.style, t('voice.selector.styleNeutral', 'Neutral'))
        ];
    }, [selectedVoice, speakerService, t]);

    const handlePlayToggle = async (event: React.MouseEvent, voice: IVoice) => {
        event.stopPropagation();

        if (playingVoiceId === voice.id) {
            stopAudio();
            return;
        }

        stopAudio();

        const preview = speakerService.safeString(voice.previewUrl, DEFAULT_PREVIEW);
        if (!preview) {
            return;
        }

        const audio = await speakerService.playPreviewAudio(preview, {
            onPlaying: () => setPlayingVoiceId(voice.id),
            onEnded: () => {
                setPlayingVoiceId(null);
                audioRef.current = null;
            },
            onError: (error) => {
                console.error('Audio playback error', error);
                setPlayingVoiceId(null);
                audioRef.current = null;
            }
        });
        audioRef.current = audio;
    };

    const handleConfirm = () => {
        if (!selectedVoice) {
            return;
        }
        onConfirm(selectedVoice);
        onClose();
    };

    const handleVoiceCreated = (voice: IVoice) => {
        const normalized = speakerService.normalizeVoice(voice, 'custom');
        setCustomVoices((prev) => {
            const next = speakerService.dedupeVoices([normalized, ...prev]);
            speakerService.saveCustomVoices(next);
            return next;
        });
        setActiveCollection('mine');
        setCurrentSelectedId(normalized.id);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-7xl h-[86vh] bg-[#121212] border border-[#333] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex-none border-b border-[#27272a] bg-[#18181b] px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <Mic2 size={18} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-white font-bold text-base leading-tight truncate">{displayTitle}</h3>
                                <p className="text-[10px] text-gray-500 font-medium">
                                    {t('voice.selector.subtitle', 'Market selection + custom voice cloning')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setVoiceLabEntry('design');
                                    setShowVoiceLab(true);
                                }}
                                className="h-9 text-xs px-3 border-indigo-500/30 text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20"
                            >
                                <Sparkles size={13} className="mr-1.5" />
                                {t('voice.selector.openLabButton', 'Voice Lab')}
                            </Button>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white p-2 hover:bg-[#27272a] rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-[#0f0f10] border border-[#2c2c31] rounded-xl p-1">
                            <button
                                onClick={() => setActiveCollection('market')}
                                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                                    activeCollection === 'market'
                                        ? 'bg-[#2f2f35] text-white'
                                        : 'text-gray-500 hover:text-gray-200'
                                }`}
                            >
                                {t('voice.selector.collectionMarket', 'Market')} ({marketVoices.length})
                            </button>
                            <button
                                onClick={() => setActiveCollection('mine')}
                                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                                    activeCollection === 'mine'
                                        ? 'bg-[#2f2f35] text-white'
                                        : 'text-gray-500 hover:text-gray-200'
                                }`}
                            >
                                {t('voice.selector.collectionMine', 'My Voices')} ({mineVoices.length})
                            </button>
                        </div>

                        <div className="relative w-[340px] max-w-full">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder={t('voice.selector.searchPlaceholder', 'Search by name / style / provider...')}
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full h-9 bg-[#0a0a0a] border border-[#333] rounded-lg pl-9 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/60"
                            />
                        </div>

                        <div className="inline-flex h-9 items-center rounded-lg border border-[#333] bg-[#111113] px-3 text-xs text-gray-400">
                            {filteredVoices.length}/{visibleVoices.length} {t('voice.selector.resultCount', 'voices')}
                        </div>

                        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#333] bg-[#111113]">
                            <SlidersHorizontal size={12} className="text-gray-500" />
                            <span className="text-[11px] text-gray-500">{t('voice.selector.sortBy', 'Sort')}</span>
                            <select
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value as VoiceSortBy)}
                                className="bg-transparent text-xs text-gray-200 outline-none"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option} value={option} className="bg-[#1b1b1f]">
                                        {option === 'recommended'
                                            ? t('voice.selector.sortRecommended', 'Recommended')
                                            : option === 'newest'
                                              ? t('voice.selector.sortNewest', 'Newest')
                                              : t('voice.selector.sortName', 'Name')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                void loadMarket();
                                void loadWorkspace();
                            }}
                            className="h-9 px-3 rounded-lg border border-[#333] bg-[#1d1d20] text-gray-300 text-xs font-semibold hover:bg-[#252529] transition-colors inline-flex items-center gap-1.5"
                        >
                            <RefreshCcw size={12} />
                            {t('voice.selector.refreshList', 'Refresh')}
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-72 bg-[#141414] border-r border-[#27272a] flex flex-col py-5">
                        <div className="px-5 mb-3 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <Filter size={12} />
                            {t('voice.selector.filtersTitle', 'Filters')}
                            {activeFilterCount > 0 && (
                                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-200">
                                    {activeFilterCount}
                                </span>
                            )}
                        </div>

                        <div className="px-5 space-y-6 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="text-xs text-gray-400 font-semibold mb-2 block flex items-center gap-2">
                                    <Users size={12} />
                                    {t('voice.selector.genderTitle', 'Gender')}
                                </label>
                                <div className="space-y-1">
                                    {genderOptions.map((genderOption) => (
                                        <button
                                            key={genderOption}
                                            onClick={() => setActiveGender(genderOption)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                                                activeGender === genderOption
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-500 hover:text-gray-200 hover:bg-[#252526]'
                                            }`}
                                        >
                                            {resolveGenderLabel(genderOption)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 font-semibold mb-2 block flex items-center gap-2">
                                    <Globe size={12} />
                                    {t('voice.selector.languageTitle', 'Language')}
                                </label>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setActiveLang('all')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                            activeLang === 'all'
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-500 hover:text-gray-200 hover:bg-[#252526]'
                                        }`}
                                    >
                                        {t('voice.selector.all', 'All')}
                                    </button>
                                    {languages.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setActiveLang(lang)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm uppercase transition-colors ${
                                                activeLang === lang
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-500 hover:text-gray-200 hover:bg-[#252526]'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 font-semibold mb-2 block flex items-center gap-2">
                                    <Mic2 size={12} />
                                    {t('voice.selector.providerTitle', 'Provider')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <FilterChip
                                        selected={activeProvider === 'all'}
                                        label={t('voice.selector.all', 'All')}
                                        onClick={() => setActiveProvider('all')}
                                    />
                                    {providerOptions.map((provider) => (
                                        <FilterChip
                                            key={provider}
                                            selected={activeProvider === provider}
                                            label={provider}
                                            onClick={() => setActiveProvider(provider)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 font-semibold mb-2 block flex items-center gap-2">
                                    <Wand2 size={12} />
                                    {t('voice.selector.styleTitle', 'Style')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <FilterChip
                                        selected={activeStyle === 'all'}
                                        label={t('voice.selector.all', 'All')}
                                        onClick={() => setActiveStyle('all')}
                                    />
                                    {styleOptions.map((style) => (
                                        <FilterChip
                                            key={style}
                                            selected={activeStyle === style}
                                            label={style}
                                            onClick={() => setActiveStyle(style)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[#2a2a2f]">
                                <label className="text-xs text-gray-400 font-semibold mb-2 block">
                                    {t('voice.selector.quickActions', 'Quick Actions')}
                                </label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setVoiceLabEntry('design');
                                            setShowVoiceLab(true);
                                        }}
                                        className="w-full h-9 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-colors text-left inline-flex items-center gap-1.5"
                                    >
                                        <Sparkles size={12} />
                                        <span className="flex-1">{t('voice.selector.quickDesign', 'Quick Voice Design')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setVoiceLabEntry('clone');
                                            setShowVoiceLab(true);
                                        }}
                                        className="w-full h-9 px-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors text-left inline-flex items-center gap-1.5"
                                    >
                                        <FileAudio size={12} />
                                        <span className="flex-1">{t('voice.selector.quickClone', 'Clone My Voice')}</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="w-full h-9 px-3 rounded-lg border border-[#333] bg-[#1c1c20] text-gray-300 text-xs font-semibold hover:bg-[#242429] transition-colors"
                            >
                                {t('voice.selector.clearFilters', 'Clear filters')}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#0a0a0a] overflow-y-auto custom-scrollbar relative">
                        <div className="sticky top-0 z-10 border-b border-[#1f1f22] bg-[#0e0e10]/95 px-6 py-3 backdrop-blur">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs text-gray-400">
                                    {t('voice.selector.filterSummary', 'Current filters')}:&nbsp;
                                    <span className="text-gray-200">
                                        {activeFilterCount > 0
                                            ? `${activeFilterCount} ${t('voice.selector.filterCountSuffix', 'active')}`
                                            : t('voice.selector.filterNone', 'none')}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {activeProvider !== 'all' && (
                                        <InlineTag label={`${t('voice.selector.providerTitle', 'Provider')}: ${activeProvider}`} />
                                    )}
                                    {activeStyle !== 'all' && (
                                        <InlineTag label={`${t('voice.selector.styleTitle', 'Style')}: ${activeStyle}`} />
                                    )}
                                    {activeLang !== 'all' && (
                                        <InlineTag
                                            label={`${t('voice.selector.languageTitle', 'Language')}: ${activeLang.toUpperCase()}`}
                                        />
                                    )}
                                    {activeGender !== 'all' && (
                                        <InlineTag
                                            label={`${t('voice.selector.genderTitle', 'Gender')}: ${resolveGenderLabel(
                                                speakerService.safeGender(activeGender)
                                            )}`}
                                        />
                                    )}
                                    {searchQuery.trim().length > 0 && (
                                        <InlineTag label={`${t('voice.selector.searchPlaceholder', 'Search')}: ${searchQuery}`} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center text-gray-500 gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="text-sm font-medium ml-2">
                                    {t('voice.selector.loadingVoices', 'Loading voices...')}
                                </span>
                            </div>
                        ) : filteredVoices.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-3">
                                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#333]">
                                    <Volume2 size={32} className="opacity-25" />
                                </div>
                                <p className="text-sm">
                                    {activeCollection === 'mine'
                                        ? t('voice.selector.emptyMine', 'No custom voices yet. Try Voice Lab.')
                                        : t('voice.selector.emptyMarket', 'No market voices match your filters.')}
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={clearFilters}
                                        className="text-indigo-400 hover:underline text-xs"
                                    >
                                        {t('voice.selector.clearFilters', 'Clear filters')}
                                    </button>
                                    {activeCollection === 'mine' && (
                                        <button
                                            onClick={() => {
                                                setVoiceLabEntry('design');
                                                setShowVoiceLab(true);
                                            }}
                                            className="text-emerald-300 hover:underline text-xs"
                                        >
                                            {t('voice.selector.openLabButton', 'Voice Lab')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {sortedVoices.map((voice) => (
                                    <VoiceCard
                                        key={voice.id}
                                        voice={voice}
                                        isSelected={currentSelectedId === voice.id}
                                        isPlaying={playingVoiceId === voice.id}
                                        onClick={() => setCurrentSelectedId(voice.id)}
                                        onPlay={(event) => {
                                            void handlePlayToggle(event, voice);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                <div className="flex-none h-20 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between px-8">
                    <div className="min-w-0 flex items-center gap-3">
                        {selectedVoice ? (
                            <>
                                <div className="h-11 w-11 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 flex items-center justify-center font-bold text-sm shrink-0">
                                    {selectedVoice.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm text-gray-100 font-semibold truncate">
                                        {t('voice.selector.selectedPrefix', 'Selected')}:
                                        <span className="ml-1 text-white">{selectedVoice.name}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                                        <span>{selectedVoice.provider || selectedVoice.source}</span>
                                        {selectedMeta.map((item) => (
                                            <span key={item} className="rounded-full bg-[#252529] px-2 py-0.5 text-gray-300">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <span className="text-xs text-gray-500">{t('voice.selector.noSelection', 'No voice selected')}</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="px-6">
                            {t('voice.selector.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedVoice}
                            className="px-8 bg-indigo-600 hover:bg-indigo-500 border-0 shadow-lg shadow-indigo-900/20 font-bold"
                        >
                            {t('voice.selector.confirmSelection', 'Confirm Selection')}
                        </Button>
                    </div>
                </div>
            </div>

            <VoiceLabModal
                isOpen={showVoiceLab}
                defaultMode={voiceLabEntry}
                onClose={() => setShowVoiceLab(false)}
                onSave={handleVoiceCreated}
            />
        </div>
    );
};

const FilterChip: React.FC<{ selected: boolean; label: string; onClick: () => void }> = ({
    selected,
    label,
    onClick
}) => (
    <button
        onClick={onClick}
        className={`h-7 px-2.5 rounded-md text-[11px] border transition-colors ${
            selected
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-100'
                : 'bg-[#1d1d20] border-[#2f2f33] text-gray-400 hover:text-gray-100 hover:border-[#4a4a50]'
        }`}
    >
        {label}
    </button>
);

const InlineTag: React.FC<{ label: string }> = ({ label }) => (
    <span className="rounded-full border border-[#34343b] bg-[#1a1a1f] px-2 py-1 text-[10px] text-gray-300">
        {label}
    </span>
);
