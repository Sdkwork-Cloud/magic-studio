export const MAGIC_STUDIO_CREATION_CAPABILITY_TARGETS = [
  'short_drama',
  'video',
  'image',
  'one_click',
  'human',
  'music',
  'speech',
  'sfx',
] as const;

export type MagicStudioCreationCapabilityTarget =
  (typeof MAGIC_STUDIO_CREATION_CAPABILITY_TARGETS)[number];

export interface MagicStudioCreationCapabilitiesQuery {
  target?: MagicStudioCreationCapabilityTarget;
}

export interface MagicStudioCreationOption {
  value?: string;
  label?: string;
  description?: string;
}

export interface MagicStudioCreationModelCapabilities {
  supportsReasoning?: boolean;
  supportsMultimodal?: boolean;
  supportsFunctionCall?: boolean;
  aspectRatioOptions?: MagicStudioCreationOption[];
  resolutionOptions?: MagicStudioCreationOption[];
  durationOptions?: MagicStudioCreationOption[];
  styleOptions?: MagicStudioCreationOption[];
}

export interface MagicStudioCreationModel {
  modelId?: string;
  modelKey?: string;
  model?: string;
  name?: string;
  description?: string;
  channel?: string;
  modelType?: string;
  capabilities?: MagicStudioCreationModelCapabilities;
}

export interface MagicStudioCreationChannel {
  channel?: string;
  name?: string;
  models?: MagicStudioCreationModel[];
}

export interface MagicStudioCreationStyleAsset {
  path?: string;
  url?: string;
  type?: 'image' | 'video' | string;
}

export interface MagicStudioCreationStyleAssetGroup {
  scene?: MagicStudioCreationStyleAsset;
  portrait?: MagicStudioCreationStyleAsset;
  sheet?: MagicStudioCreationStyleAsset;
  video?: MagicStudioCreationStyleAsset;
}

export interface MagicStudioCreationStyleOption {
  id?: string;
  label?: string;
  description?: string;
  usage?: string[];
  prompt?: string;
  promptZh?: string;
  custom?: boolean;
  previewColor?: string;
  assets?: MagicStudioCreationStyleAssetGroup;
}

export interface MagicStudioCreationCapabilities {
  target?: string;
  channels?: MagicStudioCreationChannel[];
  styleOptions?: MagicStudioCreationStyleOption[];
}
