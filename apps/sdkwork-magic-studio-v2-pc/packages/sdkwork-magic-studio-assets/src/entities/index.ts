// Assets entity types
// Re-export from focused Magic Studio types subpaths to keep entity contracts centralized

// Re-export enums (values)
export {
  MediaResourceType,
} from '@sdkwork/magic-studio-types/vocabulary';

// Re-export types
export type {
  // Enums and Type Aliases
  AssetType,
  AssetOrigin,

  // Main Entities
  AssetCategory,
  AssetMetadata,
  Asset,

  // Enhanced Asset Types
  VideoAsset,
  ImageAsset,
  AudioAsset,
  CharacterAsset,
  SfxAsset,
  TextAsset,
  EffectAsset,
  TransitionAsset,
  AnyAsset,

  // Supporting Types
  AssetFolder,
  AssetFilter,
  AssetSearchResult,
} from '@sdkwork/magic-studio-types/assets';
export type {
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  AnyMediaResource,
} from '@sdkwork/magic-studio-types/media';
