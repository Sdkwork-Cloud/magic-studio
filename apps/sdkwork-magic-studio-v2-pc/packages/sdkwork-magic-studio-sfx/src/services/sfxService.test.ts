import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

const mocks = vi.hoisted(() => {
  const serverClient = {
    createSfxGenerationTask: vi.fn(),
    readSfxGenerationTask: vi.fn(),
    listSfxGenerationCategories: vi.fn(),
  };

  return {
    assertRuntimeMagicStudioExecutionOperationReady: vi.fn(),
    createRuntimeMagicStudioServerClient: vi.fn(() => serverClient),
    readDefaultPlatformRuntime: vi.fn(() => 'server'),
    serverClient,
  };
});

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  assertRuntimeMagicStudioExecutionOperationReady:
    mocks.assertRuntimeMagicStudioExecutionOperationReady,
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient:
    mocks.createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime: mocks.readDefaultPlatformRuntime,
}));

type SfxServerClient = Pick<
  MagicStudioServerClient,
  | 'createSfxGenerationTask'
  | 'readSfxGenerationTask'
  | 'listSfxGenerationCategories'
>;

const serverClient = mocks.serverClient as unknown as SfxServerClient;

function createSfxArtifact(
  overrides: Partial<MagicStudioGenerationArtifact> = {},
): MagicStudioGenerationArtifact {
  return {
    id: 'sfx-artifact-1',
    uuid: 'sfx-artifact-uuid-1',
    type: 'audio',
    role: 'primary',
    assetId: 'sfx-asset-db-1',
    assetUuid: 'sfx-asset-uuid-1',
    primaryResourceId: 'sfx-primary-resource-db-1',
    primaryResourceUuid: 'sfx-primary-resource-uuid-1',
    resourceViewId: 'sfx-resource-view-db-1',
    resourceViewUuid: 'sfx-resource-view-uuid-1',
    url: 'https://example.com/generated-sfx.mp3',
    mimeType: 'audio/mpeg',
    name: 'generated-sfx.mp3',
    duration: 3,
    metadata: {
      canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/generated-sfx.mp3',
      duration: 3,
    },
    ...overrides,
  };
}

function createSfxTask(
  overrides: Partial<MagicStudioGenerationTask> = {},
): MagicStudioGenerationTask {
  const artifact = createSfxArtifact();
  return {
    id: 'sfx-task-db-1',
    uuid: 'sfx-task-uuid-1',
    taskId: 'sfx-task-1',
    product: 'sfx',
    mode: 'text-to-audio',
    status: 'succeeded',
    prompt: 'short cinematic whoosh',
    provider: 'magic-studio-server',
    providerModel: 'audioldm-2',
    remoteJobId: 'sfx-remote-job-1',
    progress: 100,
    inputRefs: [],
    artifacts: [artifact],
    primaryArtifact: artifact,
    parameters: {
      duration: 3,
      mediaType: 'sfx',
    },
    providerPayload: {
      duration: 3,
      mediaType: 'sfx',
    },
    createdAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-05T08:00:10Z',
    completedAt: '2026-04-05T08:00:10Z',
    cancelledAt: null,
    ...overrides,
  };
}

function envelope<T>(data: T) {
  return {
    requestId: 'request-sfx',
    timestamp: '2026-04-25T00:00:00.000Z',
    data,
    meta: {
      version: '2026-04-25',
    },
  };
}

import { sfxService } from './sfxService';

describe('sfxService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes sfx generation through the runtime server client', async () => {
    vi.mocked(serverClient.createSfxGenerationTask).mockResolvedValue(
      envelope(createSfxTask()),
    );

    const outcome = await sfxService.generateSfx({
      prompt: 'short cinematic whoosh',
      duration: 3,
      model: 'audioldm-2',
      mediaType: 'sfx',
    });

    expect(
      mocks.assertRuntimeMagicStudioExecutionOperationReady,
    ).toHaveBeenCalledWith('sfx-generation', 'create', {
      feature: 'SfxService',
    });
    expect(mocks.readDefaultPlatformRuntime).toHaveBeenCalledWith('SfxService');
    expect(mocks.createRuntimeMagicStudioServerClient).toHaveBeenCalledWith(
      'server',
    );
    expect(serverClient.createSfxGenerationTask).toHaveBeenCalledWith({
      prompt: 'short cinematic whoosh',
      model: 'audioldm-2',
      duration: 3,
      mediaType: 'sfx',
    });
    expect(outcome.recipe.product).toBe('sfx');
    expect(outcome.recipe.mode).toBe('text-to-audio');
    expect(outcome.recipe.prompt).toBe('short cinematic whoosh');
    expect(outcome.recipe.parameters).toMatchObject({
      duration: 3,
      mediaType: 'sfx',
      requestedModel: 'audioldm-2',
    });
    expect(outcome.execution.provider).toBe('magic-studio-server');
    expect(outcome.execution.providerModel).toBe('audioldm-2');
    expect(outcome.execution.remoteJobId).toBe('sfx-remote-job-1');
    expect(outcome.delivery.url).toBe('https://example.com/generated-sfx.mp3');
    expect(outcome.delivery.duration).toBe(3);
  });

  it('polls readSfxGenerationTask when create returns a non-terminal task', async () => {
    vi.mocked(serverClient.createSfxGenerationTask).mockResolvedValue(
      envelope(
        createSfxTask({
          taskId: 'sfx-task-2',
          uuid: 'sfx-task-uuid-2',
          status: 'processing',
          providerModel: 'eleven-labs-sfx',
          progress: 20,
          artifacts: [],
          primaryArtifact: null,
          remoteJobId: null,
          completedAt: null,
        }),
      ),
    );
    vi.mocked(serverClient.readSfxGenerationTask).mockResolvedValue(
      envelope(
        createSfxTask({
          taskId: 'sfx-task-2',
          uuid: 'sfx-task-uuid-2',
          providerModel: 'eleven-labs-sfx',
          remoteJobId: null,
          prompt: 'heavy thunder impact',
          primaryArtifact: createSfxArtifact({
            id: 'sfx-artifact-2',
            uuid: 'sfx-artifact-uuid-2',
            url: 'https://example.com/polled-sfx.mp3',
            name: 'polled-sfx.mp3',
            duration: 5,
            metadata: {
              duration: 5,
              sourcePath: 'file:///workspace/generated/polled-sfx.mp3',
            },
          }),
          artifacts: [
            createSfxArtifact({
              id: 'sfx-artifact-2',
              uuid: 'sfx-artifact-uuid-2',
              url: 'https://example.com/polled-sfx.mp3',
              name: 'polled-sfx.mp3',
              duration: 5,
              metadata: {
                duration: 5,
                sourcePath: 'file:///workspace/generated/polled-sfx.mp3',
              },
            }),
          ],
          parameters: {
            duration: 5,
            mediaType: 'sfx',
          },
        }),
      ),
    );

    const outcome = await sfxService.generateSfx({
      prompt: 'heavy thunder impact',
      duration: 5,
      model: 'eleven-labs-sfx',
      mediaType: 'sfx',
    });

    expect(serverClient.readSfxGenerationTask).toHaveBeenCalledWith('sfx-task-2');
    expect(outcome.delivery.url).toBe('https://example.com/polled-sfx.mp3');
    expect(outcome.execution.remoteJobId).toBe('sfx-task-2');
    expect(outcome.execution.providerModel).toBe('eleven-labs-sfx');
    expect(outcome.recipe.parameters).toMatchObject({
      duration: 5,
      mediaType: 'sfx',
    });
  });

  it('throws the task failure message when server generation fails', async () => {
    vi.mocked(serverClient.createSfxGenerationTask).mockResolvedValue(
      envelope(
        createSfxTask({
          status: 'failed',
          errorMessage: 'sfx create failed',
          artifacts: [],
          primaryArtifact: null,
        }),
      ),
    );

    await expect(
      sfxService.generateSfx({
        prompt: 'broken request',
        duration: 4,
        model: 'eleven-labs-sfx',
        mediaType: 'sfx',
      }),
    ).rejects.toThrow('sfx create failed');
  });

  it('throws the polling task failure message when server polling fails', async () => {
    vi.mocked(serverClient.createSfxGenerationTask).mockResolvedValue(
      envelope(
        createSfxTask({
          taskId: 'sfx-task-4',
          status: 'processing',
          progress: 25,
          artifacts: [],
          primaryArtifact: null,
          completedAt: null,
        }),
      ),
    );
    vi.mocked(serverClient.readSfxGenerationTask).mockResolvedValue(
      envelope(
        createSfxTask({
          taskId: 'sfx-task-4',
          status: 'failed',
          errorMessage: 'sfx poll failed',
          artifacts: [],
          primaryArtifact: null,
        }),
      ),
    );

    await expect(
      sfxService.generateSfx({
        prompt: 'broken polling',
        duration: 4,
        model: 'eleven-labs-sfx',
        mediaType: 'sfx',
      }),
    ).rejects.toThrow('sfx poll failed');
  });

  it('loads sound-effect categories through the runtime server client', async () => {
    vi.mocked(serverClient.listSfxGenerationCategories).mockResolvedValue({
      requestId: 'request-sfx-categories',
      timestamp: '2026-04-25T00:00:00.000Z',
      items: [
        {
          id: 'whoosh',
          label: 'Whoosh',
          description: 'Motion and transition effects',
        },
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 1,
        version: '2026-04-25',
      },
    });

    const result = await sfxService.getCategories();

    expect(serverClient.listSfxGenerationCategories).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: 'whoosh',
        name: 'Whoosh',
        description: 'Motion and transition effects',
      },
    ]);
  });

  it('does not import generated SDK types directly from retired generic app SDK', async () => {
    const source = await readFile(
      new URL('./sfxService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`from '@sdkwork/${'app'}-sdk'`)).toBe(false);
  });

  it('keeps the contract guards on the runtime server sfx boundary', async () => {
    const serviceContract = await readFile(
      new URL('./sfxService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );
    const generationContract = await readFile(
      new URL('./sfxGeneration.contract-typecheck.ts', import.meta.url),
      'utf8',
    );
    const combined = `${serviceContract}\n${generationContract}`;

    expect(combined.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(
      false,
    );
    expect(combined.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });

  it('ships sfx service contract typecheck guards for server contract drift', async () => {
    await expect(
      access(
        new URL('./sfxService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
    await expect(
      access(
        new URL('./sfxGeneration.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated sfx contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
