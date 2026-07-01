import { describe, expect, it } from 'vitest';

import { createGenerationOutcome } from '@sdkwork/magic-studio-core/ai';

import { toGeneratedVoiceResult } from './generatedVoiceResult';

describe('toGeneratedVoiceResult', () => {
  it('maps a persisted generation outcome into a canonical generated voice result', () => {
    const outcome = createGenerationOutcome({
      product: 'speech',
      mode: 'text-to-speech',
      provider: 'google',
      providerModel: 'gemini-tts',
      prompt: 'Speak the script',
      artifact: {
        type: 'audio',
        url: 'data:audio/wav;base64,abc123',
        mimeType: 'audio/wav',
        name: 'generated-voice.wav',
        duration: 9,
      },
    });

    const result = toGeneratedVoiceResult({
      outcome,
      persisted: {
        assetId: 'asset-voice-1',
        assetUuid: 'asset-voice-uuid-1',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/generated-voice.wav',
        url: 'https://cdn.example.com/generated-voice.wav',
        sourceUrl: 'data:audio/wav;base64,abc123',
        deliveryUrl: 'data:audio/wav;base64,abc123',
        posterUrl: undefined,
        product: 'speech',
        mode: 'text-to-speech',
        provider: 'google',
        providerModel: 'persisted-voice-model',
        prompt: 'Persisted speech prompt',
        negativePrompt: '',
        parameters: {
          speakerId: 'speaker-persisted-kore',
        },
        recipeId: null,
        recipeUuid: 'recipe-uuid-persisted',
        executionId: 'execution-db-persisted',
        executionUuid: 'execution-uuid-persisted',
        artifactSetId: null,
        artifactSetUuid: 'artifact-set-uuid-persisted',
        artifactId: null,
        artifactUuid: 'artifact-uuid-persisted',
        primaryResourceId: 'resource-db-persisted',
        primaryResourceUuid: 'resource-uuid-persisted',
        resourceViewId: 'resource-view-persisted',
        resourceViewUuid: 'resource-view-uuid-persisted',
      },
      speakerId: 'Kore',
      avatarUrl: 'https://cdn.example.com/avatar.png',
    });

    expect(result).toMatchObject({
      id: null,
      uuid: 'artifact-uuid-persisted',
      assetId: 'asset-voice-1',
      assetUuid: 'asset-voice-uuid-1',
      primaryResourceId: 'resource-db-persisted',
      primaryResourceUuid: 'resource-uuid-persisted',
      resourceViewId: 'resource-view-persisted',
      resourceViewUuid: 'resource-view-uuid-persisted',
      recipeUuid: 'recipe-uuid-persisted',
      executionUuid: 'execution-uuid-persisted',
      artifactSetUuid: 'artifact-set-uuid-persisted',
      artifactUuid: 'artifact-uuid-persisted',
      resource: {
        assetId: 'asset-voice-1',
        primaryResourceId: 'resource-db-persisted',
        resourceViewId: 'resource-view-persisted',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/generated-voice.wav',
        url: 'https://cdn.example.com/generated-voice.wav',
        mimeType: 'audio/wav',
        duration: 9,
        name: 'generated-voice.wav',
        metadata: {
          assetUuid: 'asset-voice-uuid-1',
          primaryResourceUuid: 'resource-uuid-persisted',
          resourceViewUuid: 'resource-view-uuid-persisted',
        },
      },
      duration: 9,
      text: 'Persisted speech prompt',
      speakerId: 'Kore',
      avatarUrl: 'https://cdn.example.com/avatar.png',
      modelId: 'persisted-voice-model',
    });
    expect(result.url).toBeUndefined();
    expect(result.resource?.uuid).toBe('resource-uuid-persisted');
    expect(result.resource?.speakerId).toBe('Kore');
  });

  it('falls back to persisted canonical speakerId when explicit speakerId is absent', () => {
    const outcome = createGenerationOutcome({
      product: 'speech',
      mode: 'text-to-speech',
      provider: 'google',
      providerModel: 'gemini-tts',
      prompt: 'Fallback voice',
      artifact: {
        type: 'audio',
        url: 'data:audio/wav;base64,def456',
        mimeType: 'audio/wav',
        name: 'fallback-voice.wav',
        duration: 6,
      },
    });

    const result = toGeneratedVoiceResult({
      outcome,
      persisted: {
        assetId: 'asset-voice-2',
        assetUuid: 'asset-voice-uuid-2',
        path: 'assets://workspaces/ws-1/projects/proj-1/media/generated/fallback-voice.wav',
        url: 'https://cdn.example.com/fallback-voice.wav',
        sourceUrl: 'data:audio/wav;base64,def456',
        deliveryUrl: 'data:audio/wav;base64,def456',
        posterUrl: undefined,
        product: 'speech',
        mode: 'text-to-speech',
        provider: 'google',
        providerModel: 'persisted-fallback-model',
        prompt: 'Fallback speech prompt',
        negativePrompt: '',
        parameters: {
          speakerId: 'speaker-persisted-fallback',
        },
        recipeId: null,
        recipeUuid: 'recipe-uuid-fallback',
        executionId: 'execution-db-fallback',
        executionUuid: 'execution-uuid-fallback',
        artifactSetId: null,
        artifactSetUuid: 'artifact-set-uuid-fallback',
        artifactId: null,
        artifactUuid: 'artifact-uuid-fallback',
        primaryResourceId: 'resource-db-fallback',
        primaryResourceUuid: 'resource-uuid-fallback',
        resourceViewId: 'resource-view-fallback',
        resourceViewUuid: 'resource-view-uuid-fallback',
      },
      avatarUrl: 'https://cdn.example.com/avatar-fallback.png',
    });

    expect(result.speakerId).toBe('speaker-persisted-fallback');
    expect(result.resource?.speakerId).toBe('speaker-persisted-fallback');
  });
});
