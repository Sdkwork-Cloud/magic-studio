import { describe, expect, it } from 'vitest';

import { createImageInputResourceRef } from '../../entities';
import {
  canGenerateByImagePanelSchema,
  createImagePanelRuntimeState,
  getImageOutputConfigPatch,
} from './schema';

describe('image panel schema', () => {
  const firstRef = createImageInputResourceRef({
    assetId: 'image-asset-1',
    assetUuid: 'image-asset-uuid-1',
    resourceViewId: 'image-view-1',
    resourceViewUuid: 'image-view-uuid-1',
    url: 'https://example.com/reference-1.png',
    name: 'Reference 1',
  });

  const secondRef = createImageInputResourceRef({
    assetId: 'image-asset-2',
    assetUuid: 'image-asset-uuid-2',
    resourceViewId: 'image-view-2',
    resourceViewUuid: 'image-view-uuid-2',
    url: 'https://example.com/reference-2.png',
    name: 'Reference 2',
  });

  const locatorOnlyRef = createImageInputResourceRef({
    path: 'assets://workspaces/ws-4/projects/proj-4/media/originals/image/reference-locator.png',
    name: 'Locator Ref',
  });

  it('counts canonical image refs instead of raw string urls', () => {
    const state = createImagePanelRuntimeState(
      {
        prompt: 'cinematic portrait',
        referenceImages: [firstRef, secondRef],
      },
      false
    );

    expect(state).toMatchObject({
      hasPrompt: true,
      hasReferenceImage: true,
      referenceCount: 2,
    });
  });

  it('allows image variation generation with reference images even when prompt is empty', () => {
    const state = createImagePanelRuntimeState(
      {
        prompt: '',
        referenceImages: [firstRef],
      },
      false
    );

    expect(canGenerateByImagePanelSchema(state)).toBe(true);
  });

  it('counts locator-only image refs as valid references', () => {
    const state = createImagePanelRuntimeState(
      {
        prompt: '',
        referenceImages: [locatorOnlyRef],
      },
      false
    );

    expect(state).toMatchObject({
      hasPrompt: false,
      hasReferenceImage: true,
      referenceCount: 1,
    });
    expect(canGenerateByImagePanelSchema(state)).toBe(true);
  });

  it('normalizes image config reference arrays as canonical refs', () => {
    const patch = getImageOutputConfigPatch('gemini-3-flash-image', {
      prompt: 'cinematic portrait',
      referenceImages: [firstRef, secondRef, firstRef],
      referenceImage: firstRef,
      batchSize: 99,
    });

    expect(patch).toMatchObject({
      batchSize: 4,
      referenceImages: [firstRef, secondRef],
    });
  });
});
