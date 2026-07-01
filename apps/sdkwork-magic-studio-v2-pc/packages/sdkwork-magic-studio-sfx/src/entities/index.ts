// SFX entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  SfxModelType,

  // Main Entities
  SfxConfig,
  GeneratedSfxResult,
  SfxTask,
  SfxProject,
  SfxProjectSettings,

  // Supporting Types
  SfxCategory,
  SfxPreset,
} from '@sdkwork/magic-studio-types/sfx';

export {
  createGeneratedSfxResult,
  createSfxTask,
  resolveGeneratedSfxResultUrl,
} from '@sdkwork/magic-studio-types/sfx';
