import { describe, expect, it } from 'vitest';

import { mapImportDataToVoiceTask } from './importVoiceTask';

describe('mapImportDataToVoiceTask', () => {
  it('maps imported audio generation data into a completed voice task', () => {
    const task = mapImportDataToVoiceTask({
      id: null,
      uuid: 'import-voice-uuid-1',
      type: 'audio',
      createdAt: 1712300000000,
      prompt: 'Hello from an imported voice result',
      model: 'external-voice-source',
      duration: 12,
      resource: {
        id: 'voice-resource-id-1',
        uuid: 'voice-resource-uuid-1',
        assetId: 'voice-asset-id-1',
        assetUuid: 'voice-asset-uuid-1',
        primaryResourceId: 'voice-primary-resource-id-1',
        primaryResourceUuid: 'voice-primary-resource-uuid-1',
        resourceViewId: 'voice-resource-view-id-1',
        resourceViewUuid: 'voice-resource-view-uuid-1',
        type: 'audio',
        url: 'https://example.com/imported-voice.wav',
        name: 'imported-voice.wav',
        mimeType: 'audio/wav',
        metadata: {
          sourcePath: 'assets://workspace/generated/imported-voice.wav',
        },
      },
    });

    expect(task).toMatchObject({
      id: null,
      uuid: 'import-voice-uuid-1',
      status: 'completed',
      text: 'Hello from an imported voice result',
      config: {
        text: 'Hello from an imported voice result',
        previewText: 'Hello from an imported voice result',
        model: 'gemini-tts',
        mediaType: 'voice',
      },
      result: {
        assetId: 'voice-asset-id-1',
        resource: {
          path: 'assets://workspace/generated/imported-voice.wav',
          url: 'https://example.com/imported-voice.wav',
        },
        duration: 12,
        text: 'Hello from an imported voice result',
      },
      results: [
        expect.objectContaining({
          assetId: 'voice-asset-id-1',
          duration: 12,
        }),
      ],
    });
  });
});
