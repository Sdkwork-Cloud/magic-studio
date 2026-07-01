// Video entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  MediaInputRef,
} from '@sdkwork/magic-studio-types/agi';

export type {
  VideoAsset,
} from '@sdkwork/magic-studio-types/assets';

export type {
  // Enums and Type Aliases
  VideoAspectRatio,
  VideoResolution,
  VideoDuration,
  VideoGenerationMode,
  VideoCanonicalGenerationType,
  VideoGenerationStatus,
  LipSyncDriverType,
  LipSyncSourceType,
  LipSyncStage,
  VideoTaskType,
  VideoGenerationAssetType,
  VideoInputResourceType,

  // Main Entities
  VideoModel,
  VideoConfig,
  GeneratedVideoResult,
  VideoTask,
  VideoProject,
  VideoProjectSettings,
  UnifiedVideoGenerationRequest,
  VideoGenerationAsset,
  VideoInputResourceRef,
  VideoStyleSelection,

  // Supporting Types
  VideoStyle,
  VideoPreset,
} from '@sdkwork/magic-studio-types/video';

export {
  createGeneratedVideoResult,
  createVideoInputResourceRef,
  createVideoTask,
  hasVideoInputResourceReference,
  resolveCanonicalVideoGenerationType,
  resolveGeneratedVideoResultPath,
  resolveGeneratedVideoResultPosterUrl,
  resolveGeneratedVideoResultUrl,
  resolveVideoInputResourceKey,
  resolveVideoInputResourceReference,
  resolveVideoInputResourcePath,
  resolveVideoInputResourceUrl,
} from '@sdkwork/magic-studio-types/video';

export type {
  VideoApiProviderId,
  VideoProviderApiDocEntry,
  VideoProviderModeSpec,
  VideoProviderApiProfile,
  VideoModelProfile,
  VideoModeAvailability,
  VideoDurationOption,
  VideoDurationPolicy,
} from './video-provider.entity';
