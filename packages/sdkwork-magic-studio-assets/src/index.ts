export { default as AssetsPage } from './pages/AssetsPage';
export { AssetSidebar } from './components/AssetSidebar';
export { ChooseAsset } from './components/ChooseAsset';
export { ChooseAssetModal } from './components/ChooseAssetModal';
export { AssetGrid } from './components/AssetGrid';
export { AssetCenterHeader } from './components/AssetCenterHeader';
export { AssetTypeTabs } from './components/AssetTypeTabs';
export { AssetFilterDrawer } from './components/AssetFilterDrawer';
export { AssetPreviewModal } from './components/AssetPreviewModal';
export { AIGenerateCoverModal } from './components/AIGenerateCoverModal';

export * from './i18n';

// Creation Chat Input
export { CreationChatInput } from './components/CreationChatInput/CreationChatInput';
export type { CreationChatInputProps } from './components/CreationChatInput/types';
export {
  createInputAttachment,
  matchesInputAttachmentKey,
  removeInputAttachmentByKey,
  resolveInputAttachmentKey,
} from './components/CreationChatInput/attachmentIdentity';
export { InputFooterButton } from './components/CreationChatInput/components/InputFooterButton';
export { StyleSelector } from './components/CreationChatInput/StyleSelector';
export type { PortalTab, InputAttachment } from './components/CreationChatInput/types';
export { createImportData, resolveImportDataKey } from './components/generate/upload/types';
export type { ImportData } from './components/generate/upload/types';

// Generation components
export { GenerationChatWindow } from './components/generate/GenerationChatWindow';
export type {
    GenerationTask,
    GenerationConfig,
    GenerationChatReferenceItem,
    GenerationChatWindowAdapter,
    GenerationChatWindowProps
} from './components/generate/GenerationChatWindow';
export { GenerationHistoryListPane, GENERATION_TABS } from './components/generate/GenerationHistoryListPane';
export type { GenerationResultSelection, GenerationTaskRecord } from '@sdkwork/magic-studio-generation-history';
export { PromptTextInput } from './components/generate/PromptTextInput';
export type { PromptTextInputProps } from './components/generate/PromptTextInput';
export { createPromptTextInputCapabilityProps } from './components/generate/promptCapabilityProps';
export { PromptPickerDialog } from './components/generate/PromptPickerDialog';
export { PromptHistoryDialog } from './components/generate/PromptHistoryDialog';

export { useAssetUrl } from './hooks/useAssetUrl';
export { useAssetCenterShortcuts } from './hooks/useAssetCenterShortcuts';

export { useAssetStore, AssetStoreProvider } from './store/assetStore';

export {
    assetBusinessService,
    assetService,
    ASSET_CATEGORIES,
    setMediaAnalysisAdapter,
    clearCreationCapabilityCache,
    clearGenerationCatalogCache,
    fetchCreationCapabilities,
    fetchCreationModelProviders,
    fetchGenerationCatalogModels,
    fetchGenerationCatalogProviders,
    fetchGenerationCatalogStyles,
    fetchGenerationCatalogVoices,
    flattenCreationModels,
    findCreationModel,
    normalizeCreationOptions,
    toCreationModelProviders,
    toGenerationCatalogModelProviders,
    toGenerationCatalogStyleOptions,
    getCreationModelDurationOptions,
    getCreationModelResolutionOptions,
    getCreationModelAspectRatioOptions,
    resolveCreationStyleOptions,
    resolveCreationEntryCapabilityOptions,
    queryAssetsBySdk,
    importAssetBySdk,
    importAssetFromUrlBySdk,
    persistGenerationOutcomeAsset,
    persistGeneratedSelectionAsset,
    renameAssetBySdk,
    deleteAssetBySdk,
    resolveAssetPrimaryUrlBySdk,
    setAssetCoverGenerationAdapter,
    getAssetCoverGenerationAdapter,
    resetAssetCoverGenerationAdapter
} from './services';
export type { MediaAnalysisAdapter, MediaAnalysisResult, AssetSdkQueryCategory } from './services';
export type {
    CreationCapabilityTarget,
    CreationCapabilitySnapshot,
    CreationEntryCapabilityOptions,
    GenerationCatalogModel,
    GenerationCatalogProvider,
    GenerationCatalogQuery,
    GenerationCatalogStyle,
    GenerationCatalogTarget,
    GenerationCatalogVoice,
    GenerationCatalogVoiceQuery,
    PersistGenerationOutcomeAssetInput,
    PersistedGenerationOutcomeAsset,
    PersistGeneratedSelectionAssetInput,
    PersistGeneratedSelectionLike,
    PersistedGeneratedSelectionAsset,
    AssetCoverGenerationAdapter,
    GenerateAssetCoverImageRequest
} from './services';

// Enhanced asset services
export { assetServiceRegistry, initializeAssetServices, getAssetService, hasAssetService, getRegisteredCategories } from './services';
export type { IAssetService } from './services';
export {
    MediaAssetService,
    VideoAssetService,
    ImageAssetService,
    AudioAssetService,
    TextAssetService,
    EffectAssetService,
    TransitionAssetService,
    MusicAssetService,
    CharacterAssetService,
    SfxAssetService
} from './services/impl';

export type { Asset, AssetType, AssetCategory, AssetMetadata, AssetOrigin } from './entities';

// Enhanced asset types
export type {
    VideoAsset,
    ImageAsset,
    AudioAsset,
    CharacterAsset,
    SfxAsset,
    TextAsset,
    EffectAsset,
    TransitionAsset,
    AnyAsset,
    MediaResourceType
} from './entities';

// Unified asset-center architecture
export * from './asset-center';
