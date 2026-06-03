import { describe, expect, it } from 'vitest';

import {
  createImageInputResourceRef,
  createImageTask,
  createGeneratedImageResult,
  createImageGridCell,
  hasImageInputResourceReference,
  resolveGeneratedImageResultPath,
  resolveGeneratedImageResultThumbnailUrl,
  resolveGeneratedImageResultUrl,
  resolveImageInputResourceKey,
  resolveImageInputResourcePath,
  resolveImageInputResourceReference,
  resolveImageInputResourceUrl,
} from './image.types';

describe('image AGI-native editor models', () => {
  it('creates canonical image input refs with uuid-first identity and delivery fallback', () => {
    const ref = createImageInputResourceRef({
      assetId: 'image-asset-1',
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: 'image-resource-1',
      primaryResourceUuid: 'image-resource-uuid-1',
      resourceViewId: 'image-view-1',
      resourceViewUuid: 'image-view-uuid-1',
      resource: {
        id: 'image-resource-entity-1',
        uuid: 'image-resource-entity-uuid-1',
        type: 'IMAGE' as any,
        name: 'Reference image',
        url: 'https://example.com/reference-image.png',
        width: 1536,
        height: 864,
      },
    });

    expect(ref).toMatchObject({
      id: null,
      uuid: 'image-view-uuid-1',
      assetId: 'image-asset-1',
      assetUuid: 'image-asset-uuid-1',
      primaryResourceId: 'image-resource-1',
      primaryResourceUuid: 'image-resource-uuid-1',
      resourceViewId: 'image-view-1',
      resourceViewUuid: 'image-view-uuid-1',
      type: 'image',
    });
    expect(resolveImageInputResourceKey(ref)).toBe('image-view-uuid-1');
    expect(resolveImageInputResourcePath(ref)).toBe('https://example.com/reference-image.png');
    expect(resolveImageInputResourceUrl(ref)).toBe('https://example.com/reference-image.png');
  });

  it('preserves canonical locator paths separately from delivery urls for image input refs', () => {
    const ref = createImageInputResourceRef({
      assetId: 'image-asset-2',
      resourceViewUuid: 'image-view-uuid-2',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/reference-image-2.png',
      url: 'https://cdn.example.com/reference-image-2.png',
      metadata: {
        deliveryUrl: 'https://cdn.example.com/reference-image-2.png',
      },
    });

    expect(ref).toMatchObject({
      assetId: 'image-asset-2',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/image/reference-image-2.png',
      url: 'https://cdn.example.com/reference-image-2.png',
    });
    expect(resolveImageInputResourcePath(ref)).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/image/reference-image-2.png'
    );
    expect(resolveImageInputResourceUrl(ref)).toBe('https://cdn.example.com/reference-image-2.png');
  });

  it('treats locator-only image refs as valid business references even without identity fields', () => {
    const ref = createImageInputResourceRef({
      path: 'assets://workspaces/ws-2/projects/proj-2/media/originals/image/reference-image-3.png',
      name: 'Reference Image 3',
    });

    expect(resolveImageInputResourceKey(ref)).toBe(ref.uuid);
    expect(resolveImageInputResourceReference(ref)).toBe(
      'assets://workspaces/ws-2/projects/proj-2/media/originals/image/reference-image-3.png'
    );
    expect(hasImageInputResourceReference(ref)).toBe(true);
  });

  it('creates generated image results with nullable persistence id and immutable uuid', () => {
    const result = createGeneratedImageResult({
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-1',
      resourceViewUuid: 'view-uuid-1',
      url: 'https://example.com/generated-image.png',
      width: 1024,
      height: 1024,
    });

    expect(result).toMatchObject({
      id: null,
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-1',
      resourceViewUuid: 'view-uuid-1',
      width: 1024,
      height: 1024,
      resource: {
        id: 'resource-1',
        uuid: 'view-uuid-1',
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        primaryResourceId: 'resource-1',
        primaryResourceUuid: 'resource-uuid-1',
        resourceViewId: 'view-1',
        resourceViewUuid: 'view-uuid-1',
        url: 'https://example.com/generated-image.png',
        width: 1024,
        height: 1024,
      },
    });
    expect(result.url).toBeUndefined();
    expect(resolveGeneratedImageResultUrl(result)).toBe('https://example.com/generated-image.png');
    expect(result.uuid).toBeTruthy();
  });

  it('preserves provided artifact identity when hydrating stored generation results', () => {
    const result = createGeneratedImageResult({
      id: 'artifact-1',
      uuid: 'artifact-uuid-1',
      assetId: 'asset-9',
      artifactUuid: 'artifact-uuid-1',
      executionUuid: 'execution-uuid-1',
      recipeUuid: 'recipe-uuid-1',
      url: 'https://example.com/stored-image.png',
    });

    expect(result).toMatchObject({
      id: 'artifact-1',
      uuid: 'artifact-uuid-1',
      assetId: 'asset-9',
      artifactUuid: 'artifact-uuid-1',
      executionUuid: 'execution-uuid-1',
      recipeUuid: 'recipe-uuid-1',
    });
  });

  it('hydrates canonical image and cover resources when callers use resource-first contracts', () => {
    const result = createGeneratedImageResult({
      id: 'artifact-2',
      uuid: 'artifact-uuid-2',
      resource: {
        id: null,
        uuid: 'image-resource-uuid-2',
        assetId: 'image-asset-2',
        assetUuid: 'image-asset-uuid-2',
        primaryResourceId: 'image-resource-2',
        primaryResourceUuid: 'image-resource-uuid-2',
        resourceViewId: 'image-view-2',
        resourceViewUuid: 'image-view-uuid-2',
        url: 'https://example.com/canonical-image.png',
        width: 2048,
        height: 1024,
      },
      coverResource: {
        id: null,
        uuid: 'image-cover-resource-uuid-2',
        url: 'https://example.com/canonical-image-cover.png',
        width: 512,
        height: 256,
      },
      prompt: 'precision image',
    });

    expect(result).toMatchObject({
      id: 'artifact-2',
      uuid: 'artifact-uuid-2',
      assetId: 'image-asset-2',
      assetUuid: 'image-asset-uuid-2',
      primaryResourceId: 'image-resource-2',
      primaryResourceUuid: 'image-resource-uuid-2',
      resourceViewId: 'image-view-2',
      resourceViewUuid: 'image-view-uuid-2',
      resource: {
        uuid: 'image-resource-uuid-2',
        url: 'https://example.com/canonical-image.png',
      },
      coverResource: {
        uuid: 'image-cover-resource-uuid-2',
        url: 'https://example.com/canonical-image-cover.png',
      },
    });
    expect(result.url).toBeUndefined();
    expect(result.thumbnailUrl).toBeUndefined();
    expect(resolveGeneratedImageResultUrl(result)).toBe('https://example.com/canonical-image.png');
    expect(resolveGeneratedImageResultThumbnailUrl(result)).toBe(
      'https://example.com/canonical-image-cover.png'
    );
  });

  it('hydrates the canonical resource url from top-level fallback without flattening it back onto the result', () => {
    const result = createGeneratedImageResult({
      url: 'https://example.com/canonical-top-level-image.png',
      resource: {
        id: null,
        uuid: 'image-resource-uuid-top-level',
        width: 768,
        height: 512,
      },
    });

    expect(result.url).toBeUndefined();
    expect(result.resource.url).toBe('https://example.com/canonical-top-level-image.png');
    expect(resolveGeneratedImageResultUrl(result)).toBe(
      'https://example.com/canonical-top-level-image.png'
    );
  });

  it('falls back to legacy top-level urls when canonical resources are absent', () => {
    expect(
      resolveGeneratedImageResultUrl({
        url: 'https://example.com/legacy-image.png',
      } as any)
    ).toBe('https://example.com/legacy-image.png');

    expect(
      resolveGeneratedImageResultThumbnailUrl({
        thumbnailUrl: 'https://example.com/legacy-image-cover.png',
      } as any)
    ).toBe('https://example.com/legacy-image-cover.png');
  });

  it('preserves canonical locators on path without fabricating a renderable image url', () => {
    const result = createGeneratedImageResult({
      resource: {
        id: null,
        uuid: 'image-resource-locator-1',
        path: 'assets://workspace/image/locator-image.png',
        width: 768,
        height: 512,
      },
    });

    expect(result.resource.path).toBe('assets://workspace/image/locator-image.png');
    expect(result.resource.url).toBeUndefined();
    expect(resolveGeneratedImageResultPath(result)).toBe('assets://workspace/image/locator-image.png');
    expect(resolveGeneratedImageResultUrl(result)).toBeNull();
  });

  it('does not fabricate resource view identity when only primary resource identity is known', () => {
    const result = createGeneratedImageResult({
      assetId: 'image-asset-db-3',
      primaryResourceId: 'image-resource-db-3',
      primaryResourceUuid: 'image-resource-uuid-3',
      url: 'https://example.com/generated-image-3.png',
      width: 800,
      height: 600,
      resource: {
        id: null,
        uuid: 'image-resource-entity-uuid-3',
        width: 800,
        height: 600,
      },
    });

    expect(result).toMatchObject({
      assetId: 'image-asset-db-3',
      assetUuid: null,
      primaryResourceId: 'image-resource-db-3',
      primaryResourceUuid: 'image-resource-uuid-3',
      resourceViewId: null,
      resourceViewUuid: null,
      resource: {
        assetId: 'image-asset-db-3',
        primaryResourceId: 'image-resource-db-3',
        primaryResourceUuid: 'image-resource-uuid-3',
        resourceViewId: null,
        resourceViewUuid: null,
      },
    });
  });

  it('creates grid cells with their own stable identity and normalized source resources', () => {
    const cell = createImageGridCell({
      source: {
        url: 'data:image/png;base64,AAAA',
        width: 512,
        height: 512,
      },
    });

    expect(cell.id).toBeNull();
    expect(cell.uuid).toBeTruthy();
    expect(cell.source).toMatchObject({
      id: null,
      width: 512,
      height: 512,
      resource: {
        id: null,
        url: 'data:image/png;base64,AAAA',
        width: 512,
        height: 512,
      },
    });
    expect(cell.source?.url).toBeUndefined();
    expect(resolveGeneratedImageResultUrl(cell.source)).toBe('data:image/png;base64,AAAA');
    expect(cell.source?.uuid).toBeTruthy();
  });

  it('creates image tasks with nullable persistence ids and stable uuids', () => {
    const task = createImageTask({
      config: {
        prompt: 'high fidelity product shot',
        aspectRatio: '1:1',
      },
      status: 'pending',
    });

    expect(task).toMatchObject({
      id: null,
      status: 'pending',
      config: {
        prompt: 'high fidelity product shot',
        aspectRatio: '1:1',
      },
    });
    expect(task.uuid).toBeTruthy();
  });
});
