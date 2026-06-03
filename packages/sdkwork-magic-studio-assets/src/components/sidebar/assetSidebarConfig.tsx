import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  Box,
  Database,
  File,
  FileAudio,
  FileText,
  FolderOpen,
  Image,
  LayoutGrid,
  Mic,
  Music,
  PlaySquare,
  Shield,
  Smile,
  Sparkles,
  Upload,
  Video,
  Volume2
} from 'lucide-react';
import type { AssetOrigin, AssetType } from '../../entities';

export type SourceFilterId = AssetOrigin | 'all';
type TranslateFn = (key: string, paramsOrDefault?: Record<string, string> | string) => string;

export interface SourceFilterDefinition {
  id: SourceFilterId;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

export interface QuickPresetDefinition {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  type: AssetType | 'all';
  origin: SourceFilterId;
}

export const SOURCE_FILTERS: SourceFilterDefinition[] = [
  {
    id: 'all',
    labelKey: 'assetCenter.sources.all.label',
    descriptionKey: 'assetCenter.sources.all.description',
    icon: FolderOpen
  },
  {
    id: 'upload',
    labelKey: 'assetCenter.sources.upload.label',
    descriptionKey: 'assetCenter.sources.upload.description',
    icon: Upload
  },
  {
    id: 'ai',
    labelKey: 'assetCenter.sources.ai.label',
    descriptionKey: 'assetCenter.sources.ai.description',
    icon: Sparkles
  },
  {
    id: 'stock',
    labelKey: 'assetCenter.sources.stock.label',
    descriptionKey: 'assetCenter.sources.stock.description',
    icon: Database
  },
  {
    id: 'system',
    labelKey: 'assetCenter.sources.system.label',
    descriptionKey: 'assetCenter.sources.system.description',
    icon: Shield
  }
];

export const QUICK_PRESETS: QuickPresetDefinition[] = [
  {
    id: 'preset-all',
    labelKey: 'assetCenter.presets.all.label',
    descriptionKey: 'assetCenter.presets.all.description',
    icon: LayoutGrid,
    type: 'all',
    origin: 'all'
  },
  {
    id: 'preset-upload-image',
    labelKey: 'assetCenter.presets.uploadImage.label',
    descriptionKey: 'assetCenter.presets.uploadImage.description',
    icon: Image,
    type: 'image',
    origin: 'upload'
  },
  {
    id: 'preset-ai-video',
    labelKey: 'assetCenter.presets.aiVideo.label',
    descriptionKey: 'assetCenter.presets.aiVideo.description',
    icon: Video,
    type: 'video',
    origin: 'ai'
  },
  {
    id: 'preset-character',
    labelKey: 'assetCenter.presets.character.label',
    descriptionKey: 'assetCenter.presets.character.description',
    icon: Smile,
    type: 'character',
    origin: 'all'
  }
];

const SOURCE_LABEL_FALLBACK: Record<SourceFilterId, string> = {
  all: 'All Sources',
  upload: 'Uploads',
  ai: 'AI Generated',
  stock: 'Stock',
  system: 'System'
};

const SOURCE_LABEL_KEY: Record<SourceFilterId, string> = {
  all: 'assetCenter.sources.all.label',
  upload: 'assetCenter.sources.upload.label',
  ai: 'assetCenter.sources.ai.label',
  stock: 'assetCenter.sources.stock.label',
  system: 'assetCenter.sources.system.label'
};

const TYPE_LABEL_KEY: Record<AssetType | 'all', string> = {
  all: 'assetCenter.typeLabels.all',
  image: 'assetCenter.typeLabels.image',
  video: 'assetCenter.typeLabels.video',
  audio: 'assetCenter.typeLabels.audio',
  music: 'assetCenter.typeLabels.music',
  voice: 'assetCenter.typeLabels.voice',
  text: 'assetCenter.typeLabels.text',
  character: 'assetCenter.typeLabels.character',
  model3d: 'assetCenter.typeLabels.model3d',
  lottie: 'assetCenter.typeLabels.lottie',
  file: 'assetCenter.typeLabels.file',
  effect: 'assetCenter.typeLabels.effect',
  transition: 'assetCenter.typeLabels.transition',
  subtitle: 'assetCenter.typeLabels.subtitle',
  sfx: 'assetCenter.typeLabels.sfx'
};

export const resolveSourceLabel = (
  id: SourceFilterId,
  t?: TranslateFn
): string => {
  const fallback = SOURCE_LABEL_FALLBACK[id] || id;
  if (!t) {
    return fallback;
  }
  return t(SOURCE_LABEL_KEY[id], fallback);
};

export const resolveTypeLabel = (
  id: AssetType | 'all',
  t?: TranslateFn,
  fallback?: string
): string => {
  const fallbackValue = fallback || id;
  if (!t) {
    return fallbackValue;
  }
  return t(TYPE_LABEL_KEY[id], fallbackValue);
};

export const resolveTypeIcon = (id: AssetType | 'all'): LucideIcon => {
  switch (id) {
    case 'all':
      return LayoutGrid;
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'character':
      return Smile;
    case 'audio':
      return FileAudio;
    case 'music':
      return Music;
    case 'voice':
      return Mic;
    case 'sfx':
      return Volume2;
    case 'effect':
      return Sparkles;
    case 'transition':
      return ArrowRightLeft;
    case 'model3d':
      return Box;
    case 'lottie':
      return PlaySquare;
    case 'text':
    case 'subtitle':
      return FileText;
    case 'file':
      return File;
    default:
      return LayoutGrid;
  }
};
