// Music entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  MusicModelType,
  MusicWorkflowMode,

  // Main Entities
  MusicStyle,
  MusicConfig,
  GeneratedMusicResult,
  MusicTask,
  MusicProject,
  MusicProjectSettings,

  // Supporting Types
  MusicGenre,
} from '@sdkwork/magic-studio-types/music';

export {
  createGeneratedMusicResult,
  createMusicTask,
  resolveGeneratedMusicResultCoverUrl,
  resolveGeneratedMusicResultPath,
  resolveGeneratedMusicResultUrl,
} from '@sdkwork/magic-studio-types/music';
