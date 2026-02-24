export { default as AssetsPage } from './pages/AssetsPage';
export { AssetSidebar } from './components/AssetSidebar';
export { ChooseAsset } from './components/ChooseAsset';
export { ChooseAssetModal } from './components/ChooseAssetModal';
export { AssetGrid } from './components/AssetGrid';
export { AIGenerateCoverModal } from './components/AIGenerateCoverModal';

export * from './i18n';

// Creation Chat Input
export { CreationChatInput } from './components/CreationChatInput/CreationChatInput';
export type { CreationChatInputProps } from './components/CreationChatInput/types';
export { InputFooterButton } from './components/CreationChatInput/components/InputFooterButton';
export { StyleSelector } from './components/CreationChatInput/StyleSelector';
export type { PortalTab, InputAttachment } from './components/CreationChatInput/types';
export type { ImportData } from './components/generate/upload/types';

// Generation components
export { GenerationChatWindow } from './components/generate/GenerationChatWindow';
export type { GenerationTask, GenerationConfig, GenerationChatWindowProps } from './components/generate/GenerationChatWindow';
export { GenerationHistoryListPane, GENERATION_TABS } from './components/generate/GenerationHistoryListPane';
export { PromptTextInput } from './components/generate/PromptTextInput';

export { useAssetUrl } from './hooks/useAssetUrl';

export { useAssetStore, AssetStoreProvider } from './store/assetStore';

export { assetService, ASSET_CATEGORIES, setMediaAnalysisAdapter } from './services/assetService';
export type { MediaAnalysisAdapter, MediaAnalysisResult } from './services/assetService';

// Enhanced asset services
export { assetServiceRegistry, MockDatabase, initializeAssetServices, getAssetService, hasAssetService, getRegisteredCategories } from './services';
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
    DigitalHumanAssetService,
    SfxAssetService
} from './services/impl';

export type { Asset, AssetType, AssetCategory, AssetMetadata, AssetOrigin } from './entities/asset.entity';

// Enhanced asset types
export type {
    VideoAsset,
    ImageAsset,
    AudioAsset,
    DigitalHumanAsset,
    SfxAsset,
    TextAsset,
    EffectAsset,
    TransitionAsset,
    AnyAsset,
    MediaResourceType
} from './entities/enhancedAsset.entity';
