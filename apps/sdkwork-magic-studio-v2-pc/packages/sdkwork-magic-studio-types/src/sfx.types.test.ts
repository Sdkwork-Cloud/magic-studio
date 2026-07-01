import { describe, expect, it } from 'vitest';

import {
  createGeneratedSfxResult,
  createSfxTask,
  resolveGeneratedSfxResultUrl,
} from './sfx.types';

describe('sfx AGI-native editor models', () => {
  it('hydrates generated sfx results from canonical resource objects', () => {
    const result = createGeneratedSfxResult({
      id: 'sfx-artifact-1',
      uuid: 'sfx-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'sfx-resource-uuid-1',
        assetId: 'sfx-asset-1',
        assetUuid: 'sfx-asset-uuid-1',
        primaryResourceId: 'sfx-resource-1',
        primaryResourceUuid: 'sfx-resource-uuid-1',
        resourceViewId: 'sfx-view-1',
        resourceViewUuid: 'sfx-view-uuid-1',
        url: 'https://example.com/generated-sfx.mp3',
        duration: 3,
      },
      duration: 3,
    });

    expect(result).toMatchObject({
      id: 'sfx-artifact-1',
      uuid: 'sfx-artifact-uuid-1',
      assetId: 'sfx-asset-1',
      assetUuid: 'sfx-asset-uuid-1',
      primaryResourceId: 'sfx-resource-1',
      primaryResourceUuid: 'sfx-resource-uuid-1',
      resourceViewId: 'sfx-view-1',
      resourceViewUuid: 'sfx-view-uuid-1',
      duration: 3,
      resource: {
        uuid: 'sfx-resource-uuid-1',
        url: 'https://example.com/generated-sfx.mp3',
        duration: 3,
      },
    });
    expect(result.url).toBeUndefined();
    expect(resolveGeneratedSfxResultUrl(result)).toBe('https://example.com/generated-sfx.mp3');
  });

  it('creates sfx tasks with nullable persistence ids and stable uuids', () => {
    const task = createSfxTask({
      config: {
        prompt: 'short cinematic whoosh',
        duration: 3,
        model: 'audioldm-2',
        mediaType: 'sfx',
      },
      status: 'pending',
    });

    expect(task).toMatchObject({
      id: null,
      status: 'pending',
      config: {
        prompt: 'short cinematic whoosh',
      },
    });
    expect(task.uuid).toBeTruthy();
  });

  it('hydrates the canonical sfx resource url from top-level fallback without flattening it back', () => {
    const result = createGeneratedSfxResult({
      url: 'https://example.com/canonical-top-level-sfx.mp3',
      duration: 2,
      resource: {
        id: null,
        uuid: 'sfx-resource-uuid-top-level',
        duration: 2,
      },
    });

    expect(result.url).toBeUndefined();
    expect(result.resource.url).toBe('https://example.com/canonical-top-level-sfx.mp3');
    expect(resolveGeneratedSfxResultUrl(result)).toBe('https://example.com/canonical-top-level-sfx.mp3');
  });

  it('falls back to legacy top-level sfx urls when canonical resources are absent', () => {
    expect(
      resolveGeneratedSfxResultUrl({
        url: 'https://example.com/legacy-sfx.mp3',
      } as any)
    ).toBe('https://example.com/legacy-sfx.mp3');
  });

  it('does not fabricate resource view identity when only primary resource identity is known', () => {
    const result = createGeneratedSfxResult({
      assetId: 'sfx-asset-db-2',
      primaryResourceId: 'sfx-resource-db-2',
      primaryResourceUuid: 'sfx-resource-uuid-2',
      url: 'https://example.com/generated-sfx-2.mp3',
      duration: 2,
      resource: {
        id: null,
        uuid: 'sfx-resource-entity-uuid-2',
        duration: 2,
      },
    });

    expect(result).toMatchObject({
      assetId: 'sfx-asset-db-2',
      assetUuid: null,
      primaryResourceId: 'sfx-resource-db-2',
      primaryResourceUuid: 'sfx-resource-uuid-2',
      resourceViewId: null,
      resourceViewUuid: null,
      resource: {
        assetId: 'sfx-asset-db-2',
        primaryResourceId: 'sfx-resource-db-2',
        primaryResourceUuid: 'sfx-resource-uuid-2',
        resourceViewId: null,
        resourceViewUuid: null,
      },
    });
  });
});
