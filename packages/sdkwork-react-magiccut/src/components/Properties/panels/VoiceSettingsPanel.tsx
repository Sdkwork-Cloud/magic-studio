import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, User, Settings2, Captions, Type } from 'lucide-react';
import { PropertySection, ScrubbableInput, Dropdown, ActionButton } from '../widgets/PropertyWidgets';
import { PRESET_VOICES, voiceBusinessService } from '@sdkwork/react-voicespeaker';
import { AnyMediaResource, MediaResourceType, generateUUID } from '@sdkwork/react-commons';
import { CutClip } from '../../../entities/magicCut.entity';
import { useMagicCutStore } from '../../../store/magicCutStore';
import { PromptTextInput, createPromptTextInputCapabilityProps } from '@sdkwork/react-assets';
import { genAIService } from '@sdkwork/react-core';
import { subtitleService } from '../../../services/subtitle/SubtitleService';
import {
    buildVoiceCaptionCues,
    resolveVoiceCaptionTrackPlacement
} from '../../../domain/subtitle/voiceCaptioning';
import {
    buildVoiceGenerationConfig,
    resolveGeneratedVoiceUpdates
} from '../../../domain/voice/voiceGeneration';

interface VoiceSettingsPanelProps {
    clip: CutClip;
    resource: AnyMediaResource;
    onUpdate: (updates: Partial<CutClip>) => void;
    onUpdateResource: (updates: Partial<AnyMediaResource>) => void;
}

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ clip, resource, onUpdate, onUpdateResource }) => {
    const {
        project,
        state,
        activeTimeline,
        setClipSpeed,
        addTrack,
        addClip,
        updateClip,
        updateClipTransform,
        applyTimelineEditResult,
        beginTransaction,
        commitTransaction
    } = useMagicCutStore();

    const [script, setScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isCaptioning, setIsCaptioning] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [lastGenerationSummary, setLastGenerationSummary] = useState<string | null>(null);
    
    // Metadata holds voice configuration
    const meta = resource.metadata || {};
    const voiceId = meta.voiceId || 'Kore';
    const speed = clip.speed || 1.0;
    const pitch = meta.pitch || 1.0;
    const generationSpeed =
        typeof meta.ttsSpeed === 'number' && Number.isFinite(meta.ttsSpeed) ? meta.ttsSpeed : 1.0;
    const generatedCaptions = Array.isArray(meta.generatedCaptions) ? meta.generatedCaptions : [];
    const captionCues = useMemo(
        () => buildVoiceCaptionCues({ text: script, duration: clip.duration }),
        [script, clip.duration]
    );

    // Load initial script from clip content or metadata
    useEffect(() => {
        setScript(clip.content || meta.text || "Hello World");
    }, [clip.id, clip.content, meta.text]);

    const handleRegenerate = async () => {
        const normalizedScript = script.trim();
        if (!normalizedScript) return;

        setIsGenerating(true);
        setGenerationError(null);

        try {
            const config = buildVoiceGenerationConfig({
                script: normalizedScript,
                voiceId,
                pitch,
                speed: generationSpeed,
                metadata: meta
            });

            const rawResults = await voiceBusinessService.voiceService.generateSpeech(config);
            const primaryResult = rawResults[0];

            if (!primaryResult) {
                throw new Error('Voice generation returned no playable result.');
            }

            const persistedResult = await voiceBusinessService.voiceSpeakerService.persistGeneratedVoiceResult({
                taskId: generateUUID(),
                index: 0,
                result: primaryResult
            });

            const { clipUpdates, resourceUpdates } = resolveGeneratedVoiceUpdates({
                resource,
                clip,
                script: normalizedScript,
                result: persistedResult,
                voiceId,
                pitch
            });

            onUpdate(clipUpdates);
            onUpdateResource(resourceUpdates);
            setLastGenerationSummary(
                `${persistedResult.speakerName} • ${persistedResult.duration.toFixed(1)}s source`
            );
        } catch (error) {
            setGenerationError(error instanceof Error ? error.message : 'Voice generation failed.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEnhanceScript = async (currentText: string): Promise<string> => {
        if (!currentText) return "";
        setIsEnhancing(true);
        try {
            const enhanced = await genAIService.enhancePrompt(currentText);
            setScript(enhanced);
            return enhanced;
        } catch (e) {
            console.error(e);
            return currentText;
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleExportSrt = () => {
        const exportCues = generatedCaptions.length > 0 ? generatedCaptions : captionCues;
        if (exportCues.length === 0) return;

        subtitleService.downloadSRT(
            exportCues.map((cue, index) => ({
                id: `caption-${clip.id}-${index + 1}`,
                index: cue.index || index + 1,
                startTime: cue.startTime,
                endTime: cue.endTime,
                text: cue.text
            })),
            `${(resource.name || 'voice').replace(/\.[^.]+$/, '')}.srt`
        );
    };

    const handleAutoCaption = () => {
        if (!activeTimeline || captionCues.length === 0) return;

        setIsCaptioning(true);

        try {
            beginTransaction();

            const timelineTracks = activeTimeline.tracks
                .map((trackRef) => state.tracks[trackRef.id])
                .filter(Boolean)
                .map((track) => ({ id: track.id, trackType: track.trackType }));
            const trackPlacement = resolveVoiceCaptionTrackPlacement(timelineTracks, clip.track.id);
            const subtitleTrackId =
                trackPlacement.trackId ||
                addTrack('subtitle', 'Captions', false, trackPlacement.insertIndex);

            if (!subtitleTrackId) return;

            const existingCaptionClipIds = Object.values(state.clips)
                .filter((item) => {
                    if (item.linkedClipId !== clip.id) return false;
                    return state.resources[item.resource.id]?.type === MediaResourceType.SUBTITLE;
                })
                .map((item) => item.id);

            if (existingCaptionClipIds.length > 0) {
                applyTimelineEditResult({ clipsToUpdate: [], clipsToDelete: existingCaptionClipIds });
            }

            const [projectWidth, projectHeight] = (project.settings.resolution || '1920x1080')
                .split('x')
                .map(Number);
            const resolvedWidth = Number.isFinite(projectWidth) ? projectWidth : 1920;
            const resolvedHeight = Number.isFinite(projectHeight) ? projectHeight : 1080;
            const subtitleStyle = {
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 54,
                fontWeight: 'bold',
                color: '#ffffff',
                strokeColor: '#000000',
                strokeWidth: 10,
                backgroundColor: 'rgba(0,0,0,0.45)',
                backgroundPadding: 18,
                backgroundCornerRadius: 18,
                textAlign: 'center'
            };

            captionCues.forEach((cue) => {
                const resourceId = generateUUID();
                const subtitleResource: AnyMediaResource = {
                    id: resourceId,
                    uuid: generateUUID(),
                    type: MediaResourceType.SUBTITLE,
                    name: `Caption ${cue.index}`,
                    extension: 'srt',
                    metadata: {
                        text: cue.text,
                        language: meta.language || 'auto',
                        sourceVoiceClipId: clip.id,
                        generatedBy: 'magiccut-auto-caption',
                        ...subtitleStyle
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                const subtitleClipId = addClip(
                    subtitleTrackId,
                    subtitleResource,
                    clip.start + cue.startTime,
                    cue.endTime - cue.startTime
                );

                if (!subtitleClipId) return;

                updateClip(subtitleClipId, {
                    linkedClipId: clip.id,
                    content: cue.text,
                    style: subtitleStyle
                });

                const estimatedWidth = Math.min(resolvedWidth - 160, Math.max(420, cue.text.length * 26));
                updateClipTransform(
                    subtitleClipId,
                    {
                        x: Math.round((resolvedWidth - estimatedWidth) / 2),
                        y: Math.round(resolvedHeight - 220),
                        width: estimatedWidth
                    },
                    true
                );
            });

            onUpdateResource({
                metadata: {
                    ...meta,
                    text: script,
                    generatedCaptions: captionCues
                }
            });
        } finally {
            commitTransaction();
            setIsCaptioning(false);
        }
    };

    return (
        <>
            {/* 1. Script Editor */}
            <div className="p-3 border-b border-[#1f1f22] bg-[#141414]">
                <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-wider">
                        <Type size={12} /> Script
                    </div>
                </div>
                
                <PromptTextInput 
                    {...createPromptTextInputCapabilityProps('TEXT')}
                    label={null}
                    value={script}
                    onChange={setScript}
                    className="bg-[#09090b]"
                    placeholder="Enter text to speak..."
                    rows={4}
                    onEnhance={handleEnhanceScript}
                    isEnhancing={isEnhancing}
                />

                {(generationError || lastGenerationSummary) && (
                    <div className={`mt-3 rounded-xl border px-3 py-3 ${
                        generationError
                            ? 'border-red-500/20 bg-red-500/10'
                            : 'border-emerald-500/20 bg-emerald-500/10'
                    }`}>
                        {generationError ? (
                            <>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-red-100">
                                    Generation failed
                                </div>
                                <p className="mt-1 text-[10px] leading-4 text-red-100/75">{generationError}</p>
                            </>
                        ) : (
                            <>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
                                    Voice regenerated
                                </div>
                                <p className="mt-1 text-[10px] leading-4 text-emerald-100/75">{lastGenerationSummary}</p>
                            </>
                        )}
                    </div>
                )}

                <div className="mt-2">
                    <ActionButton 
                        label="Generate Audio" 
                        icon={<RefreshCw />} 
                        onClick={handleRegenerate} 
                        isLoading={isGenerating}
                        disabled={!script.trim()}
                        className="w-full bg-green-900/20 text-green-400 border-green-500/30 hover:bg-green-900/30"
                    />
                </div>
            </div>

            {/* 2. Voice Persona */}
            <PropertySection title="Speaker">
                <Dropdown 
                    label="Voice ID"
                    value={voiceId as string}
                    onChange={(v: string) => onUpdateResource({ 
                         metadata: { ...meta, voiceId: v } 
                    })}
                    options={PRESET_VOICES.map((v: { id: string; name: string }) => ({ label: v.name, value: v.id, icon: <User size={12}/> }))}
                />
            </PropertySection>

            {/* 3. Audio Properties */}
            <PropertySection title="Properties">
                <div className="space-y-3">
                    <ScrubbableInput 
                        label="Speed" 
                        value={speed} 
                        onChange={(v) => setClipSpeed(clip.id, v)} 
                        step={0.1} min={0.5} max={3.0} 
                        suffix="x"
                    />
                    <ScrubbableInput 
                        label="Pitch" 
                        value={pitch} 
                        onChange={(v) => onUpdateResource({ metadata: { ...meta, pitch: v } })} 
                        step={0.1} min={0.5} max={2.0} 
                    />
                    <ScrubbableInput 
                        label="Volume" 
                        value={clip.volume || 1} 
                        onChange={(v) => onUpdate({ volume: v })} 
                        step={0.1} min={0} max={2} 
                    />
                </div>
            </PropertySection>
            
            {/* 4. Subtitles */}
            <PropertySection title="Captions">
                 <div className="space-y-3">
                     <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
                         <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
                             Timeline captions
                         </div>
                         <p className="mt-1 text-[10px] leading-4 text-emerald-100/75">
                             Auto-Caption creates linked subtitle clips on a subtitle track. Export SRT downloads the same cue timing.
                         </p>
                         <div className="mt-2 text-[10px] text-emerald-100/65">
                             {captionCues.length > 0
                                ? `${captionCues.length} cues ready from the current script`
                                : 'Enter a script to prepare caption cues.'}
                         </div>
                     </div>
                     <div className="flex gap-2">
                         <ActionButton
                            label="Auto-Caption"
                            icon={<Captions />}
                            onClick={handleAutoCaption}
                            isLoading={isCaptioning}
                            disabled={captionCues.length === 0}
                            className="flex-1"
                         />
                         <ActionButton
                            label="Export SRT"
                            icon={<Settings2 />}
                            onClick={handleExportSrt}
                            disabled={captionCues.length === 0 && generatedCaptions.length === 0}
                            className="flex-1"
                         />
                     </div>
                 </div>
            </PropertySection>
        </>
    );
};
