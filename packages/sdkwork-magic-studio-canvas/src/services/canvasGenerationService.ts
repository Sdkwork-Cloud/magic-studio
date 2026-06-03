import { persistGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import {
  createImageInputResourceRef,
} from '@sdkwork/magic-studio-image/entities';
import {
  imageService,
} from '@sdkwork/magic-studio-image/services';
import {
  createVideoInputResourceRef,
  type VideoGenerationMode,
} from '@sdkwork/magic-studio-video/entities';
import {
  buildUnifiedVideoGenerationRequest,
  videoService,
} from '@sdkwork/magic-studio-video/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import type { CanvasMediaResource } from '@sdkwork/magic-studio-types/canvas';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import { toCanvasGeneratedResource } from '../utils/canvasGeneratedOutcomeResource';

export interface GenerateCanvasNodeMediaInput {
  type: 'image' | 'video';
  prompt: string;
  negativePrompt?: string;
  model?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  videoMode?: string;
  referenceImages?: CanvasMediaResource[];
}

const DEFAULT_IMAGE_MODEL = 'gemini-3-flash-image';
const DEFAULT_VIDEO_MODEL = 'sdkwork-2.5';
const DEFAULT_ASPECT_RATIO = '1:1';
const DEFAULT_VIDEO_ASPECT_RATIO = '16:9';
const DEFAULT_VIDEO_RESOLUTION = '720p';
const DEFAULT_VIDEO_DURATION = '5s';

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

type CanvasIdentityField =
  | 'assetId'
  | 'assetUuid'
  | 'primaryResourceId'
  | 'primaryResourceUuid'
  | 'resourceViewId'
  | 'resourceViewUuid';

const resolveCanvasResourceIdentityValue = (
  resource: CanvasMediaResource,
  key: CanvasIdentityField
): string | null =>
  pickFirstString(
    resource[key],
    (resource.metadata as Record<string, unknown> | undefined)?.[key]
  );

const resolveCanvasResourceIdentity = (resource: CanvasMediaResource) => ({
  assetId: resolveCanvasResourceIdentityValue(resource, 'assetId'),
  assetUuid: resolveCanvasResourceIdentityValue(resource, 'assetUuid'),
  primaryResourceId: resolveCanvasResourceIdentityValue(resource, 'primaryResourceId'),
  primaryResourceUuid: resolveCanvasResourceIdentityValue(resource, 'primaryResourceUuid'),
  resourceViewId: resolveCanvasResourceIdentityValue(resource, 'resourceViewId'),
  resourceViewUuid: resolveCanvasResourceIdentityValue(resource, 'resourceViewUuid'),
});

const toCanvasImageInputRef = (resource: CanvasMediaResource) =>
  createImageInputResourceRef({
    ...resolveCanvasResourceIdentity(resource),
    url: resource.url,
    name: resource.name,
    mimeType: resource.format,
    metadata: resource.metadata,
    resource: {
      id: resource.id,
      uuid: resource.uuid,
      url: resource.url,
      path: resource.path,
      type: MediaResourceType.IMAGE,
      name: resource.name,
      mimeType: resource.format,
      width: resource.width,
      height: resource.height,
      metadata: resource.metadata,
    },
  });

const toCanvasVideoInputRef = (resource: CanvasMediaResource) =>
  createVideoInputResourceRef({
    ...resolveCanvasResourceIdentity(resource),
    url: resource.url,
    name: resource.name,
    mimeType: resource.format,
    type: resource.type,
    metadata: resource.metadata,
    resource: {
      id: resource.id,
      uuid: resource.uuid,
      url: resource.url,
      path: resource.path,
      type:
        resource.type === 'video'
          ? 'VIDEO'
          : resource.type === 'audio'
            ? 'AUDIO'
            : 'IMAGE',
      name: resource.name,
      mimeType: resource.format,
      width: resource.width,
      height: resource.height,
      duration: resource.duration,
      metadata: resource.metadata,
    } as any,
  });

export const normalizeCanvasVideoMode = (
  mode?: string
): VideoGenerationMode => {
  switch (mode) {
    case 'start_end':
    case 'smart_multi':
    case 'subject_ref':
    case 'smart_reference':
      return mode;
    case 'all_round':
    default:
      return 'smart_reference';
  }
};

const persistCanvasOutcome = async (
  outcome: GenerationOutcome,
  type: 'image' | 'video'
): Promise<CanvasMediaResource> => {
  const persisted = await persistGenerationOutcomeAsset({
    outcome,
    type,
    domain: 'canvas',
    name: `canvas_gen_${type}_${Date.now()}.${type === 'video' ? 'mp4' : 'png'}`,
  });

  return toCanvasGeneratedResource({
    outcome,
    persisted,
    fallbackType: type,
  });
};

const generateCanvasImage = async (
  input: GenerateCanvasNodeMediaInput
): Promise<CanvasMediaResource> => {
  const references = (input.referenceImages || [])
    .filter((resource) => resource.type === 'image')
    .map(toCanvasImageInputRef);

  const outcome = await imageService.generateImage({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    model: input.model || DEFAULT_IMAGE_MODEL,
    aspectRatio: (input.aspectRatio || DEFAULT_ASPECT_RATIO) as any,
    referenceImage: references[0],
    referenceImages: references,
  });

  return persistCanvasOutcome(outcome, 'image');
};

const generateCanvasVideo = async (
  input: GenerateCanvasNodeMediaInput
): Promise<CanvasMediaResource> => {
  const normalizedMode = normalizeCanvasVideoMode(input.videoMode);
  const references = (input.referenceImages || []).map(toCanvasVideoInputRef);
  const imageReferences = references.filter((resource) => resource.type === 'image');
  const videoReferences = references.filter((resource) => resource.type === 'video');

  const request = buildUnifiedVideoGenerationRequest({
    mode: normalizedMode,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt || '',
    model: input.model || DEFAULT_VIDEO_MODEL,
    styleId: 'none',
    aspectRatio: (input.aspectRatio || DEFAULT_VIDEO_ASPECT_RATIO) as any,
    resolution: (input.resolution || DEFAULT_VIDEO_RESOLUTION) as any,
    duration: (input.duration || DEFAULT_VIDEO_DURATION) as any,
    fps: 30,
    mediaType: 'video',
    image: imageReferences[0],
    lastFrame: normalizedMode === 'start_end' ? imageReferences[1] : undefined,
    referenceImages:
      normalizedMode === 'smart_reference' || normalizedMode === 'smart_multi'
        ? imageReferences
        : undefined,
    referenceVideos:
      normalizedMode === 'smart_multi'
        ? videoReferences
        : undefined,
    batchSize: 1,
    shotType: 'single-shot',
    promptExtend: true,
    watermark: true,
    generateAudio: false,
    cameraFixed: false,
  });

  const outcome = await videoService.generateVideo(request);
  return persistCanvasOutcome(outcome, 'video');
};

export const generateCanvasNodeMedia = async (
  input: GenerateCanvasNodeMediaInput
): Promise<CanvasMediaResource> => {
  if (input.type === 'video') {
    return generateCanvasVideo(input);
  }

  return generateCanvasImage(input);
};
