import type { Asset } from '@sdkwork/react-commons';
import type { LipSyncDriverType, LipSyncSourceType, VideoConfig, VideoGenerationMode } from '../../entities';

export type VideoPanelModeViewKey =
    | 'lip_sync'
    | 'start_end'
    | 'subject_ref'
    | 'smart_reference'
    | 'smart_multi'
    | 'default';

export type VideoPanelRequirementKey =
    | 'prompt'
    | 'start_frame'
    | 'end_frame'
    | 'reference_count'
    | 'lip_sync_source'
    | 'lip_sync_driver';

export interface VideoPanelGenerationRequirement {
    key: VideoPanelRequirementKey;
    minCount?: number;
}

export interface VideoPanelGenerationRule {
    allOf?: VideoPanelGenerationRequirement[];
    anyOf?: VideoPanelGenerationRequirement[];
}

export interface VideoPanelModeSchema {
    mode: VideoGenerationMode;
    viewKey: VideoPanelModeViewKey;
    generationRule: VideoPanelGenerationRule;
}

export interface VideoPanelRuntimeState {
    mode: VideoGenerationMode;
    isGenerating: boolean;
    hasPrompt: boolean;
    hasStartFrame: boolean;
    hasEndFrame: boolean;
    referenceCount: number;
    lipSyncSourceType: LipSyncSourceType;
    lipSyncDriverType: LipSyncDriverType;
    hasLipSyncSourceVideo: boolean;
    hasLipSyncSourceImage: boolean;
    hasLipSyncAudioDriver: boolean;
    hasLipSyncTtsDriver: boolean;
    hasLipSyncDriver: boolean;
}

export interface VideoModeTabContentProps {
    config: VideoConfig;
    isGenerating: boolean;
    maxAssets: number;
    resolvedReferenceImages: string[];
    onConfigChange: (updates: Partial<VideoConfig>) => void;
    onStartFrameChange: (asset: Asset | null) => void;
    onEndFrameChange: (asset: Asset | null) => void;
    onSubjectReferenceChange: (asset: Asset | null) => void;
    onTargetVideoChange: (asset: Asset | null) => void;
    onTargetImageChange: (asset: Asset | null) => void;
    onDriverAudioChange: (asset: Asset | null) => void;
    onSwapStartEndFrames: () => void;
    onOpenReferenceAssetModal: () => void;
}
