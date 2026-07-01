import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-commons';
import type { UnifiedDigitalAsset } from '@sdkwork/magic-studio-types';
import * as magicCutAssetStateModule from '../src/domain/assets/magicCutAssetState';

import {
  buildMagicCutAssetRef,
  buildMagicCutAssetRegistrationInput,
  buildMagicCutProjectGraphSource,
  buildMagicCutResourceView,
  createEmptyMagicCutAssetState,
  normalizeMagicCutAssetState,
  normalizeMagicCutResourceView,
  upsertMagicCutAsset,
} from '../src/domain/assets/magicCutAssetState';

const createAsset = (overrides: Partial<UnifiedDigitalAsset> = {}): UnifiedDigitalAsset =>
  ({
    id: 'asset-1',
    uuid: 'asset-1',
    assetId: 'asset-1',
    key: 'workspace-1/magiccut/asset-1',
    title: 'Hero Clip',
    primaryType: 'video',
    payload: {
      video: {
        id: 'media-1',
        uuid: 'media-1',
        name: 'hero.mp4',
        type: MediaResourceType.VIDEO,
        path: 'assets://workspace-1/magiccut/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
        extension: '.mp4',
        duration: 12,
        width: 1920,
        height: 1080,
        metadata: {
          fps: 30,
          codec: 'h264',
        },
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
      assets: [
        {
          id: 'media-1',
          uuid: 'media-1',
          name: 'hero.mp4',
          type: MediaResourceType.VIDEO,
          path: 'assets://workspace-1/magiccut/hero.mp4',
          url: 'https://cdn.example.com/hero.mp4',
          extension: '.mp4',
          duration: 12,
          width: 1920,
          height: 1080,
          metadata: {
            fps: 30,
            codec: 'h264',
          },
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
      ],
    },
    scope: {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      domain: 'magiccut',
    },
    storage: {
      mode: 'hybrid',
      primary: {
        protocol: 'assets',
        uri: 'assets://workspace-1/magiccut/hero.mp4',
        path: '/workspace-1/magiccut/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
      },
      cacheable: true,
    },
    status: 'ready',
    versionInfo: {
      version: 1,
    },
    metadata: {
      label: 'primary',
      origin: 'upload',
    },
    createdAt: '2026-03-14T00:00:00.000Z',
    updatedAt: '2026-03-14T00:00:00.000Z',
    ...overrides,
  }) as UnifiedDigitalAsset;

describe('magicCutAssetState', () => {
  it('creates a canonical resource view from a unified asset', () => {
    const resourceView = buildMagicCutResourceView(createAsset());

    expect(resourceView).toMatchObject({
      id: 'asset-1',
      uuid: 'asset-1',
      name: 'Hero Clip',
      type: MediaResourceType.VIDEO,
      path: 'assets://workspace-1/magiccut/hero.mp4',
      url: 'https://cdn.example.com/hero.mp4',
      duration: 12,
      width: 1920,
      height: 1080,
      metadata: {
        assetId: 'asset-1',
        primaryResourceId: 'media-1',
        storageMode: 'hybrid',
        scopeDomain: 'magiccut',
        codec: 'h264',
        label: 'primary',
      },
    });
  });

  it('builds asset-backed timeline refs from canonical resource views', () => {
    const resourceView = buildMagicCutResourceView(createAsset());

    expect(buildMagicCutAssetRef(resourceView)).toMatchObject({
      type: 'MediaResource',
      id: 'asset-1',
      uuid: 'asset-1',
      assetId: 'asset-1',
      primaryResourceId: 'media-1',
      primaryType: 'video',
      storageMode: 'hybrid',
      scopeDomain: 'magiccut',
    });
    expect(buildMagicCutAssetRef(resourceView).resourceViewId).toBeUndefined();
  });

  it('preserves explicit resource-view identity without backfilling semantic ids from asset-backed state keys', () => {
    const resourceView = normalizeMagicCutResourceView({
      id: 'legacy-resource-view-1',
      uuid: 'legacy-resource-view-uuid-1',
      name: 'Legacy Hero Clip',
      type: MediaResourceType.VIDEO,
      path: 'assets://workspace-1/magiccut/legacy-hero.mp4',
      url: 'https://cdn.example.com/legacy-hero.mp4',
      metadata: {
        assetId: 'asset-legacy-1',
        assetUuid: 'asset-legacy-uuid-1',
        resourceViewId: 'resource-view-db-1',
        resourceViewUuid: 'resource-view-uuid-1',
        primaryType: 'video',
      },
      createdAt: 0,
      updatedAt: 0,
    } as any);

    expect(resourceView.id).toBe('asset-legacy-1');
    expect(resourceView.assetId).toBe('asset-legacy-1');
    expect(resourceView.resourceViewId).toBe('resource-view-db-1');
    expect(resourceView.primaryResourceId).toBeUndefined();
    expect(resourceView.metadata).toMatchObject({
      assetId: 'asset-legacy-1',
      assetUuid: 'asset-legacy-uuid-1',
      resourceViewId: 'resource-view-db-1',
      resourceViewUuid: 'resource-view-uuid-1',
      primaryType: 'video',
    });
    expect(resourceView.metadata.primaryResourceId).toBeUndefined();
    expect(buildMagicCutAssetRef(resourceView)).toMatchObject({
      id: 'asset-legacy-1',
      uuid: 'legacy-resource-view-uuid-1',
      assetId: 'asset-legacy-1',
      resourceViewId: 'resource-view-db-1',
      primaryType: 'video',
    });
    expect(buildMagicCutAssetRef(resourceView).primaryResourceId).toBeUndefined();
  });

  it('keeps canonical locator paths separate from delivery urls in normalized resource views', () => {
    const resourceView = normalizeMagicCutResourceView({
      id: 'legacy-video-resource-1',
      uuid: 'legacy-video-resource-uuid-1',
      name: 'Legacy Hero Clip',
      type: MediaResourceType.VIDEO,
      path: 'assets://workspace-1/magiccut/hero-path.mp4',
      url: 'https://cdn.example.com/hero-path.mp4',
      metadata: {
        assetId: 'asset-hero-1',
      },
      createdAt: 0,
      updatedAt: 0,
    } as any);

    expect(resourceView.path).toBe('assets://workspace-1/magiccut/hero-path.mp4');
    expect(resourceView.url).toBe('https://cdn.example.com/hero-path.mp4');
  });

  it('does not backfill unresolved locator values into the normalized delivery url field', () => {
    const resourceView = normalizeMagicCutResourceView({
      id: 'legacy-video-resource-2',
      uuid: 'legacy-video-resource-uuid-2',
      name: 'Locator Only Clip',
      type: MediaResourceType.VIDEO,
      url: 'assets://workspace-1/magiccut/locator-only.mp4',
      metadata: {
        assetId: 'asset-locator-only-1',
      },
      createdAt: 0,
      updatedAt: 0,
    } as any);

    expect(resourceView.path).toBe('assets://workspace-1/magiccut/locator-only.mp4');
    expect(resourceView.url).toBeUndefined();
  });

  it('builds canonical project-graph media source bindings from resource views', () => {
    const source = buildMagicCutProjectGraphSource({
      id: 'resource-view-1',
      uuid: 'resource-view-1',
      metadata: {
        assetId: 'asset-hero-1',
        primaryResourceId: 'primary-resource-1',
        primaryType: 'video',
        storageMode: 'hybrid',
        scopeDomain: 'magiccut',
        sourceRecipeUuid: 'recipe-1',
        sourceExecutionUuid: 'execution-1',
        sourceArtifactUuid: 'artifact-1',
      },
      sourceRecipeId: null,
      sourceRecipeUuid: 'recipe-1',
      sourceExecutionId: null,
      sourceExecutionUuid: 'execution-1',
      sourceArtifactId: null,
      sourceArtifactUuid: 'artifact-1',
    } as any);

    expect(source).toMatchObject({
      assetId: 'asset-hero-1',
      primaryResourceId: 'primary-resource-1',
      resourceViewId: 'resource-view-1',
      primaryType: 'video',
      storageMode: 'hybrid',
      scopeDomain: 'magiccut',
      sourceRecipeUuid: 'recipe-1',
      sourceExecutionUuid: 'execution-1',
      sourceArtifactUuid: 'artifact-1',
    });
  });

  it('does not fabricate project-graph resource-view ids from asset-backed runtime keys', () => {
    const source = buildMagicCutProjectGraphSource({
      id: 'asset-runtime-key-1',
      uuid: 'asset-runtime-key-uuid-1',
      metadata: {
        assetId: 'asset-runtime-key-1',
        primaryType: 'video',
        storageMode: 'hybrid',
        scopeDomain: 'magiccut',
      },
    } as any);

    expect(source.assetId).toBe('asset-runtime-key-1');
    expect(source.resourceViewId).toBeNull();
    expect(source.primaryResourceId).toBeNull();
    expect(source.primaryType).toBe('video');
  });

  it('builds canonical asset-center registration input for imported sdk assets', () => {
    expect(
      buildMagicCutAssetRegistrationInput(
        {
          id: 'asset-1',
          name: 'hero.mp4',
          type: 'video',
          path: 'https://cdn.example.com/hero.mp4',
          size: 4096,
          origin: 'upload',
          metadata: {
            duration: 12,
            width: 1920,
          },
          createdAt: '2026-03-14T00:00:00.000Z',
          updatedAt: '2026-03-14T00:00:00.000Z',
        },
        'https://cdn.example.com/hero.mp4',
        {
          workspaceId: 'workspace-1',
          projectId: 'project-1',
          domain: 'magiccut',
        }
      )
    ).toMatchObject({
      assetId: 'asset-1',
      type: 'video',
      name: 'hero.mp4',
      size: 4096,
      status: 'imported',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/hero.mp4',
        url: 'https://cdn.example.com/hero.mp4',
      },
      metadata: {
        origin: 'upload',
        duration: 12,
        width: 1920,
      },
      scope: {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'magiccut',
      },
    });
  });

  it('preserves runtime uuid metadata when registering an unpersisted local resource view', () => {
    const registration = buildMagicCutAssetRegistrationInput(
      {
        id: null as any,
        uuid: 'resource-view-runtime-1',
        name: 'runtime-clip.mp4',
        type: 'video',
        path: 'assets://workspace-1/magiccut/runtime-clip.mp4',
        origin: 'upload',
        metadata: {
          prompt: 'hero shot',
        },
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      } as any,
      'assets://workspace-1/magiccut/runtime-clip.mp4',
      {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'magiccut',
      }
    );

    expect(registration.assetId).toBeUndefined();
    expect(registration.metadata).toMatchObject({
      prompt: 'hero shot',
      origin: 'upload',
      assetUuid: 'resource-view-runtime-1',
      resourceViewUuid: 'resource-view-runtime-1',
    });
  });

  it('prefers canonical paths over delivery urls when registering asset-backed resources', () => {
    const registration = buildMagicCutAssetRegistrationInput(
      {
        id: 'asset-1',
        uuid: 'asset-uuid-1',
        name: 'hero.mp4',
        type: 'video',
        path: 'assets://workspace-1/magiccut/hero.mp4',
        size: 4096,
        origin: 'upload',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
      },
      'https://cdn.example.com/hero.mp4',
      {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        domain: 'magiccut',
      }
    );

    expect(registration.locator).toMatchObject({
      protocol: 'assets',
      uri: 'assets://workspace-1/magiccut/hero.mp4',
      path: 'assets://workspace-1/magiccut/hero.mp4',
      url: 'https://cdn.example.com/hero.mp4',
    });
  });

  it('upserts unified assets into canonical assets and derived resource views', () => {
    const first = upsertMagicCutAsset(createEmptyMagicCutAssetState(), createAsset());
    const second = upsertMagicCutAsset(
      first,
      createAsset({
        metadata: {
          label: 'primary',
          origin: 'upload',
          proxyReady: true,
        },
      })
    );

    expect(Object.keys(second.assets)).toEqual(['asset-1']);
    expect(Object.keys(second.resourceViews)).toEqual(['asset-1']);
    expect(second.resourceViews['asset-1']).toBe(second.resources['asset-1']);
    expect(second.resourceViews['asset-1']?.metadata).toMatchObject({
      assetId: 'asset-1',
      proxyReady: true,
    });
  });

  it('normalizes legacy resources into asset-backed state without losing canonical ids', () => {
    const normalized = normalizeMagicCutAssetState({
      assets: {},
      resourceViews: {},
      resources: {
        'clip-a': {
          id: 'clip-a',
          uuid: 'clip-a',
          name: 'Legacy Voice',
          type: MediaResourceType.VOICE,
          path: 'assets://workspace-1/magiccut/voice.wav',
          url: 'https://cdn.example.com/voice.wav',
          duration: 6,
          metadata: {
            assetId: 'voice-asset',
            language: 'zh-CN',
          },
          createdAt: 0,
          updatedAt: 0,
        } as any,
      },
      timelines: {},
      tracks: {},
      clips: {},
      layers: {},
    });

    expect(Object.keys(normalized.assets)).toEqual(['voice-asset']);
    expect(Object.keys(normalized.resourceViews)).toEqual(['voice-asset']);
    expect(normalized.resources['voice-asset']?.metadata).toMatchObject({
      assetId: 'voice-asset',
      primaryType: 'voice',
      language: 'zh-CN',
    });
    expect(normalized.resources['voice-asset']?.metadata?.primaryResourceId).toBeUndefined();
    expect(normalized.resourceViews['voice-asset']?.path).toBe('assets://workspace-1/magiccut/voice.wav');
  });

  it('does not reuse resource-view uuid as primary-resource uuid when only primaryResourceId is explicit', () => {
    const normalized = normalizeMagicCutAssetState({
      assets: {},
      resourceViews: {},
      resources: {
        'legacy-voice-resource': {
          id: 'legacy-voice-resource',
          uuid: 'resource-view-uuid-voice-1',
          name: 'Legacy Voice',
          type: MediaResourceType.VOICE,
          path: 'assets://workspace-1/magiccut/voice-2.wav',
          url: 'https://cdn.example.com/voice-2.wav',
          metadata: {
            assetId: 'voice-asset-2',
            primaryResourceId: 'primary-resource-voice-2',
            scopeDomain: 'magiccut',
          },
          createdAt: 0,
          updatedAt: 0,
        } as any,
      },
      timelines: {},
      tracks: {},
      clips: {},
      layers: {},
    });

    const primaryVoice = normalized.assets['voice-asset-2']?.payload.voice;

    expect(primaryVoice).toMatchObject({
      id: 'primary-resource-voice-2',
      uuid: 'primary-resource-voice-2',
      assetId: 'voice-asset-2',
    });
    expect(primaryVoice?.uuid).not.toBe('resource-view-uuid-voice-1');
  });

  it('detects when an asset is still referenced by the timeline', () => {
    const isMagicCutAssetInUse = (magicCutAssetStateModule as any).isMagicCutAssetInUse;
    const state = {
      assets: {
        'asset-1': createAsset(),
      },
      resourceViews: {
        'asset-1': buildMagicCutResourceView(createAsset()),
      },
      resources: {
        'asset-1': buildMagicCutResourceView(createAsset()),
      },
      timelines: {},
      tracks: {},
      clips: {
        'clip-1': {
          id: 'clip-1',
          resource: {
            id: 'asset-1',
            assetId: 'asset-1',
          },
        },
      },
      layers: {
        'layer-1': {
          id: 'layer-1',
          resource: {
            id: 'asset-2',
            assetId: 'asset-2',
          },
        },
      },
    };

    expect(isMagicCutAssetInUse(state, 'asset-1')).toBe(true);
    expect(isMagicCutAssetInUse(state, 'asset-2')).toBe(true);
    expect(isMagicCutAssetInUse(state, 'asset-3')).toBe(false);
  });

  it('does not treat a resource uuid or resource-view id as an explicit assetId reference', () => {
    const isMagicCutAssetInUse = (magicCutAssetStateModule as any).isMagicCutAssetInUse;
    const state = {
      assets: {},
      resourceViews: {},
      resources: {},
      timelines: {},
      tracks: {},
      clips: {
        'clip-1': {
          id: 'clip-1',
          resource: {
            id: 'resource-view-1',
            uuid: 'asset-1',
            resourceViewId: 'asset-1',
          },
        },
      },
      layers: {},
    };

    expect(isMagicCutAssetInUse(state, 'asset-1')).toBe(false);
  });

  it('removes an unused asset from canonical asset, view and resource maps together', () => {
    const removeMagicCutAssetFromState = (magicCutAssetStateModule as any).removeMagicCutAssetFromState;
    const assetOne = createAsset();
    const assetTwo = createAsset({
      id: 'asset-2',
      uuid: 'asset-2',
      assetId: 'asset-2',
      title: 'B-roll',
      key: 'workspace-1/magiccut/asset-2',
    });
    const state = {
      assets: {
        'asset-1': assetOne,
        'asset-2': assetTwo,
      },
      resourceViews: {
        'asset-1': buildMagicCutResourceView(assetOne),
        'asset-2': buildMagicCutResourceView(assetTwo),
      },
      resources: {
        'asset-1': buildMagicCutResourceView(assetOne),
        'asset-2': buildMagicCutResourceView(assetTwo),
      },
      timelines: {},
      tracks: {},
      clips: {},
      layers: {},
    };

    const nextState = removeMagicCutAssetFromState(state, 'asset-1');

    expect(nextState.assets).toEqual({
      'asset-2': assetTwo,
    });
    expect(Object.keys(nextState.resourceViews)).toEqual(['asset-2']);
    expect(Object.keys(nextState.resources)).toEqual(['asset-2']);
  });
});
