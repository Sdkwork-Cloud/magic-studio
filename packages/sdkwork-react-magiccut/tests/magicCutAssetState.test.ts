import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';
import type { UnifiedDigitalAsset } from '@sdkwork/react-types';
import * as magicCutAssetStateModule from '../src/domain/assets/magicCutAssetState';

import {
  buildMagicCutAssetRef,
  buildMagicCutAssetRegistrationInput,
  buildMagicCutResourceView,
  createEmptyMagicCutAssetState,
  normalizeMagicCutAssetState,
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
      resourceViewId: 'asset-1',
      primaryResourceId: 'media-1',
      primaryType: 'video',
      storageMode: 'hybrid',
      scopeDomain: 'magiccut',
    });
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
    expect(normalized.resourceViews['voice-asset']?.path).toBe('assets://workspace-1/magiccut/voice.wav');
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
