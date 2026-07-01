import { PromptTextInput, createPromptTextInputCapabilityProps } from '@sdkwork/magic-studio-assets/generation';
import {
    fetchCreationCapabilities,
    getCreationModelDurationOptions,
    type CreationCapabilitySnapshot,
} from '@sdkwork/magic-studio-assets/services';
import { useRuntimeMagicStudioExecutionOperationCapability } from '@sdkwork/magic-studio-core/platform';
import React, { useEffect, useMemo, useState } from 'react';
import { useSfxStore } from '../store/sfxStore';
import { SfxModelSelector } from './SfxModelSelector';
import { sfxBusinessService } from '../services';
import { AudioWaveform, Clock, Flame, Loader2, Sparkles } from 'lucide-react';
import { normalizeSfxModel } from '../utils/sfxModel';

type SfxCategoryItem = Awaited<ReturnType<typeof sfxBusinessService.sfxService.getCategories>>[number] & {
    label?: string;
    subcategories?: SfxCategoryItem[];
};

type SfxDurationOption = {
    label: string;
    value: string;
    seconds: number;
};

const normalizeCategoryLabel = (category: SfxCategoryItem): string => {
    const label = typeof category?.label === 'string' ? category.label.trim() : '';
    if (label) {
        return label;
    }
    const name = typeof category?.name === 'string' ? category.name.trim() : '';
    if (name) {
        return name;
    }
    return typeof category?.id === 'string' ? category.id.trim() : '';
};

const flattenCategories = (
    categories: SfxCategoryItem[] | undefined,
    seen = new Set<string>()
): SfxCategoryItem[] => {
    if (!Array.isArray(categories) || categories.length === 0) {
        return [];
    }

    const flattened: SfxCategoryItem[] = [];
    for (const category of categories) {
        const label = normalizeCategoryLabel(category);
        const dedupeKey = label || `category:${flattened.length}`;
        if (label && !seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            flattened.push(category);
        }

        if (Array.isArray(category?.subcategories) && category.subcategories.length > 0) {
            flattened.push(...flattenCategories(category.subcategories as SfxCategoryItem[], seen));
        }
    }

    return flattened;
};

const parseDurationSeconds = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const match = value.trim().match(/(\d+(?:\.\d+)?)/);
    if (!match) {
        return null;
    }

    const seconds = Number.parseFloat(match[1]);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

const createFallbackDurationOption = (duration: number): SfxDurationOption[] => {
    const seconds = parseDurationSeconds(duration) ?? 5;
    const normalizedLabel = `${seconds}s`;

    return [
        {
            label: normalizedLabel,
            value: normalizedLabel,
            seconds,
        },
    ];
};

const normalizeDurationOptions = (
    options: Array<{ label: string; value: string }>,
    fallbackDuration: number
): SfxDurationOption[] => {
    const normalizedBySeconds = new Map<number, SfxDurationOption>();

    for (const option of options) {
        const seconds = parseDurationSeconds(option.value) ?? parseDurationSeconds(option.label);
        if (seconds === null || normalizedBySeconds.has(seconds)) {
            continue;
        }

        normalizedBySeconds.set(seconds, {
            label: option.label || `${seconds}s`,
            value: option.value || `${seconds}s`,
            seconds,
        });
    }

    const normalized = Array.from(normalizedBySeconds.values());

    return normalized.length > 0 ? normalized : createFallbackDurationOption(fallbackDuration);
};

const resolvePreferredDurationSeconds = (
    options: SfxDurationOption[],
    requestedDuration: number,
    fallbackDuration: number
): number => {
    const requestedSeconds = parseDurationSeconds(requestedDuration);
    if (requestedSeconds !== null) {
        const matchingOption = options.find((option) => option.seconds === requestedSeconds);
        if (matchingOption) {
            return matchingOption.seconds;
        }
    }

    return options[0]?.seconds ?? fallbackDuration;
};

const resolveDurationOptionsForModel = (
    snapshot: CreationCapabilitySnapshot | null,
    model: string,
    fallbackDuration: number
): SfxDurationOption[] => {
    if (!snapshot) {
        return createFallbackDurationOption(fallbackDuration);
    }

    return normalizeDurationOptions(
        getCreationModelDurationOptions(snapshot, model),
        fallbackDuration
    );
};

export const SfxLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useSfxStore();
    const [categoryItems, setCategoryItems] = useState<SfxCategoryItem[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [creationCapabilitySnapshot, setCreationCapabilitySnapshot] = useState<CreationCapabilitySnapshot | null>(null);
    const [isLoadingCreationCapabilities, setIsLoadingCreationCapabilities] = useState(false);
    const generationCapability = useRuntimeMagicStudioExecutionOperationCapability(
        'sfx-generation',
        'create',
        {
            feature: 'SfxLeftGeneratorPanel'
        }
    );
    const categorySuggestions = useMemo(
        () => flattenCategories(categoryItems).slice(0, 12),
        [categoryItems]
    );
    const generateDisabledReason = generationCapability.disabledReason;
    const canGenerate = generationCapability.ready && !!config.prompt.trim();
    const durationOptions = useMemo(
        () => resolveDurationOptionsForModel(creationCapabilitySnapshot, config.model, config.duration),
        [config.duration, config.model, creationCapabilitySnapshot]
    );
    const selectedDurationSeconds = useMemo(
        () => resolvePreferredDurationSeconds(durationOptions, config.duration, config.duration),
        [config.duration, durationOptions]
    );
    const selectedDurationLabel = useMemo(
        () => durationOptions.find((option) => option.seconds === selectedDurationSeconds)?.label || `${selectedDurationSeconds}s`,
        [durationOptions, selectedDurationSeconds]
    );

    useEffect(() => {
        let cancelled = false;

        const loadCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const categories = await sfxBusinessService.sfxService.getCategories();
                if (!cancelled) {
                    setCategoryItems(categories);
                }
            } catch (error) {
                if (!cancelled) {
                    setCategoryItems([]);
                }
                console.error('Failed to load SFX categories', error);
            } finally {
                if (!cancelled) {
                    setIsLoadingCategories(false);
                }
            }
        };

        void loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadCreationCapabilities = async () => {
            setIsLoadingCreationCapabilities(true);
            try {
                const snapshot = await fetchCreationCapabilities('sfx');
                if (!cancelled) {
                    setCreationCapabilitySnapshot(snapshot);
                }
            } catch (error) {
                if (!cancelled) {
                    setCreationCapabilitySnapshot(null);
                }
                console.error('Failed to load SFX creation capabilities', error);
            } finally {
                if (!cancelled) {
                    setIsLoadingCreationCapabilities(false);
                }
            }
        };

        void loadCreationCapabilities();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (selectedDurationSeconds !== config.duration) {
            setConfig({ duration: selectedDurationSeconds });
        }
    }, [config.duration, selectedDurationSeconds, setConfig]);

    const handleCategorySuggestion = (category: SfxCategoryItem) => {
        const label = normalizeCategoryLabel(category);
        if (!label) {
            return;
        }

        const currentPrompt = config.prompt.trim();
        const alreadyIncluded = currentPrompt
            .toLowerCase()
            .split(',')
            .map((segment) => segment.trim())
            .includes(label.toLowerCase());

        if (alreadyIncluded) {
            return;
        }

        setConfig({
            prompt: currentPrompt ? `${currentPrompt}, ${label}` : label,
        });
    };

    const handleModelChange = (model: string) => {
        const normalizedModel = normalizeSfxModel(model);
        const nextDurationOptions = resolveDurationOptionsForModel(
            creationCapabilitySnapshot,
            normalizedModel,
            config.duration
        );

        setConfig({
            model: normalizedModel,
            duration: resolvePreferredDurationSeconds(
                nextDurationOptions,
                config.duration,
                config.duration
            ),
        });
    };

    return (
        <>
            <div className="flex-none bg-[#09090b] border-b border-[#27272a] z-30">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/20 ring-1 ring-white/10">
                            <AudioWaveform size={16} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-white leading-none">SFX Studio</h2>
                            <span className="text-[10px] text-gray-500 font-medium">Sound Effects Generation</span>
                        </div>
                    </div>

                    <SfxModelSelector
                        value={config.model}
                        onChange={handleModelChange}
                        className="w-auto border-[#333] bg-[#18181b] hover:bg-[#202023] text-xs h-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <Label icon={<Sparkles size={12} className="text-orange-500" />}>
                            Sound Description
                        </Label>
                        <PromptTextInput
                            {...createPromptTextInputCapabilityProps('AUDIO')}
                            label={null}
                            placeholder="Footsteps on gravel, laser blast, ambient rain..."
                            value={config.prompt}
                            onChange={(value) => setConfig({ prompt: value })}
                            disabled={isGenerating}
                            rows={6}
                            className="bg-[#121214]"
                        />
                    </div>

                    {(isLoadingCategories || categorySuggestions.length > 0) && (
                        <div>
                            <Label icon={<AudioWaveform size={12} className="text-orange-400" />}>
                                Category Suggestions
                            </Label>
                            {isLoadingCategories ? (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Loading categories...</span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categorySuggestions.map((category, index) => {
                                        const label = normalizeCategoryLabel(category);
                                        if (!label) {
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={`${category.id || label}:${index}`}
                                                type="button"
                                                onClick={() => handleCategorySuggestion(category)}
                                                title={category.description || label}
                                                className="text-[11px] px-2.5 py-1.5 bg-[#18181b] hover:bg-[#252526] border border-[#27272a] rounded-md text-gray-300 hover:text-white transition-colors"
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <Label icon={<Clock size={12} />}>Duration (Seconds)</Label>
                        <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-xl space-y-3">
                            <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500">
                                <span className="flex items-center gap-2">
                                    {isLoadingCreationCapabilities ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>Syncing runtime options...</span>
                                        </>
                                    ) : (
                                        <span>Runtime-defined options</span>
                                    )}
                                </span>
                                <div className="min-w-[52px] text-center text-xs font-mono text-gray-300 bg-[#252526] px-2 py-1 rounded border border-[#333]">
                                    {selectedDurationLabel}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {durationOptions.map((option) => {
                                    const isActive = option.seconds === selectedDurationSeconds;

                                    return (
                                        <button
                                            key={`${option.value}:${option.seconds}`}
                                            type="button"
                                            onClick={() => setConfig({ duration: option.seconds })}
                                            disabled={isGenerating}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${isActive ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-[#121214] border-[#333] text-gray-400 hover:text-white hover:border-[#4b5563]'} ${isGenerating ? 'cursor-not-allowed opacity-60' : ''}`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#09090b] z-30">
                <button
                    type="button"
                    onClick={generate}
                    disabled={isGenerating || !canGenerate}
                    className={`w-full h-12 rounded-xl font-bold text-sm text-white transition-all shadow-lg flex items-center justify-center gap-2 ${isGenerating || !canGenerate ? 'bg-[#27272a] text-gray-500 cursor-not-allowed border border-[#333]' : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/20 active:scale-[0.98]'}`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <Flame size={16} fill="currentColor" className="text-orange-500" />
                            <span>{selectedDurationLabel}</span>
                            <span className="ml-1">Generate Sound</span>
                        </>
                    )}
                </button>
                {generateDisabledReason && (
                    <p className="mt-2 text-[11px] text-amber-400 leading-5">
                        {generateDisabledReason}
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
