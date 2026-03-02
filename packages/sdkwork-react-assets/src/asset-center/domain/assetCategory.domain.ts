import type {
  AssetBusinessDomain,
  AssetContentKey,
  AssetType
} from '@sdkwork/react-types';
import { DOMAIN_ALLOWED_TYPES } from './assetCenter.domain';

export interface AssetCenterCategory {
  id: AssetType;
  label: string;
  accepts: string[];
  contentType: AssetContentKey;
}

export const ASSET_CENTER_CATEGORIES: AssetCenterCategory[] = [
  { id: 'image', label: 'Images', accepts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.tiff'], contentType: 'image' },
  { id: 'video', label: 'Videos', accepts: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'], contentType: 'video' },
  { id: 'audio', label: 'Audio', accepts: ['.wav', '.mp3', '.ogg', '.flac', '.aac', '.m4a'], contentType: 'audio' },
  { id: 'music', label: 'Music', accepts: ['.mp3', '.wav', '.ogg', '.flac'], contentType: 'music' },
  { id: 'voice', label: 'Voices', accepts: ['.json', '.voice', '.wav', '.mp3'], contentType: 'voice' },
  { id: 'text', label: 'Texts', accepts: ['.txt', '.md'], contentType: 'text' },
  { id: 'character', label: 'Characters', accepts: ['.json', '.char', '.dh', '.png', '.glb', '.gltf', '.fbx'], contentType: 'character' },
  { id: 'sfx', label: 'Sound Effects', accepts: ['.wav', '.mp3', '.ogg', '.aac'], contentType: 'sfx' },
  { id: 'effect', label: 'Effects', accepts: ['.effect', '.cube', '.lut', '.fx'], contentType: 'effect' },
  { id: 'transition', label: 'Transitions', accepts: ['.transition', '.trans'], contentType: 'transition' },
  { id: 'subtitle', label: 'Subtitles', accepts: ['.srt', '.ass', '.vtt'], contentType: 'subtitle' },
  { id: 'model3d', label: '3D Models', accepts: ['.glb', '.gltf', '.obj', '.fbx'], contentType: 'model3d' },
  { id: 'lottie', label: 'Animations', accepts: ['.json', '.lottie'], contentType: 'lottie' },
  { id: 'file', label: 'Files', accepts: [], contentType: 'file' }
];

const CONTENT_KEY_TO_ASSET_TYPE: Record<AssetContentKey, AssetType> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  music: 'music',
  voice: 'voice',
  text: 'text',
  character: 'character',
  model3d: 'model3d',
  lottie: 'lottie',
  file: 'file',
  effect: 'effect',
  transition: 'transition',
  subtitle: 'subtitle',
  sfx: 'sfx'
};

export const toAssetType = (contentType: AssetContentKey): AssetType => {
  return CONTENT_KEY_TO_ASSET_TYPE[contentType];
};

export const toContentKey = (assetType: AssetType): AssetContentKey => {
  return assetType;
};

export const resolveDomainAssetTypes = (
  domain: AssetBusinessDomain
): AssetType[] => {
  return DOMAIN_ALLOWED_TYPES[domain].map((item) => toAssetType(item));
};

export const resolveAcceptExtensionsByTypes = (
  types?: AssetType[]
): string[] => {
  if (!types || types.length === 0) {
    return Array.from(
      new Set(
        ASSET_CENTER_CATEGORIES.flatMap((item) => item.accepts)
      )
    );
  }

  return Array.from(
    new Set(
      ASSET_CENTER_CATEGORIES
        .filter((item) => types.includes(item.id))
        .flatMap((item) => item.accepts)
    )
  );
};

const resolveCategoryById = (id: AssetType): AssetCenterCategory | undefined => {
  return ASSET_CENTER_CATEGORIES.find((item) => item.id === id);
};

export interface DetectAssetTypeOptions {
  fallback?: AssetType;
  candidates?: AssetType[];
  preferred?: AssetType;
}

export const detectAssetTypeByFilename = (
  filename: string,
  options: DetectAssetTypeOptions = {}
): AssetType => {
  const fallback = options.fallback || 'file';
  const parts = filename.split('.');
  const ext = parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
  if (!ext) {
    return fallback;
  }

  if (options.preferred) {
    const preferred = resolveCategoryById(options.preferred);
    if (preferred && preferred.accepts.includes(ext)) {
      return preferred.id;
    }
  }

  if (options.candidates && options.candidates.length > 0) {
    const matchedCandidates: AssetType[] = [];
    for (const candidate of options.candidates) {
      const category = resolveCategoryById(candidate);
      if (category && category.accepts.includes(ext)) {
        matchedCandidates.push(category.id);
      }
    }
    if (matchedCandidates.length === 1) {
      return matchedCandidates[0];
    }
    if (matchedCandidates.length > 1) {
      // .json is heavily overloaded across voice/character/lottie/profile payloads.
      if (ext === '.json') {
        return fallback;
      }
      return matchedCandidates[0];
    }
    // When candidate constraints are provided, do not fall back to global categories.
    return fallback;
  }

  const matched = ASSET_CENTER_CATEGORIES.find((item) => item.accepts.includes(ext));
  return matched?.id || fallback;
};
