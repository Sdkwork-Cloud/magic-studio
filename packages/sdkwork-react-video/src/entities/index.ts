// Video entity types
// Re-export from sdkwork-react-types to maintain backward compatibility

export type {
  // Enums and Type Aliases
  VideoAspectRatio,
  VideoResolution,
  VideoDuration,
  VideoGenerationMode,
  VideoGenerationStatus,
  LipSyncDriverType,
  LipSyncSourceType,
  LipSyncStage,
  VideoTaskType,
  VideoGenerationAssetType,

  // Main Entities
  VideoModel,
  VideoConfig,
  GeneratedVideoResult,
  VideoTask,
  VideoProject,
  VideoProjectSettings,
  UnifiedVideoGenerationRequest,
  VideoGenerationAsset,
  VideoStyleSelection,

  // Supporting Types
  VideoAsset,
  VideoStyle,
  VideoPreset,
} from '@sdkwork/react-types';

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
