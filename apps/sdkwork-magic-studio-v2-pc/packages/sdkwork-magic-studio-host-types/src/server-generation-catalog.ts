import type {
  MagicStudioCreationCapabilityTarget,
  MagicStudioCreationModelCapabilities,
  MagicStudioCreationStyleAssetGroup,
} from './server-creation.ts';
import type {
  MagicStudioVoiceListQuery,
  MagicStudioVoiceSpeaker,
} from './server-voice.ts';

export type MagicStudioGenerationCatalogTarget =
  MagicStudioCreationCapabilityTarget;

export interface MagicStudioGenerationCatalogQuery {
  target?: MagicStudioGenerationCatalogTarget;
}

export interface MagicStudioGenerationCatalogProviderModel {
  id: string;
  name: string;
  modelKey?: string;
  description?: string;
  modelType?: string;
  capabilities?: MagicStudioCreationModelCapabilities;
}

export interface MagicStudioGenerationCatalogProvider {
  id: string;
  name: string;
  target: MagicStudioGenerationCatalogTarget;
  modelCount: number;
  models: MagicStudioGenerationCatalogProviderModel[];
}

export interface MagicStudioGenerationCatalogModel {
  id: string;
  name: string;
  target: MagicStudioGenerationCatalogTarget;
  providerId: string;
  providerName: string;
  modelKey?: string;
  description?: string;
  modelType?: string;
  capabilities?: MagicStudioCreationModelCapabilities;
}

export interface MagicStudioGenerationCatalogStyle {
  id: string;
  target: MagicStudioGenerationCatalogTarget;
  label: string;
  description?: string;
  usage?: string[];
  prompt?: string;
  promptZh?: string;
  custom?: boolean;
  previewColor?: string;
  assets?: MagicStudioCreationStyleAssetGroup;
}

export type MagicStudioGenerationCatalogVoice = MagicStudioVoiceSpeaker;

export interface MagicStudioGenerationCatalogVoiceQuery
  extends MagicStudioVoiceListQuery {}
