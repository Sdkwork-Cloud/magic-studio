// Audio entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

export type {
  // Enums and Type Aliases
  AudioModelType,
  AudioInputResourceType,

  // Main Entities
  AudioGenerationParams,
  AudioInputResourceRef,
  AudioTaskResult,
  AudioTask,
  AudioProject,

  // Supporting Types
  AudioVoice,
  AudioPreset,
} from '@sdkwork/magic-studio-types/audio';

export {
  createAudioInputResourceRef,
  createAudioTask,
  createAudioTaskResult,
  hasAudioInputResourceReference,
  resolveAudioInputResourceKey,
  resolveAudioInputResourceReference,
  resolveAudioInputResourcePath,
  resolveAudioInputResourceUrl,
  resolveAudioTaskResultUrl,
} from '@sdkwork/magic-studio-types/audio';
