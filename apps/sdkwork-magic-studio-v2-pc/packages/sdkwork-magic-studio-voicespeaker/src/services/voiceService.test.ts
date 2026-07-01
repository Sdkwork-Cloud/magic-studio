import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioVoiceSpeechTaskCreateRequest,
} from '@sdkwork/magic-studio-host-types';

const {
  assertRuntimeMagicStudioExecutionOperationReady,
  createGenerationOutcomeMock,
  createVoiceServerClient,
  resolveAssetUrlByAssetIdFirst,
  serverClient,
  waitForCanonicalTaskResult,
} = vi.hoisted(() => {
  const serverClient = {
    createVoiceSpeechTask: vi.fn(),
    readVoiceSpeechTask: vi.fn(),
  };

  return {
    assertRuntimeMagicStudioExecutionOperationReady: vi.fn(async () => undefined),
    createGenerationOutcomeMock: vi.fn((input: any) => ({
      recipe: {
        uuid: 'recipe-1',
        prompt: input.prompt,
        parameters: input.parameters,
        inputRefs: input.inputRefs || [],
      },
      execution: {
        id: 'execution-id-1',
        uuid: 'execution-1',
        provider: input.provider,
        providerModel: input.providerModel,
        remoteJobId: input.remoteJobId || null,
        providerPayload: input.providerPayload,
      },
      artifactSet: {
        uuid: 'artifact-set-1',
      },
      primaryArtifact: {
        id: 'artifact-id-1',
        uuid: 'artifact-1',
      },
      delivery: {
        url: input.artifact.url,
        duration: input.artifact.duration,
      },
    })),
    createVoiceServerClient: vi.fn(() => serverClient),
    resolveAssetUrlByAssetIdFirst: vi.fn(
      async (): Promise<string | null> => 'https://cdn.example.com/reference-voice.wav',
    ),
    serverClient,
    waitForCanonicalTaskResult: vi.fn(async ({ taskId, readTask }) => readTask(taskId)),
  };
});

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst,
}));

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  assertRuntimeMagicStudioExecutionOperationReady,
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  createGenerationOutcome: createGenerationOutcomeMock,
  waitForCanonicalTaskResult,
}));

vi.mock('./voiceServerClient', () => ({
  createVoiceServerClient,
}));

import { voiceService } from './voiceService';

const createVoiceArtifact = (
  overrides: Partial<MagicStudioGenerationArtifact> = {},
): MagicStudioGenerationArtifact => ({
  id: 'artifact-id-1',
  uuid: 'artifact-uuid-1',
  type: 'voice',
  role: 'primary',
  url: 'https://example.com/generated-voice.wav',
  mimeType: 'audio/wav',
  name: 'generated-voice.wav',
  duration: 4,
  metadata: {
    source: 'test',
  },
  ...overrides,
});

const createVoiceTask = (
  overrides: Partial<MagicStudioGenerationTask> = {},
): MagicStudioGenerationTask => {
  const primaryArtifact =
    overrides.primaryArtifact === undefined
      ? createVoiceArtifact()
      : overrides.primaryArtifact;

  return {
    id: 'task-id-1',
    uuid: 'task-uuid-1',
    taskId: 'task-1',
    product: 'speech',
    mode: 'text-to-speech',
    status: 'succeeded',
    prompt: 'Narrate this opening line with a warm tone',
    negativePrompt: '',
    provider: 'magic-studio-server',
    providerModel: 'gemini-tts',
    remoteJobId: 'task-1',
    progress: 100,
    inputRefs: [],
    artifacts: primaryArtifact ? [primaryArtifact] : [],
    primaryArtifact,
    parameters: {
      speakerId: 'Kore',
      voiceId: 'Kore',
    },
    providerPayload: {
      source: 'test-runtime',
    },
    createdAt: '2026-04-25T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:01.000Z',
    completedAt: '2026-04-25T00:00:01.000Z',
    ...overrides,
  };
};

const configureDefaultServerClient = (): void => {
  serverClient.createVoiceSpeechTask.mockImplementation(
    async (payload: MagicStudioVoiceSpeechTaskCreateRequest) => ({
      data: createVoiceTask({
        inputRefs: payload.referenceAudio ? [payload.referenceAudio] : [],
        parameters: {
          speakerId: payload.speakerId,
          voiceId: payload.voiceId,
          speed: payload.speed,
          pitch: payload.pitch,
          mode: payload.mode,
          inputMethod: payload.inputMethod,
        },
        prompt: payload.text,
        providerModel: payload.model || 'gemini-tts',
      }),
    }),
  );
  serverClient.readVoiceSpeechTask.mockResolvedValue({
    data: createVoiceTask({
      remoteJobId: 'task-2',
      taskId: 'task-2',
    }),
  });
};

describe('voiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertRuntimeMagicStudioExecutionOperationReady.mockResolvedValue(undefined);
    createVoiceServerClient.mockReturnValue(serverClient);
    resolveAssetUrlByAssetIdFirst.mockResolvedValue('https://cdn.example.com/reference-voice.wav');
    waitForCanonicalTaskResult.mockImplementation(async ({ taskId, readTask }) => readTask(taskId));
    configureDefaultServerClient();
  });

  it('returns canonical generation outcomes for speech synthesis', async () => {
    const referenceAudio = {
      id: 'voice-asset-1',
      uuid: 'voice-asset-uuid-1',
      assetId: 'voice-asset-1',
      assetUuid: 'voice-asset-uuid-1',
      primaryResourceId: 'voice-resource-1',
      primaryResourceUuid: 'voice-resource-uuid-1',
      resourceViewId: 'voice-view-1',
      resourceViewUuid: 'voice-view-uuid-1',
      type: 'audio',
      url: 'assets://voice/reference-1',
    };

    const outcomes = await voiceService.generateSpeech({
      text: 'Narrate this opening line with a warm tone',
      voiceId: 'Kore',
      model: 'gemini-tts',
      speed: 1,
      pitch: 1,
      mediaType: 'voice',
      mode: 'clone',
      inputMethod: 'upload',
      referenceAudio: referenceAudio as any,
    });

    expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'voice-asset-1',
      }),
    );
    expect(createVoiceServerClient).toHaveBeenCalledWith('VoiceService');
    expect(assertRuntimeMagicStudioExecutionOperationReady).toHaveBeenCalledWith(
      'voice-speech-tasks',
      'create-speech-task',
      { feature: 'VoiceService' },
    );
    expect(serverClient.createVoiceSpeechTask).toHaveBeenCalledWith(
      expect.objectContaining({
        speakerId: 'Kore',
        text: 'Narrate this opening line with a warm tone',
        referenceAudio: expect.objectContaining({
          assetId: 'voice-asset-1',
          url: 'https://cdn.example.com/reference-voice.wav',
        }),
      }),
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject({
      delivery: {
        url: 'https://example.com/generated-voice.wav',
      },
      recipe: {
        prompt: 'Narrate this opening line with a warm tone',
        inputRefs: [
          expect.objectContaining({
            assetId: 'voice-asset-1',
            assetUuid: 'voice-asset-uuid-1',
            primaryResourceId: 'voice-resource-1',
            primaryResourceUuid: 'voice-resource-uuid-1',
            resourceViewId: 'voice-view-1',
            resourceViewUuid: 'voice-view-uuid-1',
            type: 'audio',
            role: 'reference',
          }),
        ],
      },
      execution: {
        provider: 'magic-studio-server',
        providerModel: 'gemini-tts',
        remoteJobId: 'task-1',
      },
    });
  });

  it('rejects clone generation when the reference audio only has a canonical locator and no renderable url can be resolved', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce(null);

    await expect(
      voiceService.generateSpeech({
        text: 'Narrate this opening line with a warm tone',
        voiceId: 'Kore',
        model: 'gemini-tts',
        speed: 1,
        pitch: 1,
        mediaType: 'voice',
        mode: 'clone',
        inputMethod: 'upload',
        referenceAudio: {
          id: 'voice-asset-2',
          uuid: 'voice-asset-uuid-2',
          type: 'audio',
          path: 'assets://voice/reference-2',
          url: 'assets://voice/reference-2',
          name: 'reference-2.wav',
        } as any,
      }),
    ).rejects.toThrow('Voice generation requires a resolvable reference audio url');

    expect(serverClient.createVoiceSpeechTask).not.toHaveBeenCalled();
  });

  it('polls readVoiceSpeechTask when createVoiceSpeechTask returns async-only task data', async () => {
    serverClient.createVoiceSpeechTask.mockResolvedValueOnce({
      data: createVoiceTask({
        artifacts: [],
        primaryArtifact: null,
        progress: 20,
        remoteJobId: 'task-2',
        status: 'queued',
        taskId: 'task-2',
      }),
    });
    serverClient.readVoiceSpeechTask.mockResolvedValueOnce({
      data: createVoiceTask({
        primaryArtifact: createVoiceArtifact({
          url: 'https://example.com/generated-voice-polled.wav',
        }),
        remoteJobId: 'task-2',
        taskId: 'task-2',
      }),
    });

    const outcomes = await voiceService.generateSpeech({
      text: 'Narrate this in a calm style',
      voiceId: 'Kore',
      model: 'gemini-tts',
      speed: 1,
      pitch: 1,
      mediaType: 'voice',
      mode: 'design',
      inputMethod: 'upload',
    });

    expect(waitForCanonicalTaskResult).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-2',
      }),
    );
    expect(serverClient.readVoiceSpeechTask).toHaveBeenCalledWith('task-2');
    expect(outcomes[0]).toMatchObject({
      delivery: {
        url: 'https://example.com/generated-voice-polled.wav',
      },
      execution: {
        remoteJobId: 'task-2',
      },
    });
  });

  it('throws the business failure message when createVoiceSpeechTask fails', async () => {
    serverClient.createVoiceSpeechTask.mockRejectedValueOnce(new Error('voice create failed'));

    await expect(
      voiceService.generateSpeech({
        text: 'broken voice request',
        voiceId: 'Kore',
        model: 'gemini-tts',
        speed: 1,
        pitch: 1,
        mediaType: 'voice',
        mode: 'design',
        inputMethod: 'upload',
      }),
    ).rejects.toThrow('voice create failed');
  });

  it('throws the business failure message when readVoiceSpeechTask fails during polling', async () => {
    serverClient.createVoiceSpeechTask.mockResolvedValueOnce({
      data: createVoiceTask({
        artifacts: [],
        primaryArtifact: null,
        progress: 20,
        remoteJobId: 'task-3',
        status: 'queued',
        taskId: 'task-3',
      }),
    });
    serverClient.readVoiceSpeechTask.mockRejectedValueOnce(new Error('voice poll failed'));

    await expect(
      voiceService.generateSpeech({
        text: 'broken voice polling',
        voiceId: 'Kore',
        model: 'gemini-tts',
        speed: 1,
        pitch: 1,
        mediaType: 'voice',
        mode: 'design',
        inputMethod: 'upload',
      }),
    ).rejects.toThrow('voice poll failed');
  });

  it('creates voice tasks with a stable uuid-first identity', () => {
    const task = voiceService.createVoiceTask({
      type: 'VOICE_TASK',
      speakerId: 'Kore',
      text: 'Narrate this opening line with a warm tone',
    });

    expect(task.id).toBeNull();
    expect(task.uuid).toBeTruthy();
    expect(task.status).toBe('pending');
  });

  it('does not import generated SDK types directly from retired generic app SDK', async () => {
    const source = await readFile(
      new URL('./voiceService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`from '@sdkwork/${'app'}-sdk'`)).toBe(false);
  });

  it('ships a voice generation contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./voiceSpeakerGeneration.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
