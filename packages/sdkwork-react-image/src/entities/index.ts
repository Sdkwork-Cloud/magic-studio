// Image entity types
// Re-export from sdkwork-react-types to maintain backward compatibility

export type {
  // Enums and Type Aliases
  ImageAspectRatio,
  ImageStyle,

  // Main Entities
  ImageGenerationConfig,
  GeneratedImageResult,
  ImageTask,
  ImageProject,
  ImageProjectSettings,

  // Supporting Types
  ImageModel,
  ImagePreset,
} from '@sdkwork/react-types';

export type {
  ImagePanelSectionKey,
  ImagePanelRequirementKey,
  ImagePanelGenerationRequirement,
  ImagePanelGenerationRule,
  ImagePanelSchema,
  ImagePanelRuntimeState,
  ImageAspectRatioOption,
  ImageBatchSizeOption,
  ImageModelOutputPolicy
} from './image-panel.entity';
