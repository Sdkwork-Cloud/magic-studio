/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  i18nService: {
    t: (key: string, params?: Record<string, unknown>) =>
      typeof params?.index === 'string' ? `${key}-${params.index}` : key,
  },
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  assetCenterService: {
    initialize: vi.fn(),
    findById: vi.fn(),
    registerExistingAsset: vi.fn(),
    resolveLocatorUrl: vi.fn(),
    importAsset: vi.fn(),
    bindReference: vi.fn(),
  },
  isManagedAssetLocator: (value: string) =>
    value.startsWith('assets://') ||
    value.startsWith('file://') ||
    value.startsWith('desktop://'),
  isExplicitLocalAssetLocator: (value: string) =>
    value.startsWith('file://') || value.startsWith('desktop://'),
  isDesktopAssetLocator: (value: string) => value.startsWith('desktop://'),
  readWorkspaceScope: vi.fn(() => ({ workspaceId: 'workspace-test' })),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk: vi.fn(),
  importAssetFromUrlBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  inlineDataService: {
    tryExtractInlineData: vi.fn(),
  },
  uploadHelper: {
    pickFiles: vi.fn(),
  },
}));

vi.mock('@sdkwork/magic-studio-settings', () => ({
  settingsBusinessService: {
    getSettings: vi.fn().mockResolvedValue({
      success: true,
      data: {
        materialStorage: {
          mode: 'local-first-sync',
        },
      },
    }),
  },
}));

vi.mock('../src/services', () => ({
  TrackFactory: {
    getTrackConfig: (type: string, isMain = false) => ({
      type,
      height: isMain ? 120 : type === 'audio' ? 72 : type === 'effect' ? 64 : 72,
      name: isMain ? 'Main Track' : `${type} Track`,
    }),
    inferTrackType: (resourceType: string) =>
      resourceType === 'AUDIO' || resourceType === 'MUSIC' || resourceType === 'VOICE'
        ? 'audio'
        : resourceType === 'SUBTITLE'
          ? 'subtitle'
          : resourceType === 'TEXT'
            ? 'text'
            : 'video',
    isCompatible: () => true,
  },
  magicCutBusinessService: {
    timelineOperationService: {
      calculateDetachAudio: vi.fn(),
    },
    magicCutProjectService: {},
    templateService: {
      saveTemplate: vi.fn(),
      instantiateTemplate: vi.fn(),
    },
  },
}));

vi.mock('../src/controllers/PlayerController', () => ({
  PlayerController: class PlayerController {
    play = vi.fn();
    pause = vi.fn();
    seek = vi.fn();
    syncState = vi.fn();
    setLooping = vi.fn();
    setTotalDuration = vi.fn();
    setPlaybackRange = vi.fn();
    getCurrentTime = vi.fn(() => 0);
  },
}));

vi.mock('../src/engine/text/TextRenderer', () => ({
  textRenderer: {
    measure: vi.fn(() => ({
      width: 320,
      height: 120,
    })),
  },
  DEFAULT_TEXT_STYLE: {},
}));

import { MediaResourceType, type AnyMediaResource } from '@sdkwork/magic-studio-commons';
import { assetCenterService } from '@sdkwork/magic-studio-assets/asset-center';
import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import { uploadHelper } from '@sdkwork/magic-studio-core/services';
import { settingsBusinessService } from '@sdkwork/magic-studio-settings';
import { createDefaultMagicCutProject } from '../src/store/defaultProject';
import { magicCutBusinessService } from '../src/services';
import { MagicCutStoreProvider, useMagicCutStore } from '../src/store/magicCutStore';

const StoreProbe = ({
  onStore,
}: {
  onStore: (store: ReturnType<typeof useMagicCutStore>) => void;
}) => {
  const store = useMagicCutStore();
  onStore(store);
  return null;
};

const createVisualResource = (
  id: string,
  uuid: string
): AnyMediaResource =>
  ({
    id,
    uuid,
    assetId: id,
    type: MediaResourceType.VIDEO,
    name: `${id}.mp4`,
    path: `${id}.mp4`,
    duration: 4,
    metadata: {
      duration: 4,
      primaryType: 'video',
    },
    createdAt: 0,
    updatedAt: 0,
  }) as AnyMediaResource;

const createPersistedVideoResource = (): AnyMediaResource =>
  ({
    id: 'resource-view-video-4',
    uuid: 'resource-view-video-uuid-4',
    assetId: 'asset-video-4',
    resourceViewId: 'resource-view-video-4',
    type: MediaResourceType.VIDEO,
    name: 'hero-shot.mp4',
    path: 'https://tmp.example.com/video-view.mp4',
    url: 'https://tmp.example.com/video-view.mp4',
    duration: 4,
    metadata: {
      assetId: 'asset-video-4',
      resourceViewId: 'resource-view-video-4',
      primaryType: 'video',
    },
    createdAt: 0,
    updatedAt: 0,
  }) as AnyMediaResource;

const createImportedMagicCutAsset = (overrides?: {
  assetId?: string;
  assetUuid?: string;
  projectId?: string;
  title?: string;
  resourceId?: string;
  resourceUuid?: string;
  resourceUrl?: string;
}) => {
  const assetId = overrides?.assetId || 'asset-import-1';
  const assetUuid = overrides?.assetUuid || 'asset-import-uuid-1';
  const resourceId = overrides?.resourceId || `${assetId}-resource-1`;
  const resourceUuid = overrides?.resourceUuid || `${assetId}-resource-uuid-1`;
  const resourceUrl =
    overrides?.resourceUrl || `assets://workspaces/workspace-test/projects/${overrides?.projectId || 'project-import-1'}/media/originals/video/${resourceId}.mp4`;
  const title = overrides?.title || 'imported.mp4';
  const projectId = overrides?.projectId || 'project-import-1';

  return {
    id: assetId,
    uuid: assetUuid,
    assetId,
    key: `workspace-test/magiccut/${assetId}`,
    title,
    primaryType: 'video',
    payload: {
      video: {
        id: resourceId,
        uuid: resourceUuid,
        assetId,
        primaryResourceId: resourceId,
        name: title,
        type: 'video',
        url: resourceUrl,
        path: resourceUrl,
        metadata: {
          assetUuid,
          primaryResourceId: resourceId,
          primaryResourceUuid: resourceUuid,
        },
      },
      assets: [
        {
          id: resourceId,
          uuid: resourceUuid,
          assetId,
          primaryResourceId: resourceId,
          name: title,
          type: 'video',
          url: resourceUrl,
          path: resourceUrl,
          metadata: {
            assetUuid,
            primaryResourceId: resourceId,
            primaryResourceUuid: resourceUuid,
          },
        },
      ],
    },
    scope: {
      workspaceId: 'workspace-test',
      projectId,
      domain: 'magiccut',
    },
    storage: {
      mode: 'desktop-fs',
      primary: {
        protocol: 'assets',
        uri: resourceUrl,
        path: resourceUrl,
        url: resourceUrl,
      },
      cacheable: true,
    },
    status: 'ready',
    versionInfo: {
      version: 1,
    },
    metadata: {
      assetUuid,
      primaryResourceId: resourceId,
      primaryResourceUuid: resourceUuid,
      workspaceId: 'workspace-test',
      projectId,
      scopeDomain: 'magiccut',
      primaryType: 'video',
    },
    createdAt: '2026-04-07T00:00:00.000Z',
    updatedAt: '2026-04-07T00:00:00.000Z',
  };
};

describe('MagicCutStoreProvider identity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('creates inserted tracks and clips with null persisted ids and uuid-first refs', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useMagicCutStore> | null = null;

    await act(async () => {
      root.render(
        <MagicCutStoreProvider initialProject={createDefaultMagicCutProject()}>
          <StoreProbe onStore={(store) => { latestStore = store; }} />
        </MagicCutStoreProvider>
      );
      await Promise.resolve();
    });

    const timelineUuid = latestStore?.project.timelines[0]?.uuid || null;
    expect(timelineUuid).toBeTruthy();

    await act(async () => {
      latestStore?.setActiveTimelineId(String(timelineUuid));
      await Promise.resolve();
    });

    let insertedTrackId: string | undefined;
    await act(async () => {
      insertedTrackId = latestStore?.insertTrackAndAddClip(
        createVisualResource('asset-video-1', 'resource-view-video-1'),
        1,
        2,
        4,
        'video'
      );
      await Promise.resolve();
    });

    const track = insertedTrackId ? latestStore?.state.tracks[insertedTrackId] : undefined;
    const clipRef = track?.clips[0];
    const clip = clipRef ? latestStore?.state.clips[clipRef.uuid] : undefined;
    const timeline = timelineUuid ? latestStore?.state.timelines[String(timelineUuid)] : undefined;
    const timelineTrackRef = timeline?.tracks.find((ref) => ref.uuid === insertedTrackId);

    expect(track?.id).toBeNull();
    expect(timelineTrackRef?.id).toBeNull();
    expect(clip?.id).toBeNull();
    expect(clip?.track.id).toBeNull();
    expect(clip?.track.uuid).toBe(track?.uuid);
    expect(clipRef?.id).toBeNull();
    expect(clipRef?.uuid).toBe(clip?.uuid);

    await act(async () => {
      root.unmount();
    });
  });

  it('creates effect and transition layers with null persisted ids and uuid-first clip refs', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useMagicCutStore> | null = null;

    await act(async () => {
      root.render(
        <MagicCutStoreProvider initialProject={createDefaultMagicCutProject()}>
          <StoreProbe onStore={(store) => { latestStore = store; }} />
        </MagicCutStoreProvider>
      );
      await Promise.resolve();
    });

    const timelineUuid = latestStore?.project.timelines[0]?.uuid || null;
    const mainTrackUuid =
      timelineUuid && latestStore
        ? latestStore.state.timelines[String(timelineUuid)]?.tracks[0]?.uuid
        : null;

    expect(mainTrackUuid).toBeTruthy();

    await act(async () => {
      latestStore?.setActiveTimelineId(String(timelineUuid));
      await Promise.resolve();
    });

    let firstClipId: string | undefined;
    let secondClipId: string | undefined;
    await act(async () => {
      firstClipId = latestStore?.addClip(
        String(mainTrackUuid),
        createVisualResource('asset-video-2', 'resource-view-video-2'),
        0,
        4
      );
      secondClipId = latestStore?.addClip(
        String(mainTrackUuid),
        createVisualResource('asset-video-3', 'resource-view-video-3'),
        4,
        4
      );
      await Promise.resolve();
    });

    expect(firstClipId).toBeTruthy();
    expect(secondClipId).toBeTruthy();

    await act(async () => {
      latestStore?.addEffectToClip(String(firstClipId), 'effect-1');
      latestStore?.addTransitionToClip(String(firstClipId), 'transition-1', 0.5);
      await Promise.resolve();
    });

    const clip = firstClipId ? latestStore?.state.clips[String(firstClipId)] : undefined;
    const effectLayerRef = clip?.layers.find((layer) => {
      const candidate = latestStore?.state.layers[layer.uuid];
      return candidate?.layerType === 'filter';
    });
    const transitionLayerRef = clip?.layers.find((layer) => {
      const candidate = latestStore?.state.layers[layer.uuid];
      return candidate?.layerType === 'transition_out';
    });
    const effectLayer = effectLayerRef ? latestStore?.state.layers[effectLayerRef.uuid] : undefined;
    const transitionLayer = transitionLayerRef ? latestStore?.state.layers[transitionLayerRef.uuid] : undefined;

    expect(effectLayerRef?.id).toBeNull();
    expect(effectLayer?.id).toBeNull();
    expect(effectLayer?.clip.id).toBeNull();
    expect(effectLayer?.clip.uuid).toBe(firstClipId);

    expect(transitionLayerRef?.id).toBeNull();
    expect(transitionLayer?.id).toBeNull();
    expect(transitionLayer?.clip.id).toBeNull();
    expect(transitionLayer?.clip.uuid).toBe(firstClipId);
    expect(transitionLayer?.params.nextClipId).toBe(secondClipId);

    await act(async () => {
      root.unmount();
    });
  });

  it('uses canonical assetId instead of resource-view id when detaching audio from persisted video assets', async () => {
    const assetCenterServiceMock = assetCenterService as unknown as {
      initialize: ReturnType<typeof vi.fn>;
      findById: ReturnType<typeof vi.fn>;
    };
    const resolveAssetPrimaryUrlBySdkMock =
      resolveAssetPrimaryUrlBySdk as unknown as ReturnType<typeof vi.fn>;
    const importAssetFromUrlBySdkMock =
      importAssetFromUrlBySdk as unknown as ReturnType<typeof vi.fn>;
    const calculateDetachAudioMock =
      magicCutBusinessService.timelineOperationService
        .calculateDetachAudio as unknown as ReturnType<typeof vi.fn>;

    resolveAssetPrimaryUrlBySdkMock.mockImplementation(async (assetId: string) => {
      if (assetId === 'asset-video-4') {
        return 'https://cdn.example.com/video-canonical.mp4';
      }
      if (assetId === 'audio-asset-1') {
        return 'https://cdn.example.com/detached-audio.mp3';
      }
      return null;
    });
    importAssetFromUrlBySdkMock.mockResolvedValue({
      id: 'audio-asset-1',
      uuid: 'audio-view-uuid-1',
      name: 'hero-shot_audio.mp4',
      type: 'audio',
      path: 'https://tmp.example.com/detached-audio.mp3',
      metadata: {},
      origin: 'upload',
      size: 256,
      createdAt: 0,
      updatedAt: 0,
    });
    assetCenterServiceMock.initialize.mockResolvedValue(undefined);
    assetCenterServiceMock.findById.mockImplementation(async (assetId: string) => {
      if (assetId !== 'audio-asset-1') {
        return null;
      }

      const primaryResource = {
        id: 'audio-resource-1',
        uuid: 'audio-resource-uuid-1',
        assetId: 'audio-asset-1',
        type: 'audio',
        path: 'https://cdn.example.com/detached-audio.mp3',
        url: 'https://cdn.example.com/detached-audio.mp3',
        metadata: {
          assetId: 'audio-asset-1',
          primaryType: 'audio',
          scopeDomain: 'magiccut',
          storageMode: 'remote-url',
        },
      };

      return {
        id: 'audio-asset-1',
        assetId: 'audio-asset-1',
        uuid: 'audio-asset-uuid-1',
        key: 'workspace-test/magiccut/audio-asset-1',
        title: 'hero-shot_audio.mp4',
        primaryType: 'audio',
        payload: {
          assets: [primaryResource],
          audio: primaryResource,
        },
        scope: {
          workspaceId: 'workspace-test',
          domain: 'magiccut',
        },
        storage: {
          mode: 'remote-url',
          primary: {
            protocol: 'https',
            uri: 'https://cdn.example.com/detached-audio.mp3',
            url: 'https://cdn.example.com/detached-audio.mp3',
          },
          cacheable: false,
        },
        status: 'ready',
        versionInfo: {
          version: 1,
        },
        metadata: {
          assetId: 'audio-asset-1',
          primaryType: 'audio',
          scopeDomain: 'magiccut',
          storageMode: 'remote-url',
        },
        createdAt: 0,
        updatedAt: 0,
      };
    });
    calculateDetachAudioMock.mockReturnValue(null);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useMagicCutStore> | null = null;

    await act(async () => {
      root.render(
        <MagicCutStoreProvider initialProject={createDefaultMagicCutProject()}>
          <StoreProbe onStore={(store) => { latestStore = store; }} />
        </MagicCutStoreProvider>
      );
      await Promise.resolve();
    });

    const timelineUuid = latestStore?.project.timelines[0]?.uuid || null;
    const mainTrackUuid =
      timelineUuid && latestStore
        ? latestStore.state.timelines[String(timelineUuid)]?.tracks[0]?.uuid
        : null;

    expect(mainTrackUuid).toBeTruthy();

    await act(async () => {
      latestStore?.setActiveTimelineId(String(timelineUuid));
      await Promise.resolve();
    });

    let clipId: string | undefined;
    await act(async () => {
      clipId = latestStore?.addClip(
        String(mainTrackUuid),
        createPersistedVideoResource(),
        0,
        4
      );
      await Promise.resolve();
    });

    expect(clipId).toBeTruthy();

    await act(async () => {
      await latestStore?.detachAudio(String(clipId));
      await Promise.resolve();
    });

    expect(resolveAssetPrimaryUrlBySdkMock).toHaveBeenCalledWith('asset-video-4');
    expect(resolveAssetPrimaryUrlBySdkMock).not.toHaveBeenCalledWith('resource-view-video-4');
    expect(importAssetFromUrlBySdkMock).toHaveBeenCalledWith(
      'https://cdn.example.com/video-canonical.mp4',
      'audio',
      {
        name: 'hero-shot_audio.mp4',
        domain: 'magiccut',
      }
    );

    await act(async () => {
      root.unmount();
    });
  });

  it('registers project-level references when desktop imports enter managed-local asset storage', async () => {
    const assetCenterServiceMock = assetCenterService as unknown as {
      initialize: ReturnType<typeof vi.fn>;
      importAsset: ReturnType<typeof vi.fn>;
    };
    const pickFilesMock =
      uploadHelper.pickFiles as unknown as ReturnType<typeof vi.fn>;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useMagicCutStore> | null = null;

    await act(async () => {
      root.render(
        <MagicCutStoreProvider initialProject={createDefaultMagicCutProject()}>
          <StoreProbe onStore={(store) => { latestStore = store; }} />
        </MagicCutStoreProvider>
      );
      await Promise.resolve();
    });

    const projectId = latestStore?.project.uuid || null;
    expect(projectId).toBeTruthy();

    assetCenterServiceMock.initialize.mockResolvedValue(undefined);
    assetCenterServiceMock.importAsset.mockResolvedValue({
      asset: createImportedMagicCutAsset({
        assetId: 'asset-managed-local-1',
        assetUuid: 'asset-managed-local-uuid-1',
        projectId: String(projectId),
        title: 'desktop-managed.mp4',
      }),
    });
    pickFilesMock.mockResolvedValue([
      {
        name: 'desktop-managed.mp4',
        path: 'C:\\imports\\desktop-managed.mp4',
        data: new Uint8Array([1, 2, 3, 4]),
      },
    ]);

    await act(async () => {
      await latestStore?.importAssets();
      await Promise.resolve();
    });

    expect(assetCenterServiceMock.importAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: expect.objectContaining({
          workspaceId: 'workspace-test',
          projectId: projectId,
          domain: 'magiccut',
        }),
        references: [
          {
            domain: 'magiccut',
            entityType: 'project',
            entityId: projectId,
            relation: 'reference',
            slot: 'media-resource',
          },
        ],
      })
    );

    await act(async () => {
      root.unmount();
    });
  });

  it('binds project-level references after server uploads complete', async () => {
    const assetCenterServiceMock = assetCenterService as unknown as {
      initialize: ReturnType<typeof vi.fn>;
      findById: ReturnType<typeof vi.fn>;
      bindReference: ReturnType<typeof vi.fn>;
    };
    const importAssetBySdkMock =
      importAssetBySdk as unknown as ReturnType<typeof vi.fn>;
    const resolveAssetPrimaryUrlBySdkMock =
      resolveAssetPrimaryUrlBySdk as unknown as ReturnType<typeof vi.fn>;
    const settingsBusinessServiceMock =
      settingsBusinessService as unknown as {
        getSettings: ReturnType<typeof vi.fn>;
      };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let latestStore: ReturnType<typeof useMagicCutStore> | null = null;

    await act(async () => {
      root.render(
        <MagicCutStoreProvider initialProject={createDefaultMagicCutProject()}>
          <StoreProbe onStore={(store) => { latestStore = store; }} />
        </MagicCutStoreProvider>
      );
      await Promise.resolve();
    });

    const projectId = latestStore?.project.uuid || null;
    expect(projectId).toBeTruthy();

    settingsBusinessServiceMock.getSettings.mockResolvedValueOnce({
      success: true,
      data: {
        materialStorage: {
          mode: 'server-only',
        },
      },
    });
    importAssetBySdkMock.mockResolvedValue({
      id: 'asset-server-upload-1',
      uuid: 'asset-server-upload-view-uuid-1',
      name: 'server-upload.mp4',
      type: 'video',
      path: 'https://tmp.example.com/server-upload.mp4',
      metadata: {},
      origin: 'upload',
      size: 2048,
      createdAt: 0,
      updatedAt: 0,
    });
    resolveAssetPrimaryUrlBySdkMock.mockResolvedValue('https://cdn.example.com/server-upload.mp4');
    assetCenterServiceMock.initialize.mockResolvedValue(undefined);
    assetCenterServiceMock.findById.mockResolvedValue(
      createImportedMagicCutAsset({
        assetId: 'asset-server-upload-1',
        assetUuid: 'asset-server-upload-uuid-1',
        projectId: String(projectId),
        title: 'server-upload.mp4',
        resourceUrl: 'https://cdn.example.com/server-upload.mp4',
      })
    );
    assetCenterServiceMock.bindReference.mockResolvedValue(
      createImportedMagicCutAsset({
        assetId: 'asset-server-upload-1',
        assetUuid: 'asset-server-upload-uuid-1',
        projectId: String(projectId),
        title: 'server-upload.mp4',
        resourceUrl: 'https://cdn.example.com/server-upload.mp4',
      })
    );

    await act(async () => {
      await latestStore?.importFileObjects([
        new File([new Uint8Array([9, 8, 7, 6])], 'server-upload.mp4', {
          type: 'video/mp4',
        }),
      ]);
      await Promise.resolve();
    });

    expect(assetCenterServiceMock.bindReference).toHaveBeenCalledWith(
      'asset-server-upload-1',
      {
        domain: 'magiccut',
        entityType: 'project',
        entityId: projectId,
        relation: 'reference',
        slot: 'media-resource',
      }
    );

    await act(async () => {
      root.unmount();
    });
  });
});
