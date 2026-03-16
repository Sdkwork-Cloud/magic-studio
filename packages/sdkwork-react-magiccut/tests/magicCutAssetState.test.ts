import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';
import type { UnifiedDigitalAsset } from '@sdkwork/react-types';

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
});
