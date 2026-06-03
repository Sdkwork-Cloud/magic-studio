import { describe, expect, it } from 'vitest';

import {
  createGenerationExecution,
  createGenerationOutcome,
  createGenerationOutcomeFromExecution,
  resolveGenerationExecutionOutcome,
  resolveGenerationOutcomePrimaryArtifact,
  resolveGenerationOutcomePrimaryUrl,
} from './generationOutcome';

describe('generation outcome helpers', () => {
  it('creates a canonical image outcome with uuid-linked execution graph', () => {
    const outcome = createGenerationOutcome({
      product: 'image',
      mode: 'text-to-image',
      provider: 'google',
      providerModel: 'gemini-2.5-flash-image',
      prompt: 'cinematic sunrise over mountains',
      parameters: {
        aspectRatio: '16:9',
      },
      artifact: {
        type: 'image',
        url: 'data:image/png;base64,abc123',
        mimeType: 'image/png',
        name: 'mountains.png',
      },
    });

    expect(outcome.execution.recipe.prompt).toBe('cinematic sunrise over mountains');
    expect(outcome.execution.recipe.parameters).toMatchObject({
      aspectRatio: '16:9',
    });
    expect(outcome.primaryArtifact.executionUuid).toBe(outcome.execution.uuid);
    expect(outcome.primaryArtifact.recipeUuid).toBe(outcome.recipe.uuid);
    expect(outcome.artifactSet.executionUuid).toBe(outcome.execution.uuid);
    expect(outcome.artifactSet.primaryArtifactUuid).toBe(outcome.primaryArtifact.uuid);
    expect(outcome.delivery.url).toBe('data:image/png;base64,abc123');
    expect(resolveGenerationOutcomePrimaryArtifact(outcome)?.uuid).toBe(outcome.primaryArtifact.uuid);
    expect(resolveGenerationOutcomePrimaryUrl(outcome)).toBe('data:image/png;base64,abc123');
  });

  it('preserves poster url and delivery metadata for video outputs', () => {
    const outcome = createGenerationOutcome({
      product: 'video',
      mode: 'text-to-video',
      provider: 'google',
      providerModel: 'veo-3.1-fast-generate-preview',
      prompt: 'city flythrough at night',
      artifact: {
        type: 'video',
        url: 'blob:video-output',
        posterUrl: 'blob:video-poster',
        mimeType: 'video/mp4',
        duration: 5,
      },
    });

    expect(outcome.delivery.posterUrl).toBe('blob:video-poster');
    expect(outcome.delivery.duration).toBe(5);
    expect(outcome.primaryArtifact.resource?.metadata).toMatchObject({
      posterUrl: 'blob:video-poster',
      duration: 5,
    });
  });

  it('creates queued execution snapshots without artifacts and resolves no outcome', () => {
    const execution = createGenerationExecution({
      product: 'video',
      mode: 'lip-sync',
      provider: 'mock-kling',
      providerModel: 'kling-lipsync-v1',
      prompt: 'dub the line with warm emotion',
      status: 'queued',
      progress: 5,
    });

    expect(execution.recipe.mode).toBe('lip-sync');
    expect(execution.status).toBe('queued');
    expect(execution.artifactSets).toHaveLength(0);
    expect(resolveGenerationExecutionOutcome(execution)).toBeNull();
  });

  it('materializes an outcome from an existing execution without changing its identity', () => {
    const execution = createGenerationExecution({
      product: 'video',
      mode: 'lip-sync',
      provider: 'mock-kling',
      providerModel: 'kling-lipsync-v1',
      prompt: 'dub the line with warm emotion',
      status: 'processing',
      progress: 42,
    });

    const outcome = createGenerationOutcomeFromExecution(execution, {
      status: 'succeeded',
      progress: 100,
      artifact: {
        type: 'video',
        url: 'https://example.com/lipsync.mp4',
        posterUrl: 'https://example.com/lipsync.jpg',
        mimeType: 'video/mp4',
        name: 'lipsync.mp4',
      },
    });

    expect(outcome.execution.uuid).toBe(execution.uuid);
    expect(outcome.execution.recipe.uuid).toBe(execution.recipe.uuid);
    expect(outcome.execution.status).toBe('succeeded');
    expect(resolveGenerationExecutionOutcome(outcome.execution)?.delivery.url).toBe('https://example.com/lipsync.mp4');
  });
});
