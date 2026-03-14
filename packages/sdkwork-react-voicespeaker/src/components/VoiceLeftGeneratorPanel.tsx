import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChooseAssetModal } from '@sdkwork/react-assets';
import { getVoiceProviderApiProfileByModel } from '../constants';
import { useVoiceStore } from '../store/voiceStore';
import { voiceBusinessService, type UploadedVoiceReferenceInput } from '../services';
import {
    buildVoiceModeAvailabilityByModel,
    canGenerateByVoicePanelSchema,
    createVoicePanelRuntimeState,
    DEFAULT_REFERENCE_INPUT_METHOD,
    getVoiceConfigPatchByModelMode,
    getVoiceModelRangeHint,
    resolveVoiceModeForModel,
    VoiceCloneTabPanel,
    VoiceDesignTabPanel,
    VoiceGenerateFooter,
    VoicePanelHeader,
    VoicePersonaSection,
    VoicePreviewTextSection
} from './panel';

export const VoiceLeftGeneratorPanel: React.FC = () => {
    const { config, setConfig, generate, isGenerating } = useVoiceStore();
    const speakerService = voiceBusinessService.voiceSpeakerService;
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const [showReferenceAssetModal, setShowReferenceAssetModal] = useState(false);

    const modeAvailability = useMemo(
        () => buildVoiceModeAvailabilityByModel(config.model),
        [config.model]
    );
    const mode = useMemo(
        () => resolveVoiceModeForModel(config.model, config.mode),
        [config.model, config.mode]
    );
    const inputMethod = config.inputMethod || DEFAULT_REFERENCE_INPUT_METHOD;
    const rangeHint = useMemo(() => getVoiceModelRangeHint(config.model), [config.model]);
    const providerFeatureSpec = useMemo(
        () => getVoiceProviderApiProfileByModel(config.model).featureSpec,
        [config.model]
    );
    const runtimeState = useMemo(
        () => createVoicePanelRuntimeState(config, mode, isGenerating),
        [config, mode, isGenerating]
    );
    const isModeEnabled = modeAvailability[mode]?.enabled !== false;
    const canGenerate = isModeEnabled && canGenerateByVoicePanelSchema(runtimeState);

    useEffect(() => {
        const patch = getVoiceConfigPatchByModelMode(config.model, mode, config);
        if (patch) {
            setConfig(patch);
        }
    }, [config, mode, setConfig]);

    useEffect(() => {
        return () => {
            if (previewAudioRef.current) {
                speakerService.stopPreviewAudio(previewAudioRef.current);
                previewAudioRef.current = null;
            }
        };
    }, [speakerService]);

    const handleModeChange = (nextMode: typeof mode): void => {
        if (modeAvailability[nextMode]?.enabled === false) {
            return;
        }
        setConfig({ mode: nextMode });
    };

    const handleRecordingComplete = async (blob: Blob): Promise<void> => {
        const imported = await speakerService.importReferenceAudioFromBlob(
            blob,
            `rec_${Date.now()}.webm`,
            'voice-recorder'
        );
        setConfig({ referenceAudio: imported.path || imported.id });
    };

    const handleAudioUpload = async (
        file: UploadedVoiceReferenceInput
    ): Promise<void> => {
        const imported = await speakerService.importReferenceAudioFromUpload(
            file,
            'voice-upload'
        );
        setConfig({ referenceAudio: imported.path || imported.id });
    };

    const handlePlayAudio = async (): Promise<void> => {
        if (!config.referenceAudio) {
            return;
        }
        const url = await speakerService.resolveVoiceAssetUrl(config.referenceAudio);
        if (previewAudioRef.current) {
            speakerService.stopPreviewAudio(previewAudioRef.current);
            previewAudioRef.current = null;
        }
        if (!url) {
            return;
        }
        const audio = await speakerService.playPreviewAudio(url, {
            onEnded: () => {
                previewAudioRef.current = null;
            },
            onError: (error) => {
                console.error('Playback failed', error);
                previewAudioRef.current = null;
            }
        });
        previewAudioRef.current = audio;
    };

    return (
        <>
            <VoicePanelHeader
                model={config.model}
                mode={mode}
                availability={modeAvailability}
                onModelChange={(model) => setConfig({ model: model as typeof config.model })}
                onModeChange={handleModeChange}
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090b]">
                <VoicePersonaSection
                    mode={mode}
                    name={config.name}
                    avatarUrl={config.avatarUrl}
                    voiceId={config.voiceId}
                    description={config.description}
                    onAvatarChange={(avatarUrl) => setConfig({ avatarUrl })}
                    onNameChange={(name) => setConfig({ name })}
                    onVoiceIdChange={(voiceId) => setConfig({ voiceId })}
                />

                {mode === 'design' ? (
                    <VoiceDesignTabPanel
                        description={config.description}
                        speed={config.speed}
                        pitch={config.pitch}
                        stability={config.stability}
                        similarityBoost={config.similarityBoost}
                        disabled={isGenerating}
                        speedRange={rangeHint.speedRange}
                        pitchRange={rangeHint.pitchRange}
                        supportsSpeedControl={providerFeatureSpec.supportsSpeedControl}
                        supportsPitchControl={providerFeatureSpec.supportsPitchControl}
                        supportsStabilityControl={
                            providerFeatureSpec.supportsStabilityControl !== false
                        }
                        supportsSimilarityControl={
                            providerFeatureSpec.supportsSimilarityControl !== false
                        }
                        onDescriptionChange={(description) => setConfig({ description })}
                        onSpeedChange={(speed) => setConfig({ speed })}
                        onPitchChange={(pitch) => setConfig({ pitch })}
                        onStabilityChange={(stability) => setConfig({ stability })}
                        onSimilarityBoostChange={(similarityBoost) =>
                            setConfig({ similarityBoost })
                        }
                    />
                ) : (
                    <VoiceCloneTabPanel
                        inputMethod={inputMethod}
                        referenceAudio={config.referenceAudio}
                        onInputMethodChange={(method) => setConfig({ inputMethod: method })}
                        onAudioUpload={handleAudioUpload}
                        onOpenReferenceAssetModal={() =>
                            setShowReferenceAssetModal(true)
                        }
                        onRecordingComplete={handleRecordingComplete}
                        onPlayReferenceAudio={handlePlayAudio}
                        onRemoveReferenceAudio={() =>
                            setConfig({ referenceAudio: undefined })
                        }
                    />
                )}

                <VoicePreviewTextSection
                    value={config.previewText || config.text || ''}
                    onChange={(value) =>
                        setConfig({
                            previewText: value,
                            text: value
                        })
                    }
                />
            </div>

            <VoiceGenerateFooter
                mode={mode}
                canGenerate={canGenerate}
                isGenerating={isGenerating}
                onGenerate={generate}
            />

            <ChooseAssetModal
                isOpen={showReferenceAssetModal}
                onClose={() => setShowReferenceAssetModal(false)}
                onConfirm={(assets) => {
                    const first = assets[0];
                    setConfig({
                        referenceAudio: first?.path || first?.id || undefined
                    });
                    setShowReferenceAssetModal(false);
                }}
                accepts={['voice', 'audio']}
                domain="voice-speaker"
                title="Select Reference Audio"
            />
        </>
    );
};
