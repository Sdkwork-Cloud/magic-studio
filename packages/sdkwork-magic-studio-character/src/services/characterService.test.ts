import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import { createCharacterAvatarInputResourceRef } from '../entities';

const mocks = vi.hoisted(() => {
  const serverClient = {
    createCharacterGenerationTask: vi.fn(),
    readCharacterGenerationTask: vi.fn(),
    listGenerationTasks: vi.fn(),
    cancelGenerationTask: vi.fn(),
  };

  return {
    assertRuntimeMagicStudioExecutionOperationReady: vi.fn(),
    createRuntimeMagicStudioServerClient: vi.fn(() => serverClient),
    isMagicStudioServerRuntimeSupported: vi.fn(() => true),
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
  isMagicStudioServerRuntimeSupported: mocks.isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime: mocks.readDefaultPlatformRuntime,
}));

type CharacterServerClient = Pick<
  MagicStudioServerClient,
  | 'createCharacterGenerationTask'
  | 'readCharacterGenerationTask'
  | 'listGenerationTasks'
  | 'cancelGenerationTask'
>;

const serverClient = mocks.serverClient as unknown as CharacterServerClient;

function createCharacterArtifact(
  overrides: Partial<MagicStudioGenerationArtifact> = {},
): MagicStudioGenerationArtifact {
  return {
    id: 'artifact-1',
    uuid: 'artifact-uuid-1',
    type: 'image',
    role: 'primary',
    assetId: 'character-asset-db-1',
    assetUuid: 'character-asset-uuid-1',
    primaryResourceId: 'character-primary-resource-db-1',
    primaryResourceUuid: 'character-primary-resource-uuid-1',
    resourceViewId: 'character-resource-view-db-1',
    resourceViewUuid: 'character-resource-view-uuid-1',
    url: 'https://example.com/character-1.png',
    mimeType: 'image/png',
    name: 'character-1.png',
    metadata: {
      canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/character-1.png',
    },
    ...overrides,
  };
}

function createCharacterTask(
  overrides: Partial<MagicStudioGenerationTask> = {},
): MagicStudioGenerationTask {
  const artifact = createCharacterArtifact();
  return {
    id: 'task-db-1',
    uuid: 'task-uuid-1',
    taskId: 'character-task-1',
    product: 'character',
    mode: 'text-to-character',
    status: 'succeeded',
    prompt: 'A cyberpunk scout',
    provider: 'magic-studio',
    providerModel: 'gemini-2.5-flash-image',
    remoteJobId: 'remote-character-job-1',
    progress: 100,
    inputRefs: [],
    artifacts: [artifact],
    primaryArtifact: artifact,
    parameters: {
      description: 'A cyberpunk scout',
      archetype: 'cyberpunk',
      gender: 'female',
      age: 22,
      outfit: 'jacket',
      aspectRatio: '9:16',
      voiceId: 'Puck',
      avatarMode: 'full-body',
    },
    providerPayload: {},
    createdAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-05T08:00:10Z',
    completedAt: '2026-04-05T08:00:10Z',
    cancelledAt: null,
    ...overrides,
  };
}

function envelope<T>(data: T) {
  return {
    requestId: 'request-character',
    timestamp: '2026-04-25T00:00:00.000Z',
    data,
    meta: {
      version: '2026-04-25',
    },
  };
}

import { characterService } from './characterService';

describe('characterService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes character generation through the runtime server client', async () => {
    vi.mocked(serverClient.createCharacterGenerationTask).mockResolvedValue(
      envelope(createCharacterTask()),
    );

    const task = await characterService.generate({
      prompt: 'A cyberpunk scout',
      description: 'A cyberpunk scout',
      model: 'gemini-2.5-flash-image',
      archetype: 'cyberpunk',
      gender: 'female',
      age: 22,
      outfit: 'jacket',
      aspectRatio: '9:16',
      voiceId: 'Puck',
      avatarMode: 'full-body',
      avatar: createCharacterAvatarInputResourceRef({
        assetId: 'asset-1',
        assetUuid: 'asset-uuid-1',
        path: 'assets://workspace/character/reference.png',
      }),
      mediaType: 'character',
    });

    expect(
      mocks.assertRuntimeMagicStudioExecutionOperationReady,
    ).toHaveBeenCalledWith('character-generation', 'create', {
      feature: 'CharacterService',
    });
    expect(mocks.readDefaultPlatformRuntime).toHaveBeenCalledWith(
      'CharacterService',
    );
    expect(mocks.createRuntimeMagicStudioServerClient).toHaveBeenCalledWith(
      'server',
    );
    expect(serverClient.createCharacterGenerationTask).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'A cyberpunk scout',
        description: 'A cyberpunk scout',
        model: 'gemini-2.5-flash-image',
        archetype: 'cyberpunk',
        gender: 'female',
        age: 22,
        outfit: 'jacket',
        aspectRatio: '9:16',
        voiceId: 'Puck',
        avatarMode: 'full-body',
        avatar: expect.objectContaining({
          assetId: 'asset-1',
          assetUuid: 'asset-uuid-1',
          path: 'assets://workspace/character/reference.png',
          role: 'character-reference',
          type: 'image',
        }),
      }),
    );
    expect(task.id).toBe('character-task-1');
    expect(task.uuid).toBe('task-uuid-1');
    expect(task.status).toBe('completed');
    expect(task.config).toMatchObject({
      prompt: 'A cyberpunk scout',
      description: 'A cyberpunk scout',
      model: 'gemini-2.5-flash-image',
      archetype: 'cyberpunk',
      gender: 'female',
      age: 22,
      outfit: 'jacket',
      mediaType: 'character',
    });
    expect(task.results?.[0]).toMatchObject({
      avatarUrl: 'https://example.com/character-1.png',
      url: 'https://example.com/character-1.png',
      resource: {
        assetId: 'character-asset-db-1',
        primaryResourceId: 'character-primary-resource-db-1',
        resourceViewId: 'character-resource-view-db-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/character-1.png',
        type: 'IMAGE',
      },
    });
  });

  it('polls readCharacterGenerationTask when create returns a non-terminal task', async () => {
    vi.mocked(serverClient.createCharacterGenerationTask).mockResolvedValue(
      envelope(
        createCharacterTask({
          taskId: 'character-task-2',
          uuid: 'task-uuid-2',
          status: 'processing',
          progress: 20,
          artifacts: [],
          primaryArtifact: null,
          completedAt: null,
        }),
      ),
    );
    vi.mocked(serverClient.readCharacterGenerationTask).mockResolvedValue(
      envelope(
        createCharacterTask({
          taskId: 'character-task-2',
          uuid: 'task-uuid-2',
          prompt: 'A fantasy ranger',
          parameters: {
            description: 'A fantasy ranger',
            archetype: 'fantasy',
          },
          primaryArtifact: createCharacterArtifact({
            id: 'artifact-2',
            uuid: 'artifact-uuid-2',
            url: 'https://example.com/character-2.png',
            name: 'character-2.png',
            metadata: {
              sourcePath: 'file:///workspace/generated/character-2.png',
            },
          }),
          artifacts: [
            createCharacterArtifact({
              id: 'artifact-2',
              uuid: 'artifact-uuid-2',
              url: 'https://example.com/character-2.png',
              name: 'character-2.png',
              metadata: {
                sourcePath: 'file:///workspace/generated/character-2.png',
              },
            }),
          ],
        }),
      ),
    );

    const task = await characterService.generate({
      prompt: 'A fantasy ranger',
      description: 'A fantasy ranger',
      model: 'gemini-2.5-flash-image',
      archetype: 'fantasy',
      mediaType: 'character',
    });

    expect(serverClient.readCharacterGenerationTask).toHaveBeenCalledWith(
      'character-task-2',
    );
    expect(task.id).toBe('character-task-2');
    expect(task.results?.[0]).toMatchObject({
      avatarUrl: 'https://example.com/character-2.png',
      url: 'https://example.com/character-2.png',
      resource: {
        path: 'file:///workspace/generated/character-2.png',
      },
    });
  });

  it('loads history through the canonical generation task server endpoint', async () => {
    vi.mocked(serverClient.listGenerationTasks).mockResolvedValue({
      requestId: 'request-character-list',
      timestamp: '2026-04-25T00:00:00.000Z',
      items: [
        createCharacterTask({
          taskId: 'character-task-history-1',
          uuid: 'task-history-uuid-1',
          prompt: 'A noir detective',
          parameters: {
            description: 'A noir detective',
            archetype: 'hero',
          },
          primaryArtifact: createCharacterArtifact({
            id: 'artifact-history',
            uuid: 'artifact-history-uuid',
            url: 'https://example.com/history-character.png',
            metadata: {
              canonicalPath: 'desktop://history/character-history-resource-1',
            },
          }),
          artifacts: [
            createCharacterArtifact({
              id: 'artifact-history',
              uuid: 'artifact-history-uuid',
              url: 'https://example.com/history-character.png',
              metadata: {
                canonicalPath: 'desktop://history/character-history-resource-1',
              },
            }),
          ],
        }),
      ],
      meta: {
        page: 1,
        pageSize: 50,
        total: 1,
        version: '2026-04-25',
      },
    });

    const tasks = await characterService.listTasks();

    expect(serverClient.listGenerationTasks).toHaveBeenCalledWith({
      product: 'character',
      page: 1,
      pageSize: 50,
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 'character-task-history-1',
      uuid: 'task-history-uuid-1',
      status: 'completed',
      config: {
        prompt: 'A noir detective',
        mediaType: 'character',
      },
      results: [
        expect.objectContaining({
          avatarUrl: 'https://example.com/history-character.png',
          resource: expect.objectContaining({
            path: 'desktop://history/character-history-resource-1',
          }),
        }),
      ],
    });
  });

  it('routes task deletion through canonical generation task cancellation', async () => {
    vi.mocked(serverClient.cancelGenerationTask).mockResolvedValue(
      envelope(
        createCharacterTask({
          taskId: 'character-task-history-1',
          uuid: 'task-history-uuid-1',
          status: 'cancelled',
        }),
      ),
    );

    await characterService.deleteTask('character-task-history-1');

    expect(serverClient.cancelGenerationTask).toHaveBeenCalledWith(
      'character-task-history-1',
    );
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./characterService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('keeps the contract guard on the runtime server character boundary', async () => {
    const source = await readFile(
      new URL('./characterService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(
      false,
    );
    expect(source.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });

  it('ships a character service contract typecheck guard for server contract drift', async () => {
    await expect(
      access(
        new URL('./characterService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated character contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
