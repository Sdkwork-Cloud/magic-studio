import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createRuntimeMagicStudioServerClientMock,
  readDefaultPlatformRuntimeMock,
  serverClientMock,
} = vi.hoisted(() => {
  const serverClient = {
    createMagicCutTemplate: vi.fn(),
    listMagicCutTemplates: vi.fn(),
    readMagicCutTemplate: vi.fn(),
    updateMagicCutTemplate: vi.fn(),
    deleteMagicCutTemplate: vi.fn(),
    instantiateMagicCutTemplate: vi.fn(),
  };

  return {
    createRuntimeMagicStudioServerClientMock: vi.fn(() => serverClient),
    readDefaultPlatformRuntimeMock: vi.fn(() => ({ system: { kind: () => 'server' } })),
    serverClientMock: serverClient,
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: createRuntimeMagicStudioServerClientMock,
  readDefaultPlatformRuntime: readDefaultPlatformRuntimeMock,
}));

import { MediaResourceType } from '@sdkwork/magic-studio-commons';
import { templateService } from '../src/services/templateService';

const createProject = () =>
  ({
    id: null,
    uuid: 'project-runtime-uuid',
    type: 'CUT_PROJECT',
    name: 'Demo Project',
    description: '',
    version: 1,
    timelines: [{ id: null, uuid: 'timeline-runtime-uuid', type: 'CutTimeline' }],
    mediaResources: [],
    settings: { resolution: '1920x1080', fps: 30, aspectRatio: '16:9' },
    createdAt: 0,
    updatedAt: 0,
  }) as any;

const createState = () =>
  ({
    assets: {},
    resourceViews: {},
    resources: {
      'resource-view-video-1': {
        id: 'resource-view-video-1',
        uuid: 'resource-view-video-uuid-1',
        assetId: 'asset-video-1',
        resourceViewId: 'resource-view-video-1',
        type: MediaResourceType.VIDEO,
        name: 'clip.mp4',
        url: 'https://cdn.example.com/clip.mp4',
        path: 'assets://workspaces/workspace-test/projects/project-runtime-uuid/media/originals/video/clip.mp4',
        duration: 4,
        metadata: {
          assetId: 'asset-video-1',
          assetUuid: 'asset-video-uuid-1',
          resourceViewId: 'resource-view-video-1',
          resourceViewUuid: 'resource-view-video-uuid-1',
          primaryType: 'video',
        },
        createdAt: 0,
        updatedAt: 0,
      },
    },
    timelines: {
      'timeline-runtime-uuid': {
        id: null,
        uuid: 'timeline-runtime-uuid',
        type: 'CutTimeline',
        name: 'Sequence 1',
        fps: 30,
        duration: 4,
        tracks: [{ id: null, uuid: 'track-runtime-uuid', type: 'CutTrack' }],
        createdAt: 0,
        updatedAt: 0,
      },
    },
    tracks: {
      'track-runtime-uuid': {
        id: null,
        uuid: 'track-runtime-uuid',
        type: 'CutTrack',
        trackType: 'video',
        name: 'Main Track',
        order: 0,
        isMain: true,
        clips: [{ id: null, uuid: 'clip-runtime-uuid', type: 'CutClip' }],
        height: 72,
        visible: true,
        locked: false,
        muted: false,
        createdAt: 0,
        updatedAt: 0,
      },
    },
    clips: {
      'clip-runtime-uuid': {
        id: null,
        uuid: 'clip-runtime-uuid',
        type: 'CutClip',
        track: { id: null, uuid: 'track-runtime-uuid', type: 'CutTrack' },
        resource: {
          id: 'resource-view-video-1',
          uuid: 'resource-view-video-uuid-1',
          type: 'MediaResource',
        },
        start: 0,
        duration: 4,
        offset: 0,
        speed: 1,
        volume: 1,
        layers: [],
        createdAt: 0,
        updatedAt: 0,
      },
    },
    layers: {},
  }) as any;

const createTemplatePayload = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'template-db-id',
    uuid: 'template-runtime-uuid',
    type: 'CUT_TEMPLATE',
    name: 'Demo Template',
    description: '',
    createdAt: 0,
    updatedAt: 0,
    projectData: createProject(),
    ...overrides,
  }) as any;

describe('templateService canonical server boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves templates through the MagicCut server client with normalized asset refs and project graph', async () => {
    serverClientMock.createMagicCutTemplate.mockResolvedValue({
      data: createTemplatePayload(),
    });

    const metadata = { name: 'Demo Template' };
    const result = await templateService.saveTemplate(
      metadata,
      createProject(),
      createState()
    );

    expect(readDefaultPlatformRuntimeMock).toHaveBeenCalledWith('MagicCutServerSupport');
    expect(createRuntimeMagicStudioServerClientMock).toHaveBeenCalledWith(
      readDefaultPlatformRuntimeMock.mock.results[0]?.value
    );
    expect(serverClientMock.createMagicCutTemplate).toHaveBeenCalledWith({
      metadata,
      project: expect.objectContaining({
        uuid: 'project-runtime-uuid',
        mediaResources: [
          expect.objectContaining({
            id: 'asset-video-1',
            uuid: 'resource-view-video-uuid-1',
            assetId: 'asset-video-1',
            resourceViewId: 'resource-view-video-1',
            primaryType: 'video',
          }),
        ],
        normalizedState: expect.objectContaining({
          projectGraph: expect.objectContaining({
            project: expect.objectContaining({
              uuid: 'project-runtime-uuid',
            }),
          }),
        }),
        projectGraph: expect.objectContaining({
          metadata: expect.objectContaining({
            sourceSurface: 'magiccut',
          }),
        }),
      }),
    });
    expect(result).toMatchObject({
      id: 'template-db-id',
      uuid: 'template-runtime-uuid',
      type: 'CUT_TEMPLATE',
      projectData: {
        id: null,
        uuid: 'project-runtime-uuid',
        type: 'CUT_PROJECT',
      },
    });
  });

  it('sorts listed templates by server updatedAt and filters invalid payloads', async () => {
    serverClientMock.listMagicCutTemplates.mockResolvedValue({
      items: [
        createTemplatePayload({ uuid: 'older-template', updatedAt: '2026-04-01T00:00:00.000Z' }),
        { id: 'invalid-template' },
        createTemplatePayload({ uuid: 'newer-template', updatedAt: '2026-04-02T00:00:00.000Z' }),
      ],
    });

    const result = await templateService.listTemplates({ keyword: 'demo' });

    expect(serverClientMock.listMagicCutTemplates).toHaveBeenCalledWith({ keyword: 'demo' });
    expect(result.map((item) => item.uuid)).toEqual(['newer-template', 'older-template']);
  });

  it('instantiates templates through the server and normalizes nullable persistence identity', async () => {
    serverClientMock.instantiateMagicCutTemplate.mockResolvedValue({
      data: {
        ...createProject(),
        id: undefined,
        uuid: 'instantiated-project-uuid',
        name: 'Instantiated Project',
      },
    });

    const result = await templateService.instantiateById('template-runtime-uuid', 'Instantiated Project');

    expect(serverClientMock.instantiateMagicCutTemplate).toHaveBeenCalledWith(
      'template-runtime-uuid',
      { name: 'Instantiated Project' }
    );
    expect(result).toMatchObject({
      id: null,
      uuid: 'instantiated-project-uuid',
      type: 'CUT_PROJECT',
      name: 'Instantiated Project',
    });
  });
});
