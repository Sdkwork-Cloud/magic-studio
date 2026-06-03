// Image entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  ImageAspectRatio,
  ImageStyle,
  ImageEditMode,

  // Main Entities
  ImageGenerationConfig,
  ImageInputResourceRef,
  GeneratedImageResult,
  ImageEditRequest,
  ImageGridCell,
  ImageTask,
  ImageProject,
  ImageProjectSettings,

  // Supporting Types
  ImageModel,
  ImagePreset,
} from '@sdkwork/magic-studio-types/image';

export {
  createGeneratedImageResult,
  createImageGridCell,
  createImageInputResourceRef,
  createImageTask,
  hasImageInputResourceReference,
  resolveGeneratedImageResultPath,
  resolveGeneratedImageResultThumbnailUrl,
  resolveGeneratedImageResultUrl,
  resolveImageInputResourceKey,
  resolveImageInputResourceReference,
  resolveImageInputResourcePath,
  resolveImageInputResourceUrl,
} from '@sdkwork/magic-studio-types/image';

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
