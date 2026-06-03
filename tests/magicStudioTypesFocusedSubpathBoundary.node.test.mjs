import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(workspaceRoot, relativePath), 'utf8');
}

function importsSymbolFromMagicStudioTypesRoot(source, symbol) {
  const rootImportPattern =
    /(import|export)\s*(type\s+)?\{([^}]*)\}\s*from ['"]@sdkwork\/magic-studio-types['"]/gms;
  const symbolPattern = new RegExp(
    `(^|[\\s,])(?:type\\s+)?${symbol}(?:\\s+as\\s+[A-Za-z0-9_$]+)?(?=[\\s,]|$)`
  );

  for (const match of source.matchAll(rootImportPattern)) {
    if (symbolPattern.test(match[3])) {
      return true;
    }
  }

  return false;
}

const EXPECTED_ALIAS_SUBPATHS = [
  '@sdkwork/magic-studio-types/entity',
  '@sdkwork/magic-studio-types/service',
  '@sdkwork/magic-studio-types/pagination',
  '@sdkwork/magic-studio-types/storage',
  '@sdkwork/magic-studio-types/media',
  '@sdkwork/magic-studio-types/assets',
  '@sdkwork/magic-studio-types/asset-center',
  '@sdkwork/magic-studio-types/image',
  '@sdkwork/magic-studio-types/video',
  '@sdkwork/magic-studio-types/audio',
  '@sdkwork/magic-studio-types/music',
  '@sdkwork/magic-studio-types/character',
  '@sdkwork/magic-studio-types/voice',
  '@sdkwork/magic-studio-types/sfx',
  '@sdkwork/magic-studio-types/chat',
  '@sdkwork/magic-studio-types/agi',
  '@sdkwork/magic-studio-types/input-resource',
  '@sdkwork/magic-studio-types/vocabulary',
  '@sdkwork/magic-studio-types/catalog',
  '@sdkwork/magic-studio-types/content',
  '@sdkwork/magic-studio-types/user',
  '@sdkwork/magic-studio-types/workspace',
  '@sdkwork/magic-studio-types/runtime',
  '@sdkwork/magic-studio-types/theme-mode',
  '@sdkwork/magic-studio-types/infrastructure',
  '@sdkwork/magic-studio-types/asset-reference',
];

const TARGET_FILE_EXPECTATIONS = [
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/platform/types.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/runtime'],
    forbiddenRootSymbols: ['SdkworkRuntimeKind'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/runtime'],
    forbiddenRootSymbols: ['SdkworkRuntimeKind'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/platform/runtime/kinds.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/runtime'],
    forbiddenRootSymbols: ['isBrowserHostedRuntimeKind', 'isDesktopShellRuntimeKind'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/sdk/appSdkEnv.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/runtime'],
    forbiddenRootSymbols: [
      'normalizePublicAppPlatformValue',
      'PublicAppPlatform',
      'WindowPlatformRuntimeKind',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/base/LocalStorageService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/service',
      '@sdkwork/magic-studio-types/pagination',
    ],
    forbiddenRootSymbols: [
      'ServiceResult',
      'Page',
      'PageRequest',
      'Result',
      'EntityIdentityLike',
      'EntityTimestamp',
      'createUuid',
      'deriveClientEntityUuidFromId',
      'entityKeysEqual',
      'matchesEntityKey',
      'resolveEntityKey',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/storage/types.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/storage'],
    forbiddenRootSymbols: ['StorageObject', 'UploadResult'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/notification/notificationService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/service'],
    forbiddenRootSymbols: ['ServiceResult', 'Result'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/notification/entities.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['BaseEntity'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/media/mediaService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity', '@sdkwork/magic-studio-types/media'],
    forbiddenRootSymbols: ['resolveEntityKey', 'AnyMediaResource'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/media/downloadService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity', '@sdkwork/magic-studio-types/media'],
    forbiddenRootSymbols: ['resolveEntityKey', 'AnyMediaResource'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/ai/generationOutcome.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/vocabulary',
    ],
    forbiddenRootSymbols: [
      'MediaResourceType',
      'createClientEntityIdentity',
      'AnyMediaResource',
      'MediaResourceOrigin',
      'AgiExecutionStatus',
      'AgiGenerationMode',
      'AgiGenerationProduct',
      'AgiMediaKind',
      'ArtifactSet',
      'ArtifactRole',
      'GeneratedArtifact',
      'GenerationExecution',
      'GenerationExecutionScope',
      'GenerationExecutionTelemetry',
      'GenerationOutcome',
      'GenerationRecipe',
      'MediaInputRef',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/ai/genAIService.ts',
    expectedSubpaths: [],
    forbiddenRootSymbols: ['GenerationOutcome', 'isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/storage/magicStudioPaths.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/media'],
    forbiddenRootSymbols: ['AssetContentKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-commons/src/types.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/infrastructure',
      '@sdkwork/magic-studio-types/content',
      '@sdkwork/magic-studio-types/catalog',
      '@sdkwork/magic-studio-types/vocabulary',
      '@sdkwork/magic-studio-types/workspace',
      '@sdkwork/magic-studio-types/theme-mode',
    ],
    forbiddenRootSymbols: [
      'BaseEntity',
      'MediaResource',
      'FileMediaResource',
      'VideoMediaResource',
      'ImageMediaResource',
      'AudioMediaResource',
      'MusicMediaResource',
      'CharacterMediaResource',
      'AssetAtomicMediaResource',
      'AssetMediaResource',
      'AnyMediaResource',
      'GenerationProduct',
      'GenerationPlatform',
      'IFileSystemProvider',
      'FileStat',
      'FileEntry',
      'ICompressionProvider',
      'IDEDefinition',
      'IPlacementStrategy',
      'DragInput',
      'DragContext',
      'PlacementResult',
      'FBO',
      'RenderContext',
      'RenderOverrideClip',
      'IMediaEncoder',
      'ExportOptions',
      'ExportProgressCallback',
      'IFileSaveStrategy',
      'WindowControlsProps',
      'PortalTab',
      'SettingInputProps',
      'SettingSelectProps',
      'SettingToggleProps',
      'BaseProps',
      'ModelProvider',
      'CardProps',
      'Bookmark',
      'HistoryItem',
      'DriveMetadata',
      'Effect',
      'ThemeMode',
      'GalleryAuthor',
      'GalleryItem',
      'GalleryItemType',
      'LocalizedText',
      'LocalizedTextLike',
      'StyleAsset',
      'StyleOption',
      'InputAttachmentData',
      'GenerationType',
      'MediaResourceType',
      'MediaScene',
      'AudioFormat',
      'NotificationType',
      'ModelProviderId',
      'RemixIntent',
      'StudioProject',
      'StudioWorkspace',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-commons/src/index.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/service',
      '@sdkwork/magic-studio-types/pagination',
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/storage',
      '@sdkwork/magic-studio-types/vocabulary',
      '@sdkwork/magic-studio-types/catalog',
      '@sdkwork/magic-studio-types/content',
      '@sdkwork/magic-studio-types/user',
      '@sdkwork/magic-studio-types/workspace',
      '@sdkwork/magic-studio-types/theme-mode',
    ],
    forbiddenRootSymbols: [
      'Result',
      'ServiceResult',
      'IBaseService',
      'Sort',
      'Pageable',
      'PageRequest',
      'Page',
      'DEFAULT_PAGE_SIZE',
      'ClientEntityIdentity',
      'EntityIdentityLike',
      'createUuid',
      'hasPersistentEntityId',
      'resolveEntityKey',
      'resolveEntityKeys',
      'matchesEntityKey',
      'entityKeysEqual',
      'createClientEntityIdentity',
      'ThemeMode',
      'ObjectRef',
      'MediaResource',
      'FileMediaResource',
      'VideoMediaResource',
      'ImageMediaResource',
      'AudioMediaResource',
      'AssetAtomicMediaResource',
      'AnyMediaResource',
      'MediaInputRef',
      'GenerationRecipe',
      'GenerationExecution',
      'GeneratedArtifact',
      'ArtifactSet',
      'ArtifactDeliveryView',
      'GenerationOutcome',
      'StorageObject',
      'UploadResult',
      'IStorageProvider',
      'MediaResourceType',
      'MediaScene',
      'AudioFormat',
      'NotificationType',
      'GenerationType',
      'ModelProviderId',
      'RemixIntent',
      'User',
      'UserSettings',
      'AppNotification',
      'TagsContent',
      'ProjectType',
      'AspectRatio',
      'MediaType',
      'ExportResolution',
      'ModelInfo',
      'ChannelInfo',
      'ModelInfoResponse',
      'GalleryAuthor',
      'InputAttachmentData',
      'GenerationMode',
      'PlatformKey',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/modelInfoService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/catalog',
      '@sdkwork/magic-studio-types/service',
    ],
    forbiddenRootSymbols: ['GenerationType', 'ModelInfoResponse', 'ServiceResult', 'Result'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-core/src/services/remix/remix.entity.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/vocabulary'],
    forbiddenRootSymbols: ['MediaResourceType'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/asset-center',
      '@sdkwork/magic-studio-types/media',
    ],
    forbiddenRootSymbols: [
      'AssetCenterStats',
      'AssetCenterPageRequest',
      'AssetLifecycleStatus',
      'AssetStorageMode',
      'AssetLocator',
      'UnifiedAssetPayload',
      'UnifiedAssetQueryResult',
      'UnifiedDigitalAsset',
      'AssetAtomicMediaResource',
      'AssetContentKey',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/asset-center/domain/assetCenter.domain.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/asset-center',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/vocabulary',
    ],
    forbiddenRootSymbols: [
      'MediaResourceType',
      'AssetBusinessDomain',
      'AssetScope',
      'AssetLocator',
      'AssetLifecycleStatus',
      'AssetDomainReference',
      'UnifiedAssetPayload',
      'UnifiedDigitalAsset',
      'AssetAtomicMediaResource',
      'AssetContentKey',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/assetService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/service',
      '@sdkwork/magic-studio-types/pagination',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/vocabulary',
      '@sdkwork/magic-studio-types/asset-center',
    ],
    forbiddenRootSymbols: [
      'Result',
      'matchesEntityKey',
      'resolveEntityKey',
      'MediaResourceType',
      'AnyMediaResource',
      'IBaseService',
      'Page',
      'PageRequest',
      'ServiceResult',
      'AssetContentKey',
      'AssetLocator',
      'AssetScope',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/pagination',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/asset-center',
    ],
    forbiddenRootSymbols: [
      'createUuid',
      'AssetBusinessDomain',
      'AssetContentKey',
      'Page',
      'PageRequest',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/pagination',
      '@sdkwork/magic-studio-types/asset-center',
    ],
    forbiddenRootSymbols: [
      'entityKeysEqual',
      'hasPersistentEntityId',
      'Page',
      'AssetBusinessDomain',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/agi',
    ],
    forbiddenRootSymbols: [
      'createClientEntityIdentity',
      'AgiExecutionStatus',
      'AgiGenerationMode',
      'GenerationExecution',
      'GenerationOutcome',
      'MediaInputRef',
      'isRenderableInputResourceUrl',
      'isStableInputResourceLocator',
      'resolveInputResourcePath',
      'resolveInputResourceUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: [
      'AgiGenerationMode',
      'GenerationOutcome',
      'MediaInputRef',
      'isRenderableInputResourceUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/services/audioService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['GenerationOutcome', 'MediaInputRef', 'isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/services/musicService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['AgiGenerationMode', 'GenerationOutcome', 'MediaInputRef'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/services/sfxService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['GenerationOutcome', 'MediaInputRef', 'isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/store/videoStore.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/agi',
    ],
    forbiddenRootSymbols: ['matchesEntityKey', 'GenerationExecution', 'GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/store/audioStore.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/input-resource',
      '@sdkwork/magic-studio-types/vocabulary',
      '@sdkwork/magic-studio-types/agi',
    ],
    forbiddenRootSymbols: [
      'matchesEntityKey',
      'isRenderableInputResourceUrl',
      'MediaResourceType',
      'GenerationOutcome',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/utils/videoInputResource.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/assets',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['Asset', 'isStableInputResourceLocator'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/utils/imageInputResource.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/assets',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['Asset', 'isStableInputResourceLocator'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/utils/audioInputResource.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/assets',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['Asset', 'isStableInputResourceLocator'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/utils/voiceInputResource.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/assets',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['Asset', 'isStableInputResourceLocator'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/utils/characterAvatarAsset.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/assets'],
    forbiddenRootSymbols: ['Asset'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['createUuid', 'entityKeysEqual', 'matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/service'],
    forbiddenRootSymbols: ['Result', 'ServiceResult'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/services/musicHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['createUuid', 'entityKeysEqual', 'matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/services/sfxHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceHistoryService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/service',
    ],
    forbiddenRootSymbols: ['ServiceResult', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/generatedVoiceResult.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/vocabulary',
    ],
    forbiddenRootSymbols: ['GenerationOutcome', 'MediaResourceType'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/services/imageGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/services/audioGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/services/musicGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/services/sfxGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceGenerationAssetPersistence.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/agi'],
    forbiddenRootSymbols: ['GenerationOutcome'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/input-resource'],
    forbiddenRootSymbols: ['isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/services/characterRequestBuilder.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/input-resource'],
    forbiddenRootSymbols: ['isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/assets',
      '@sdkwork/magic-studio-types/input-resource',
    ],
    forbiddenRootSymbols: ['Asset', 'isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoGenerationItem.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/assets'],
    forbiddenRootSymbols: ['Asset'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/GalleryGrid.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/input-resource'],
    forbiddenRootSymbols: ['isRenderableInputResourceUrl'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/ChooseVoiceSpeaker.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/ChooseVoiceSpeakerModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/services/characterHistoryService.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['entityKeysEqual', 'matchesEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/services/characterTaskMapper.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/input-resource',
      '@sdkwork/magic-studio-types/vocabulary',
    ],
    forbiddenRootSymbols: [
      'isRenderableInputResourceUrl',
      'isStableInputResourceLocator',
      'MediaResourceType',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/entities/image-panel.entity.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/image'],
    forbiddenRootSymbols: ['ImageAspectRatio'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/entities/index.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/agi',
      '@sdkwork/magic-studio-types/assets',
      '@sdkwork/magic-studio-types/video',
    ],
    forbiddenRootSymbols: ['MediaInputRef', 'VideoAsset', 'VideoConfig', 'createVideoTask'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/entities/index.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/audio'],
    forbiddenRootSymbols: [
      'AudioGenerationParams',
      'AudioInputResourceType',
      'createAudioInputResourceRef',
      'resolveAudioTaskResultUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/entities/index.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/music'],
    forbiddenRootSymbols: [
      'MusicConfig',
      'GeneratedMusicResult',
      'createMusicTask',
      'resolveGeneratedMusicResultUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/entities/index.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/image'],
    forbiddenRootSymbols: [
      'ImageGenerationConfig',
      'GeneratedImageResult',
      'createImageTask',
      'resolveGeneratedImageResultUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/entities/index.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/character'],
    forbiddenRootSymbols: [
      'CharacterConfig',
      'Character',
      'createCharacter',
      'resolveCharacterResourceUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/entities/index.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/sfx'],
    forbiddenRootSymbols: [
      'SfxConfig',
      'GeneratedSfxResult',
      'createSfxTask',
      'resolveGeneratedSfxResultUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/entities/voice.entity.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/voice'],
    forbiddenRootSymbols: [
      'VoiceConfig',
      'GeneratedVoiceResult',
      'createVoiceTask',
      'resolveGeneratedVoiceResultUrl',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/entities/index.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/chat'],
    forbiddenRootSymbols: ['ChatSession', 'ChatMessage', 'ChatMode'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-workspace/src/services/workspaceService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/media',
      '@sdkwork/magic-studio-types/pagination',
      '@sdkwork/magic-studio-types/service',
      '@sdkwork/magic-studio-types/vocabulary',
      '@sdkwork/magic-studio-types/workspace',
    ],
    forbiddenRootSymbols: [
      'createUuid',
      'deriveClientEntityUuidFromId',
      'IBaseService',
      'ImageMediaResource',
      'MediaResourceType',
      'Page',
      'PageRequest',
      'ProjectType',
      'Result',
      'ServiceResult',
      'StudioWorkspace',
      'StudioProject',
      'matchesEntityKey',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-workspace/src/store/workspaceStore.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/workspace'],
    forbiddenRootSymbols: ['StudioWorkspace', 'StudioProject', 'ProjectType'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-workspace/src/entities/workspace.entity.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/workspace'],
    forbiddenRootSymbols: ['StudioWorkspace', 'StudioProject'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-workspace/src/components/WorkspaceProjectSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/workspace'],
    forbiddenRootSymbols: ['ProjectType', 'StudioProject', 'StudioWorkspace'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-workspace/src/components/modals/CreateProjectModal.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/workspace'],
    forbiddenRootSymbols: ['ProjectType'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/services/chatService.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/pagination',
      '@sdkwork/magic-studio-types/service',
    ],
    forbiddenRootSymbols: [
      'matchesEntityKey',
      'resolveEntityKey',
      'Page',
      'PageRequest',
      'Result',
      'ServiceResult',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/store/chatStore.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/store/chatSessionIdentity.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/pages/ChatPage.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/components/MessageList.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/components/EmbeddedChatPane.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-chat/src/components/ChatSidebar.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['matchesEntityKey', 'resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-generation-history/src/resultSelection.ts',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/entity',
      '@sdkwork/magic-studio-types/vocabulary',
    ],
    forbiddenRootSymbols: ['resolveEntityKey', 'MediaResourceType', 'MediaType'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-generation-history/src/components/GenerationPreview.tsx',
    expectedSubpaths: [
      '@sdkwork/magic-studio-types/content',
      '@sdkwork/magic-studio-types/image',
      '@sdkwork/magic-studio-types/vocabulary',
    ],
    forbiddenRootSymbols: [
      'createGeneratedImageResult',
      'GeneratedImageResult',
      'GalleryItem',
      'MediaResourceType',
    ],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-generation-history/src/components/GenerationItem.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/vocabulary'],
    forbiddenRootSymbols: ['MediaType'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/VideoChatInput.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/video'],
    forbiddenRootSymbols: ['VideoConfig'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/components/AspectRatioSelector.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/video'],
    forbiddenRootSymbols: ['VideoAspectRatio', 'VideoResolution'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/components/ControlPanel.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/vocabulary'],
    forbiddenRootSymbols: ['AspectRatio'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/components/MusicGenerationItem.tsx',
    expectedSubpaths: ['@sdkwork/magic-studio-types/entity'],
    forbiddenRootSymbols: ['resolveEntityKey'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-video/src/constants.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/infrastructure'],
    forbiddenRootSymbols: ['ModelProvider'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-image/src/constants.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/infrastructure'],
    forbiddenRootSymbols: ['ModelProvider'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-audio/src/constants.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/infrastructure'],
    forbiddenRootSymbols: ['ModelProvider'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-music/src/constants.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/infrastructure'],
    forbiddenRootSymbols: ['ModelProvider'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-sfx/src/constants.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/infrastructure'],
    forbiddenRootSymbols: ['ModelProvider'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-voicespeaker/src/constants.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/infrastructure'],
    forbiddenRootSymbols: ['ModelProvider'],
  },
  {
    relativePath: 'packages/sdkwork-magic-studio-character/src/pages/importCharacterTask.ts',
    expectedSubpaths: ['@sdkwork/magic-studio-types/vocabulary'],
    forbiddenRootSymbols: ['MediaResourceType'],
  },
];

test('magic-studio-types package exports and workspace aliases expose focused foundational subpaths', () => {
  const packageJson = JSON.parse(readSource('packages/sdkwork-magic-studio-types/package.json'));
  const exportsField = packageJson.exports ?? {};
  const viteSource = readSource('vite.config.ts');
  const tsconfigSource = readSource('tsconfig.json');
  const vitestSource = readSource('tests/vitest.codex.config.mjs');

  for (const subpath of EXPECTED_ALIAS_SUBPATHS) {
    const exportKey = `.${subpath.replace('@sdkwork/magic-studio-types', '')}`;
    const escaped = subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    assert.ok(
      exportsField[exportKey],
      `Expected @sdkwork/magic-studio-types to export ${exportKey}.`,
    );
    assert.match(viteSource, new RegExp(escaped), `Expected vite.config.ts to alias ${subpath}.`);
    assert.match(tsconfigSource, new RegExp(escaped), `Expected tsconfig.json to map ${subpath}.`);
    assert.match(
      vitestSource,
      new RegExp(escaped),
      `Expected tests/vitest.codex.config.mjs to alias ${subpath}.`,
    );
  }
});

test('foundational packages consume focused magic-studio-types subpaths instead of the broad root entry for core contracts', () => {
  for (const { relativePath, expectedSubpaths, forbiddenRootSymbols } of TARGET_FILE_EXPECTATIONS) {
    const source = readSource(relativePath);

    for (const subpath of expectedSubpaths) {
      assert.match(
        source,
        new RegExp(subpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `Expected ${relativePath} to import from ${subpath}.`,
      );
    }

    const importedForbiddenSymbols = forbiddenRootSymbols.filter((symbol) =>
      importsSymbolFromMagicStudioTypesRoot(source, symbol)
    );

    assert.deepEqual(
      importedForbiddenSymbols,
      [],
      `Expected ${relativePath} to stop sourcing foundational contracts from the broad @sdkwork/magic-studio-types root entry. Offenders: ${importedForbiddenSymbols.join(', ')}`,
    );
  }
});
