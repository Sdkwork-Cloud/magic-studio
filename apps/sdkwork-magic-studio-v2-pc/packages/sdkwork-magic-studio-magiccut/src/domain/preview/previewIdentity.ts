import {
  createCutClip,
  createCutClipRef,
  createCutLayer,
} from '@sdkwork/magic-studio-types/magiccut';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import type { CutClip, CutLayer } from '../../entities/magicCut.entity';
import { buildMagicCutAssetRef } from '../assets/magicCutAssetState';

const PREVIEW_TRACK_UUID = 'preview-track';

export interface CreateMagicCutPreviewLayerInput {
  previewEffectId: string;
  targetClip: CutClip;
  order: number;
  now?: number;
}

export const createMagicCutPreviewLayer = (
  input: CreateMagicCutPreviewLayerInput
): CutLayer => {
  const now = input.now ?? Date.now();

  return createCutLayer({
    id: null,
    uuid: `preview-layer-${input.previewEffectId}`,
    clip: createCutClipRef(input.targetClip),
    layerType: 'filter',
    enabled: true,
    order: input.order,
    params: {
      definitionId: input.previewEffectId,
    },
    createdAt: now,
    updatedAt: now,
  });
};

export interface CreateMagicCutPreviewClipInput {
  resource: AnyMediaResource;
  time: number;
  projectWidth: number;
  projectHeight: number;
  now?: number;
}

export const createMagicCutPreviewClip = (
  input: CreateMagicCutPreviewClipInput
): CutClip => {
  const now = input.now ?? 0;
  const resourceKey = input.resource.uuid || input.resource.id || 'preview-resource';

  return createCutClip({
    id: null,
    uuid: `preview-clip-${resourceKey}`,
    track: {
      id: null,
      uuid: PREVIEW_TRACK_UUID,
    },
    resource: buildMagicCutAssetRef(input.resource),
    start: 0,
    duration: 1000,
    offset: input.time,
    speed: 1,
    volume: 1,
    layers: [],
    createdAt: now,
    updatedAt: now,
    transform: {
      x: 0,
      y: 0,
      width: input.projectWidth,
      height: input.projectHeight,
      rotation: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    },
    content:
      input.resource.type === MediaResourceType.TEXT ||
      input.resource.type === MediaResourceType.SUBTITLE
        ? (input.resource.metadata?.text || input.resource.name)
        : undefined,
  });
};
