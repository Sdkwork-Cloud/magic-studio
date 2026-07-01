// Type definitions for Magic Studio applications
// This package exists to break circular dependencies between shared packages
// All base types should be defined here, not imported from commons

// Re-export all types and identity helpers from the base module
export * from './base.types';
export { deriveClientEntityUuidFromId } from './base.types';

// Re-export AGI-native generation contracts
export type {
  AgiMediaKind,
  AgiGenerationProduct,
  AgiGenerationMode,
  MediaInputRole,
  ArtifactRole,
  ArtifactType,
  AgiExecutionStatus,
  MediaInputRef,
  GenerationRecipe,
  GeneratedArtifact,
  ArtifactSet,
  GenerationExecutionScope,
  GenerationExecutionTelemetry,
  GenerationExecution,
  ArtifactDeliveryView,
  GenerationOutcome,
} from './agi.types';

// Re-export all media-related types (MediaResource, FileMediaResource, etc.)
export type * from './media.types';
export {
  hasInputResourceReference,
  isRenderableInputResourceUrl,
  isStableInputResourceLocator,
  resolveInputResourceReference,
  resolveInputResourcePath,
  resolveInputResourceUrl,
} from './input-resource.utils';
export * from './asset-reference';

// Re-export all common/base types (including enums)
export * from './common.types';

// Re-export canonical runtime/platform vocabulary
export * from './runtime.types';

// Re-export all infrastructure types (FileSystem, Rendering, Export, etc.)
export type * from './infrastructure.types';

// Re-export all film-related types
export type * from './film.types';

// Re-export all video-related types
export type * from './video.types';
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
} from './video.types';

// Re-export all audio-related types
export type * from './audio.types';
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
} from './audio.types';

// Re-export all voice-related types
export type * from './voice.types';
export {
  createGeneratedVoiceResult,
  createVoiceInputResourceRef,
  createVoiceTask,
  resolveGeneratedVoiceResultPath,
  resolveGeneratedVoiceResultUrl,
  resolveVoiceInputResourceKey,
  resolveVoiceInputResourcePath,
  resolveVoiceInputResourceUrl,
} from './voice.types';

// Re-export all music-related types
export type * from './music.types';
export {
  createGeneratedMusicResult,
  createMusicTask,
  resolveGeneratedMusicResultCoverUrl,
  resolveGeneratedMusicResultPath,
  resolveGeneratedMusicResultUrl,
} from './music.types';

// Re-export all sfx-related types
export type * from './sfx.types';
export {
  createGeneratedSfxResult,
  createSfxTask,
  resolveGeneratedSfxResultUrl,
} from './sfx.types';

// Re-export all image-related types
export type * from './image.types';
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
} from './image.types';

// Re-export all canvas-related types
export type * from './canvas.types';
export {
  resolveCanvasMediaResourceKey,
  resolveCanvasMediaResourceUrl,
  resolveOptionalCanvasMediaResourceUrl,
} from './canvas.types';

// Re-export all magiccut-related types
export type * from './magiccut.types';
export {
  createAudioEffectConfig,
  createCutClip,
  createCutClipRef,
  createCutEditorAction,
  createCutLayer,
  createCutLayerRef,
  createCutMediaResourceRef,
  createCutProject,
  createCutTimeline,
  createCutTimelineRef,
  createCutTrack,
  createCutTrackRef,
  createKeyframePoint,
  createTimelineMarker,
  findMagicCutEntityByKey,
  findMagicCutEntityByRef,
  resolveMagicCutRecordKey,
  resolveMagicCutRefKey,
} from './magiccut.types';

// Re-export project-graph canonical types and helpers
export type * from './project-graph.types';
export { buildProjectGraphMediaSource } from './project-graph.types';

// Re-export all assets-related types
export type * from './assets.types';

// Re-export unified asset-center types
export type * from './asset-center.types';

// Re-export all character-related types
export type * from './character.types';
export {
  createCharacterAvatarInputResourceRef,
  createCharacter,
  hasCharacterAvatarInputResourceReference,
  resolveCharacterAvatarInputResourceKey,
  resolveCharacterAvatarInputResourcePath,
  resolveCharacterAvatarInputResourceReference,
  resolveCharacterAvatarInputResourceUrl,
  resolveCharacterResourcePath,
  resolveCharacterResourceUrl,
} from './character.types';

// Re-export all chat-related types
export type * from './chat.types';

// Re-export all chatppt-related types
export type * from './chatppt.types';

// Re-export all auth-related types
export type * from './auth.types';

// Re-export all notes-related types
export type * from './notes.types';

// Re-export workspace and project contract types
export type * from './workspace.types';

// Re-export drive contract types
export type * from './drive.types';
