import { describe, expect, it } from 'vitest';
import { MediaResourceType } from '@sdkwork/react-commons';

import {
  buildVoiceGenerationConfig,
  resolveGeneratedVoiceUpdates,
} from '../src/domain/voice/voiceGeneration';

describe('buildVoiceGenerationConfig', () => {
  it('builds a normalized voice generation request from clip and resource state', () => {
    expect(
      buildVoiceGenerationConfig({
        script: '  Hello world  ',
        voiceId: 'Nova',
        pitch: 1.2,
        speed: 1.5,
        metadata: {
          description: 'Warm studio narrator',
        },
      })
    ).toEqual({
      text: 'Hello world',
      voiceId: 'Nova',
      model: 'gemini-tts',
      speed: 1.5,
      pitch: 1.2,
      description: 'Warm studio narrator',
      mediaType: 'voice',
    });
  });
});

describe('resolveGeneratedVoiceUpdates', () => {
  it('resets offset and retimes the clip to the generated source duration at the current playback speed', () => {
    const result = resolveGeneratedVoiceUpdates({
      resource: {
        id: 'voice-resource',
        uuid: 'voice-resource',
        type: MediaResourceType.VOICE,
        name: 'Voiceover.wav',
        url: 'old.wav',
        path: 'old.wav',
        metadata: {
          language: 'en-US',
        },
        createdAt: 0,
        updatedAt: 0,
      },
      clip: {
        id: 'clip-1',
        uuid: 'clip-1',
        type: 'CutClip',
        track: { id: 'track-1', uuid: 'track-1', type: 'CutTrack' },
        resource: { id: 'voice-resource', uuid: 'voice-resource', type: 'MediaResource' },
        start: 0,
        duration: 8,
        offset: 2,
        speed: 2,
        layers: [],
        createdAt: 0,
        updatedAt: 0,
      },
      script: 'Updated script',
      result: {
        id: 'gen-1',
        url: 'generated.wav',
        duration: 12,
        text: 'Updated script',
        speakerName: 'Nova',
      },
      voiceId: 'Nova',
      pitch: 1.1,
    });

    expect(result.clipUpdates).toMatchObject({
      content: 'Updated script',
      duration: 6,
      offset: 0,
    });
    expect(result.resourceUpdates).toMatchObject({
      url: 'generated.wav',
      path: 'generated.wav',
      duration: 12,
      metadata: expect.objectContaining({
        text: 'Updated script',
        voiceId: 'Nova',
        pitch: 1.1,
        speakerName: 'Nova',
      }),
    });
  });
});
