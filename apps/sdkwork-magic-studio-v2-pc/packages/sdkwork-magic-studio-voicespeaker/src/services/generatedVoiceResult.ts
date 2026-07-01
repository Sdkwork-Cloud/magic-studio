import type { PersistedGenerationOutcomeAsset } from '@sdkwork/magic-studio-assets/services';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import { createGeneratedVoiceResult, type GeneratedVoiceResult } from '../entities';

export interface ToGeneratedVoiceResultInput {
  outcome: GenerationOutcome;
  persisted: PersistedGenerationOutcomeAsset;
  speakerId?: string;
  avatarUrl?: string;
}

const resolveSpeakerId = (
  outcome: GenerationOutcome,
  persisted: PersistedGenerationOutcomeAsset,
  speakerId: string | undefined
): string => {
  if (speakerId && speakerId.trim().length > 0) {
    return speakerId;
  }

  const persistedSpeakerId = persisted.parameters?.speakerId;
  if (typeof persistedSpeakerId === 'string' && persistedSpeakerId.trim().length > 0) {
    return persistedSpeakerId;
  }

  const parameterSpeakerId = outcome.recipe.parameters?.speakerId;
  if (typeof parameterSpeakerId === 'string' && parameterSpeakerId.trim().length > 0) {
    return parameterSpeakerId;
  }

  const recipeVoiceId = outcome.recipe.parameters?.voiceId;
  if (typeof recipeVoiceId === 'string' && recipeVoiceId.trim().length > 0) {
    return recipeVoiceId;
  }

  return '';
};

export const toGeneratedVoiceResult = ({
  outcome,
  persisted,
  speakerId,
  avatarUrl,
}: ToGeneratedVoiceResultInput): GeneratedVoiceResult => createGeneratedVoiceResult({
  id: persisted.artifactId || null,
  uuid: persisted.artifactUuid,
  assetId: persisted.assetId,
  assetUuid: persisted.assetUuid,
  primaryResourceId: persisted.primaryResourceId,
  primaryResourceUuid: persisted.primaryResourceUuid,
  resourceViewId: persisted.resourceViewId,
  resourceViewUuid: persisted.resourceViewUuid,
  recipeUuid: persisted.recipeUuid,
  executionUuid: persisted.executionUuid,
  artifactSetUuid: persisted.artifactSetUuid,
  artifactUuid: persisted.artifactUuid,
  executionId: persisted.executionId,
    resource: {
      id: persisted.primaryResourceId || undefined,
      uuid:
        persisted.primaryResourceUuid ||
        persisted.resourceViewUuid ||
      persisted.assetUuid ||
      persisted.artifactUuid,
    assetId: persisted.assetId,
      primaryResourceId: persisted.primaryResourceId,
      resourceViewId: persisted.resourceViewId,
      type: MediaResourceType.VOICE,
      name:
        outcome.primaryArtifact.resource?.name ||
        'generated-voice.wav',
      url: persisted.url,
      path: persisted.path || persisted.url,
      mimeType: persisted.mimeType || outcome.delivery.mimeType,
      duration: persisted.duration || outcome.delivery.duration || 0,
      metadata: {
      assetUuid: persisted.assetUuid,
      primaryResourceUuid: persisted.primaryResourceUuid,
      resourceViewUuid: persisted.resourceViewUuid,
    },
  },
  duration: persisted.duration || outcome.delivery.duration || 0,
  text: persisted.prompt || outcome.recipe.prompt || '',
  speakerId: resolveSpeakerId(outcome, persisted, speakerId),
  avatarUrl,
  modelId: persisted.providerModel || outcome.execution.providerModel,
});
