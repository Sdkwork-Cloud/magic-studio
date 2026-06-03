import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  cloneSpeaker,
  getCloneTaskResult,
  listMarketVoices,
  getListSpeakers,
  updatePreviewSettings,
  generationGetVoiceList,
  generationListSpeakers,
  getVoices,
  getAppSdkClientWithSession,
  hasSdkworkClient,
  importAssetBySdk,
  queryAssetsBySdk,
  resolveAssetPrimaryUrlBySdk,
  resolveAssetUrlByAssetIdFirst,
} = vi.hoisted(() => ({
  cloneSpeaker: vi.fn(async () => ({
    data: {
      taskId: 'clone-task-1',
    },
  })),
  getCloneTaskResult: vi.fn(async () => ({
    data: {
      taskId: 'clone-task-1',
      status: 'SUCCESS',
      speakerId: 'speaker-kore',
      speakerName: 'Kore',
      previewAudioUrl: 'https://cdn.example.com/kore.wav',
      completedAt: '2026-04-05T11:00:00Z',
    },
  })),
  updatePreviewSettings: vi.fn(async () => ({
    data: {
      speakerId: 'speaker-kore',
      previewText: 'Hello from the clone preview',
      previewAudioUrl: 'https://cdn.example.com/kore.wav',
    },
  })),
  listMarketVoices: vi.fn(async () => ({
    data: {
      content: [],
    },
  })),
  getListSpeakers: vi.fn(async () => ({
    data: {
      content: [],
    },
  })),
  generationGetVoiceList: vi.fn(async () => ({
    data: {
      voices: [],
    },
  })),
  generationListSpeakers: vi.fn(async () => ({
    data: {
      content: [],
    },
  })),
  getVoices: vi.fn(async () => []),
  hasSdkworkClient: vi.fn(() => true),
  importAssetBySdk: vi.fn(),
  queryAssetsBySdk: vi.fn(async () => ({ content: [] })),
  resolveAssetPrimaryUrlBySdk: vi.fn(async () => null),
  resolveAssetUrlByAssetIdFirst: vi.fn(async () => null),
  getAppSdkClientWithSession: vi.fn(() => ({
    generation: {
      getVoiceList: generationGetVoiceList,
      listSpeakers: generationListSpeakers,
    },
    voiceSpeaker: {
      cloneSpeaker,
      getCloneTaskResult,
      updatePreviewSettings,
      listMarketVoices,
      getListSpeakers,
    },
  })),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk,
  queryAssetsBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst,
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  hasSdkworkClient,
  getAppSdkClientWithSession,
}));

vi.mock('./voiceService', () => ({
  voiceService: {
    getVoices,
  },
}));

import { voiceSpeakerService } from './voiceSpeakerService';

describe('voiceSpeakerService', () => {
  beforeEach(() => {
    cloneSpeaker.mockClear();
    getCloneTaskResult.mockClear();
    updatePreviewSettings.mockClear();
    listMarketVoices.mockReset();
    getListSpeakers.mockReset();
    generationGetVoiceList.mockReset();
    generationListSpeakers.mockReset();
    getVoices.mockReset();
    getAppSdkClientWithSession.mockReset();
    hasSdkworkClient.mockReset();
    importAssetBySdk.mockReset();
    queryAssetsBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    resolveAssetUrlByAssetIdFirst.mockReset();

    cloneSpeaker.mockResolvedValue({
      data: {
        taskId: 'clone-task-1',
      },
    } as any);
    getCloneTaskResult.mockResolvedValue({
      data: {
        taskId: 'clone-task-1',
        status: 'SUCCESS',
        speakerId: 'speaker-kore',
        speakerName: 'Kore',
        previewAudioUrl: 'https://cdn.example.com/kore.wav',
        completedAt: '2026-04-05T11:00:00Z',
      },
    } as any);
    updatePreviewSettings.mockResolvedValue({
      data: {
        speakerId: 'speaker-kore',
        previewText: 'Hello from the clone preview',
        previewAudioUrl: 'https://cdn.example.com/kore.wav',
      },
    } as any);
    listMarketVoices.mockResolvedValue({
      data: {
        content: [],
      },
    } as any);
    getListSpeakers.mockResolvedValue({
      data: {
        content: [],
      },
    } as any);
    generationGetVoiceList.mockResolvedValue({
      data: {
        voices: [],
      },
    } as any);
    generationListSpeakers.mockResolvedValue({
      data: {
        content: [],
      },
    } as any);
    getVoices.mockResolvedValue([] as any);
    hasSdkworkClient.mockReturnValue(true);
    queryAssetsBySdk.mockResolvedValue({ content: [] } as any);
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(null);
    resolveAssetUrlByAssetIdFirst.mockResolvedValue(null);
    getAppSdkClientWithSession.mockImplementation(() => ({
      generation: {
        getVoiceList: generationGetVoiceList,
        listSpeakers: generationListSpeakers,
      },
      voiceSpeaker: {
        cloneSpeaker,
        getCloneTaskResult,
        updatePreviewSettings,
        listMarketVoices,
        getListSpeakers,
      },
    }));
  });

  it('normalizes voices with a stable uuid fallback from id', () => {
    const normalized = voiceSpeakerService.normalizeVoice(
      {
        id: 'voice-1',
        name: 'Test Voice',
        gender: 'female',
        language: 'en-US',
      },
      'market'
    );

    expect(normalized).toMatchObject({
      id: 'voice-1',
      uuid: 'voice-1',
      source: 'market',
    });
  });

  it('submits clone tasks with speakerId as the canonical remote key', async () => {
    const taskId = await voiceSpeakerService.submitCloneTask({
      sampleAudioUrl: 'https://cdn.example.com/reference.wav',
      speakerId: 'speaker-kore',
      language: 'en-US',
      model: 'gemini-tts',
      idempotencyKey: 'clone-speaker-kore-001',
    });

    expect(taskId).toBe('clone-task-1');
    expect(getAppSdkClientWithSession).toHaveBeenCalledTimes(1);
    expect(cloneSpeaker).toHaveBeenCalledWith({
      sampleAudioUrl: 'https://cdn.example.com/reference.wav',
      speakerId: 'speaker-kore',
      language: 'en-US',
      model: 'gemini-tts',
      idempotencyKey: 'clone-speaker-kore-001',
    });
  });

  it('loads market voices through client.voiceSpeaker.listMarketVoices as the canonical SDK endpoint', async () => {
    listMarketVoices.mockResolvedValueOnce({
      data: {
        content: [
          {
            voiceId: 'speaker-kore',
            name: 'Kore',
            previewAudioUrl: 'https://cdn.example.com/kore.wav',
            gender: 'female',
            language: 'en-US',
            style: 'narration',
            provider: 'minimax',
            avatarUrl: 'https://cdn.example.com/kore.png',
            tags: ['warm', 'narration'],
          },
        ],
      },
    } as any);

    const voices = await voiceSpeakerService.getMarketVoices();

    expect(listMarketVoices).toHaveBeenCalledTimes(1);
    expect(getListSpeakers).not.toHaveBeenCalled();
    expect(generationGetVoiceList).not.toHaveBeenCalled();
    expect(generationListSpeakers).not.toHaveBeenCalled();
    expect(getVoices).not.toHaveBeenCalled();
    expect(voices).toHaveLength(1);
    expect(voices[0]).toMatchObject({
      id: 'speaker-kore',
      uuid: 'speaker-kore',
      name: 'Kore',
      previewUrl: 'https://cdn.example.com/kore.wav',
      language: 'en-US',
      style: 'narration',
      provider: 'minimax',
      avatarUrl: 'https://cdn.example.com/kore.png',
      source: 'market',
      tags: ['warm', 'narration'],
    });
  });

  it('loads clone task result through client.voiceSpeaker.getCloneTaskResult', async () => {
    const result = await voiceSpeakerService.getCloneTaskResult('clone-task-1');

    expect(getCloneTaskResult).toHaveBeenCalledWith('clone-task-1');
    expect(result).toMatchObject({
      taskId: 'clone-task-1',
      status: 'SUCCESS',
      speakerId: 'speaker-kore',
      speakerName: 'Kore',
      previewAudioUrl: 'https://cdn.example.com/kore.wav',
      completedAt: '2026-04-05T11:00:00Z',
    });
  });

  it('throws when client.voiceSpeaker.getCloneTaskResult returns a business failure code', async () => {
    getCloneTaskResult.mockResolvedValueOnce({
      code: '5000',
      msg: 'clone result failed',
    } as any);

    await expect(voiceSpeakerService.getCloneTaskResult('clone-task-1')).rejects.toThrow(
      'clone result failed'
    );
  });

  it('refreshes pending custom clone voices from clone task result', async () => {
    const voices = await voiceSpeakerService.refreshCustomVoices([
      {
        id: 'voice-clone-pending',
        name: 'Pending Clone',
        gender: 'female',
        language: 'en-US',
        previewUrl: 'https://cdn.example.com/pending.wav',
        previewText: 'Hello from the clone preview',
        source: 'custom',
        tags: ['clone', 'sdk-task:clone-task-1'],
      },
    ] as any);

    expect(getCloneTaskResult).toHaveBeenCalledWith('clone-task-1');
    expect(updatePreviewSettings).toHaveBeenCalledWith('speaker-kore', {
      previewText: 'Hello from the clone preview',
      previewAudioUrl: 'https://cdn.example.com/kore.wav',
    });
    expect(voices).toHaveLength(1);
    expect(voices[0]).toMatchObject({
      id: 'speaker-kore',
      uuid: 'speaker-kore',
      name: 'Kore',
      previewUrl: 'https://cdn.example.com/kore.wav',
      source: 'custom',
    });
    expect(voices[0].tags).toContain('sdk-clone:resolved');
    expect(voices[0].tags).not.toContain('sdk-task:clone-task-1');
  });

  it('keeps the local display name when clone result only echoes speakerId as speakerName', async () => {
    getCloneTaskResult.mockResolvedValueOnce({
      data: {
        taskId: 'clone-task-3',
        status: 'SUCCESS',
        speakerId: 'speaker-local-id',
        speakerName: 'speaker-local-id',
        previewAudioUrl: 'https://cdn.example.com/local-id.wav',
        completedAt: '2026-04-05T12:00:00Z',
      },
    } as any);

    const voices = await voiceSpeakerService.refreshCustomVoices([
      {
        id: 'voice-clone-local',
        name: 'Studio Narrator',
        gender: 'female',
        language: 'en-US',
        previewUrl: 'https://cdn.example.com/original.wav',
        previewText: 'Hello from local display name',
        source: 'custom',
        tags: ['clone', 'sdk-task:clone-task-3'],
      },
    ] as any);

    expect(voices).toHaveLength(1);
    expect(voices[0]).toMatchObject({
      id: 'speaker-local-id',
      uuid: 'speaker-local-id',
      name: 'Studio Narrator',
      previewUrl: 'https://cdn.example.com/kore.wav',
      source: 'custom',
    });
  });

  it('waits for clone task result until the task reaches a terminal success state', async () => {
    getCloneTaskResult
      .mockResolvedValueOnce({
        data: {
          taskId: 'clone-task-2',
          status: 'PENDING',
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          taskId: 'clone-task-2',
          status: 'PROCESSING',
          progress: 60,
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          taskId: 'clone-task-2',
          status: 'SUCCESS',
          speakerId: 'speaker-echo',
          speakerName: 'Echo',
          previewAudioUrl: 'https://cdn.example.com/echo.wav',
        },
      } as any);

    const result = await voiceSpeakerService.waitForCloneTaskResult('clone-task-2', {
      maxAttempts: 3,
      waitMs: 0,
    });

    expect(getCloneTaskResult).toHaveBeenNthCalledWith(1, 'clone-task-2');
    expect(getCloneTaskResult).toHaveBeenNthCalledWith(2, 'clone-task-2');
    expect(getCloneTaskResult).toHaveBeenNthCalledWith(3, 'clone-task-2');
    expect(result).toMatchObject({
      taskId: 'clone-task-2',
      status: 'SUCCESS',
      speakerId: 'speaker-echo',
      speakerName: 'Echo',
      previewAudioUrl: 'https://cdn.example.com/echo.wav',
    });
  });

  it('falls back to client.voiceSpeaker.getListSpeakers when market endpoint returns no entries', async () => {
    getListSpeakers.mockResolvedValueOnce({
      data: {
        content: [
          {
            speakerId: 'speaker-kore',
            name: 'Kore',
            description: 'Warm narrator voice',
            previewAudioUrl: 'https://cdn.example.com/kore.wav',
            gender: 'female',
            language: 'en-US',
            style: 'narration',
            createdAt: '2026-04-05T10:00:00Z',
          },
        ],
      },
    } as any);

    const voices = await voiceSpeakerService.getMarketVoices();

    expect(listMarketVoices).toHaveBeenCalledTimes(1);
    expect(getListSpeakers).toHaveBeenCalledTimes(1);
    expect(generationGetVoiceList).not.toHaveBeenCalled();
    expect(generationListSpeakers).not.toHaveBeenCalled();
    expect(getVoices).not.toHaveBeenCalled();
    expect(voices).toHaveLength(1);
    expect(voices[0]).toMatchObject({
      id: 'speaker-kore',
      uuid: 'speaker-kore',
      name: 'Kore',
      description: 'Warm narrator voice',
      previewUrl: 'https://cdn.example.com/kore.wav',
      language: 'en-US',
      style: 'narration',
      source: 'market',
    });
  });

  it('throws when client.voiceSpeaker.cloneSpeaker returns a business failure code', async () => {
    cloneSpeaker.mockResolvedValueOnce({
      code: '5000',
      msg: 'clone failed',
    } as any);

    await expect(
      voiceSpeakerService.submitCloneTask({
        sampleAudioUrl: 'https://cdn.example.com/reference.wav',
        speakerId: 'speaker-kore',
        language: 'en-US',
      })
    ).rejects.toThrow('clone failed');
  });

  it('throws when client.voiceSpeaker.updatePreviewSettings returns a business failure code', async () => {
    updatePreviewSettings.mockResolvedValueOnce({
      code: '5000',
      msg: 'preview update failed',
    } as any);

    await expect(
      voiceSpeakerService.updatePreviewSettings('speaker-kore', {
        previewText: 'preview text',
      })
    ).rejects.toThrow('preview update failed');
  });

  it('falls back to local preset voices when voiceSpeaker market endpoints return no market entries', async () => {
    getVoices.mockResolvedValueOnce([
      {
        id: 'preset-voice-1',
        name: 'Preset Voice',
        gender: 'female',
        language: 'en-US',
        previewUrl: 'https://cdn.example.com/preset.wav',
        provider: 'Preset Library',
      },
    ] as any);

    const voices = await voiceSpeakerService.getMarketVoices();

    expect(listMarketVoices).toHaveBeenCalledTimes(1);
    expect(getListSpeakers).toHaveBeenCalledTimes(1);
    expect(generationGetVoiceList).not.toHaveBeenCalled();
    expect(generationListSpeakers).not.toHaveBeenCalled();
    expect(getVoices).toHaveBeenCalledTimes(1);
    expect(voices).toHaveLength(1);
    expect(voices[0]).toMatchObject({
      id: 'preset-voice-1',
      name: 'Preset Voice',
      source: 'market',
    });
  });

  it('resolves locator-backed preview references before constructing audio playback', async () => {
    const playMock = vi.fn(async () => undefined);
    const audioInstance = {
      play: playMock,
      pause: vi.fn(),
      currentTime: 0,
      onended: null,
      onerror: null,
    } as unknown as HTMLAudioElement;
    const AudioMock = vi.fn(function MockAudio() {
      return audioInstance;
    });
    vi.stubGlobal('Audio', AudioMock as unknown as typeof Audio);
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce(
      'https://cdn.example.com/workspace-preview.wav' as any
    );

    try {
      const audio = await voiceSpeakerService.playPreviewAudio(
        'assets://workspaces/workspace-1/voices/workspace-preview.wav'
      );

      expect(resolveAssetUrlByAssetIdFirst).toHaveBeenCalledWith(
        'assets://workspaces/workspace-1/voices/workspace-preview.wav'
      );
      expect(AudioMock).toHaveBeenCalledWith('https://cdn.example.com/workspace-preview.wav');
      expect(playMock).toHaveBeenCalledTimes(1);
      expect(audio).toBe(audioInstance);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('preserves stable voice asset locators on upload while recording delivery urls in metadata', async () => {
    importAssetBySdk.mockResolvedValueOnce({
      id: 'voice-asset-1',
      uuid: 'voice-asset-uuid-1',
      name: 'workspace-reference.wav',
      type: 'voice',
      path: 'assets://workspaces/workspace-1/voices/workspace-reference.wav',
      size: 128,
      origin: 'upload',
      metadata: {
        originalName: 'workspace-reference.wav',
      },
      createdAt: 1,
      updatedAt: 1,
    } as any);
    resolveAssetPrimaryUrlBySdk.mockResolvedValueOnce(
      'https://cdn.example.com/workspace-reference.wav' as any
    );

    const asset = await voiceSpeakerService.importReferenceAudioFromUpload(
      {
        name: 'workspace-reference.wav',
        data: new Uint8Array([1, 2, 3]),
      },
      'blob:workspace-reference'
    );

    expect(importAssetBySdk).toHaveBeenCalledWith(
      {
        name: 'workspace-reference.wav',
        data: new Uint8Array([1, 2, 3]),
      },
      'voice',
      { domain: 'voice-speaker' }
    );
    expect(asset).toMatchObject({
      id: 'voice-asset-1',
      path: 'assets://workspaces/workspace-1/voices/workspace-reference.wav',
      metadata: {
        originalName: 'workspace-reference.wav',
        deliveryUrl: 'https://cdn.example.com/workspace-reference.wav',
      },
    });
  });

  it('falls back to deliveryUrl metadata when resolving voice asset urls after locator resolution misses', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValueOnce(null as any);

    const resolved = await voiceSpeakerService.resolveVoiceAssetUrl({
      id: 'voice-asset-2',
      path: 'assets://workspaces/workspace-1/voices/workspace-fallback.wav',
      metadata: {
        deliveryUrl: 'https://cdn.example.com/workspace-fallback.wav',
      },
    } as any);

    expect(resolved).toBe('https://cdn.example.com/workspace-fallback.wav');
  });

  it('does not import generated SDK types directly from @sdkwork/app-sdk', async () => {
    const source = await readFile(
      new URL('./voiceSpeakerService.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes("from '@sdkwork/app-sdk'")).toBe(false);
  });

  it('ships a voice-speaker contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('./voiceSpeaker.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
