// Assets entity types
// Re-export from sdkwork-react-types to maintain backward compatibility

// Re-export enums (values)
export {
  MediaResourceType,
} from '@sdkwork/react-types';

// Re-export types
export type {
  // Enums and Type Aliases
  AssetType,
  AssetOrigin,

  // Main Entities
  AssetCategory,
  AssetMetadata,
  Asset,
  MediaResource,
  FileMediaResource,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  AnyMediaResource,

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
} from '@sdkwork/react-types';
