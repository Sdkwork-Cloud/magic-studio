import { describe, expect, it } from 'vitest';

import * as voiceTypes from './voice.types';

describe('voice AGI-native editor models', () => {
  it('creates canonical voice input refs with uuid-first identity and delivery fallback', () => {
    const createVoiceInputResourceRef = (voiceTypes as Record<string, unknown>)
      .createVoiceInputResourceRef as ((input: Record<string, unknown>) => Record<string, unknown>) | undefined;
    const resolveVoiceInputResourceKey = (voiceTypes as Record<string, unknown>)
      .resolveVoiceInputResourceKey as ((input: Record<string, unknown>) => string | null) | undefined;
    const resolveVoiceInputResourcePath = (voiceTypes as Record<string, unknown>)
      .resolveVoiceInputResourcePath as ((input: Record<string, unknown>) => string | null) | undefined;
    const resolveVoiceInputResourceUrl = (voiceTypes as Record<string, unknown>)
      .resolveVoiceInputResourceUrl as ((input: Record<string, unknown>) => string | null) | undefined;

    expect(createVoiceInputResourceRef).toBeTypeOf('function');
    expect(resolveVoiceInputResourceKey).toBeTypeOf('function');
    expect(resolveVoiceInputResourcePath).toBeTypeOf('function');
    expect(resolveVoiceInputResourceUrl).toBeTypeOf('function');

    const ref = createVoiceInputResourceRef?.({
      type: 'audio',
      assetId: 'voice-asset-1',
      assetUuid: 'voice-asset-uuid-1',
      primaryResourceId: 'voice-resource-1',
      primaryResourceUuid: 'voice-resource-uuid-1',
      resourceViewId: 'voice-view-1',
      resourceViewUuid: 'voice-view-uuid-1',
      resource: {
        id: 'voice-resource-entity-1',
        uuid: 'voice-resource-entity-uuid-1',
        type: 'VOICE',
        name: 'Reference voice',
        url: 'https://example.com/reference-voice.wav',
        duration: 12,
      },
    });

    expect(ref).toMatchObject({
      id: 'voice-view-1',
      uuid: 'voice-view-uuid-1',
      assetId: 'voice-asset-1',
      assetUuid: 'voice-asset-uuid-1',
      primaryResourceId: 'voice-resource-1',
      primaryResourceUuid: 'voice-resource-uuid-1',
      resourceViewId: 'voice-view-1',
      resourceViewUuid: 'voice-view-uuid-1',
      type: 'audio',
    });
    expect(resolveVoiceInputResourceKey?.(ref || {})).toBe('voice-view-uuid-1');
    expect(resolveVoiceInputResourcePath?.(ref || {})).toBe('https://example.com/reference-voice.wav');
    expect(resolveVoiceInputResourceUrl?.(ref || {})).toBe('https://example.com/reference-voice.wav');
  });

  it('preserves canonical locator paths separately from delivery urls for voice input refs', () => {
    const createVoiceInputResourceRef = (voiceTypes as Record<string, unknown>)
      .createVoiceInputResourceRef as ((input: Record<string, unknown>) => Record<string, unknown>) | undefined;
    const resolveVoiceInputResourcePath = (voiceTypes as Record<string, unknown>)
      .resolveVoiceInputResourcePath as ((input: Record<string, unknown>) => string | null) | undefined;
    const resolveVoiceInputResourceUrl = (voiceTypes as Record<string, unknown>)
      .resolveVoiceInputResourceUrl as ((input: Record<string, unknown>) => string | null) | undefined;

    const ref = createVoiceInputResourceRef?.({
      type: 'audio',
      assetId: 'voice-asset-2',
      resourceViewUuid: 'voice-view-uuid-2',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/reference-voice-2.wav',
      url: 'https://cdn.example.com/reference-voice-2.wav',
      metadata: {
        deliveryUrl: 'https://cdn.example.com/reference-voice-2.wav',
      },
    });

    expect(ref).toMatchObject({
      assetId: 'voice-asset-2',
      path: 'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/reference-voice-2.wav',
      url: 'https://cdn.example.com/reference-voice-2.wav',
    });
    expect(resolveVoiceInputResourcePath?.(ref || {})).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/audio/reference-voice-2.wav'
    );
    expect(resolveVoiceInputResourceUrl?.(ref || {})).toBe(
      'https://cdn.example.com/reference-voice-2.wav'
    );
  });

  it('creates generated voice results with full asset and resource identity', () => {
    const result = voiceTypes.createGeneratedVoiceResult({
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-1',
      resourceViewUuid: 'view-uuid-1',
      url: 'https://example.com/legacy-generated-voice.wav',
      resource: {
        uuid: 'resource-entity-uuid-1',
        url: 'https://example.com/generated-voice.wav',
        name: 'generated-voice.wav',
      },
      duration: 8,
      text: 'Speak the line',
      speakerId: 'Kore',
    } as any);

    expect(result).toMatchObject({
      id: null,
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      primaryResourceId: 'resource-1',
      primaryResourceUuid: 'resource-uuid-1',
      resourceViewId: 'view-1',
      resourceViewUuid: 'view-uuid-1',
      resource: {
        assetId: 'asset-1',
        primaryResourceId: 'resource-1',
        resourceViewId: 'view-1',
        url: 'https://example.com/generated-voice.wav',
        name: 'generated-voice.wav',
        metadata: {
          assetUuid: 'asset-uuid-1',
          primaryResourceUuid: 'resource-uuid-1',
          resourceViewUuid: 'view-uuid-1',
        },
      },
      duration: 8,
      text: 'Speak the line',
      speakerId: 'Kore',
    });
    expect((result as { url?: string }).url).toBeUndefined();
    expect(
      (voiceTypes as Record<string, unknown>).resolveGeneratedVoiceResultUrl
    ).toBeTypeOf('function');
    expect(
      ((voiceTypes as Record<string, unknown>).resolveGeneratedVoiceResultUrl as ((input: unknown) => string | null))?.(result)
    ).toBe('https://example.com/generated-voice.wav');
    expect(result.uuid).toBeTruthy();
    expect(result.resource?.uuid).toBe('resource-entity-uuid-1');
  });

  it('does not fabricate assetUuid from assetId when generated voice only has persisted asset id', () => {
    const result = voiceTypes.createGeneratedVoiceResult({
      assetId: 'asset-db-2',
      primaryResourceId: 'resource-db-2',
      primaryResourceUuid: 'resource-uuid-2',
      url: 'https://example.com/generated-voice-2.wav',
      resource: {
        uuid: 'resource-entity-uuid-2',
        url: 'https://example.com/generated-voice-2.wav',
        name: 'generated-voice-2.wav',
      },
      duration: 5,
      text: 'Speak the second line',
      speakerId: 'Nova',
    } as any);

    expect(result).toMatchObject({
      id: null,
      assetId: 'asset-db-2',
      assetUuid: null,
      primaryResourceId: 'resource-db-2',
      primaryResourceUuid: 'resource-uuid-2',
      resourceViewId: null,
      resourceViewUuid: null,
      resource: {
        assetId: 'asset-db-2',
        primaryResourceId: 'resource-db-2',
        metadata: {
          primaryResourceUuid: 'resource-uuid-2',
        },
      },
    });
    expect(result.resource?.metadata?.resourceViewUuid).toBeUndefined();
  });

  it('hydrates the canonical voice resource url from top-level fallback without flattening it back', () => {
    const result = voiceTypes.createGeneratedVoiceResult({
      url: 'https://example.com/canonical-top-level-voice.wav',
      duration: 7,
      text: 'Top level voice',
      speakerId: 'Nova',
      resource: {
        uuid: 'voice-resource-uuid-top-level',
        name: 'voice-top-level.wav',
      },
    } as any);

    expect((result as { url?: string }).url).toBeUndefined();
    expect(result.resource?.url).toBe('https://example.com/canonical-top-level-voice.wav');
    expect(
      ((voiceTypes as Record<string, unknown>).resolveGeneratedVoiceResultUrl as ((input: unknown) => string | null))?.(result)
    ).toBe('https://example.com/canonical-top-level-voice.wav');
  });

  it('falls back to legacy top-level voice urls when canonical resources are absent', () => {
    expect(
      ((voiceTypes as Record<string, unknown>).resolveGeneratedVoiceResultUrl as ((input: unknown) => string | null))?.({
        url: 'https://example.com/legacy-voice.wav',
      })
    ).toBe('https://example.com/legacy-voice.wav');
  });

  it('preserves canonical locators on path without fabricating a renderable voice url', () => {
    const result = voiceTypes.createGeneratedVoiceResult({
      duration: 7,
      text: 'Locator voice',
      speakerId: 'Nova',
      resource: {
        uuid: 'voice-resource-locator-1',
        name: 'locator-voice.wav',
        path: 'assets://workspace/voice/locator-voice.wav',
      },
    } as any);

    expect(result.resource?.path).toBe('assets://workspace/voice/locator-voice.wav');
    expect(result.resource?.url).toBeUndefined();
    expect(
      ((voiceTypes as Record<string, unknown>).resolveGeneratedVoiceResultPath as ((input: unknown) => string | null))?.(result)
    ).toBe('assets://workspace/voice/locator-voice.wav');
    expect(
      ((voiceTypes as Record<string, unknown>).resolveGeneratedVoiceResultUrl as ((input: unknown) => string | null))?.(result)
    ).toBeNull();
  });

  it('creates voice tasks with nullable persistence ids and stable uuids', () => {
    const task = voiceTypes.createVoiceTask({
      speakerId: 'Kore',
      text: 'Narrate this script',
    });

    expect(task).toMatchObject({
      id: null,
      speakerId: 'Kore',
      text: 'Narrate this script',
      status: 'pending',
    });
    expect(task.uuid).toBeTruthy();
  });

  it('hydrates canonical speaker identity onto the generated resource payload', () => {
    const result = voiceTypes.createGeneratedVoiceResult({
      url: 'https://example.com/generated-voice-identity.wav',
      duration: 4,
      text: 'Identity voice',
      speakerId: 'speaker-nova',
      resource: {
        uuid: 'voice-resource-identity',
        name: 'identity.wav',
      },
    } as any);

    expect(result.speakerId).toBe('speaker-nova');
    expect(result.resource?.speakerId).toBe('speaker-nova');
    expect((result as unknown as Record<string, unknown>).speakerName).toBeUndefined();
  });
});
