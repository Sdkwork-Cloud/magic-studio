import type {
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';
import {
  createCharacterAvatarInputResourceRef,
  createCharacter,
  hasCharacterAvatarInputResourceReference,
  type Character,
  type CharacterConfig,
  type CharacterTask,
} from '../entities';
import {
  isRenderableInputResourceUrl,
  isStableInputResourceLocator,
} from '@sdkwork/magic-studio-types/input-resource';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import {
  type CharacterResourceRecordLike,
  type CharacterTaskRecordLike,
  deriveAspectRatio,
  normalizeArchetype,
  normalizeGender,
  readMetadataString,
  safeIdString,
  safeNumber,
  safeString,
  safeTimestamp,
} from './characterService.shared';

const mapResultRecord = (
  resource: CharacterResourceRecordLike | null | undefined,
  fallbackUrl: string,
  index: number
): Character | null => {
  const url = safeString(resource?.url) || fallbackUrl;
  if (!url) {
    return null;
  }

  const key =
    safeIdString(resource?.uuid) ||
    safeIdString(resource?.id) ||
    `character-result-${index + 1}`;
  const metadata =
    typeof resource?.metadata === 'object' && resource.metadata !== null
      ? resource.metadata
      : undefined;

  return createCharacter({
    id: key,
    uuid: key,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    name: safeString(resource?.name) || `character-${index + 1}.png`,
    description: '',
    avatarUrl: url,
    url,
    resource: {
      id: key,
      uuid: key,
      assetId: readMetadataString(metadata, 'assetId') || null,
      assetUuid: readMetadataString(metadata, 'assetUuid') || null,
      primaryResourceId: readMetadataString(metadata, 'primaryResourceId') || null,
      primaryResourceUuid: readMetadataString(metadata, 'primaryResourceUuid') || null,
      resourceViewId: readMetadataString(metadata, 'resourceViewId') || null,
      resourceViewUuid: readMetadataString(metadata, 'resourceViewUuid') || null,
      url,
      mimeType: safeString(resource?.mimeType) || undefined,
      name: safeString(resource?.name) || `character-${index + 1}.png`,
      type: (resource?.type as any) || MediaResourceType.IMAGE,
      metadata,
    },
  });
};

const mapTaskResults = (
  task: CharacterTaskRecordLike
): CharacterTask['results'] => {
  const output = task.outputResult;
  if (!output) {
    return undefined;
  }

  const fallbackUrl = safeString(output.primaryUrl);
  const resources = Array.isArray(output.resources) ? output.resources : [];
  const mapped = resources
    .map((resource, index) => mapResultRecord(resource, fallbackUrl, index))
    .filter((item): item is Character => item !== null);

  if (mapped.length > 0) {
    return mapped;
  }

  if (!fallbackUrl) {
    return undefined;
  }

  return [
    createCharacter({
      id: 'character-result-1',
      uuid: 'character-result-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: 'character-1.png',
      description: '',
      avatarUrl: fallbackUrl,
      url: fallbackUrl,
      resource: {
        id: 'character-result-1',
        uuid: 'character-result-1',
        url: fallbackUrl,
        name: 'character-1.png',
        type: MediaResourceType.IMAGE,
      },
    }),
  ];
};

const normalizeCanonicalCharacterArtifacts = (
  task: MagicStudioGenerationTask
): MagicStudioGenerationArtifact[] => {
  const artifacts: MagicStudioGenerationArtifact[] = [];
  const seen = new Set<string>();
  const candidates = [
    task.primaryArtifact || null,
    ...(Array.isArray(task.artifacts) ? task.artifacts : []),
  ];

  for (const artifact of candidates) {
    if (!artifact) {
      continue;
    }

    const artifactType = safeString(artifact.type);
    const artifactRole = safeString(artifact.role);
    const artifactUrl = safeString(artifact.url);
    if (artifactType && artifactType !== 'image') {
      continue;
    }
    if (artifactRole === 'reference' || artifactRole === 'source' || artifactRole === 'mask') {
      continue;
    }
    if (!artifactUrl) {
      continue;
    }

    const key =
      safeIdString(artifact.uuid) ||
      safeIdString(artifact.id) ||
      artifactUrl;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    artifacts.push(artifact);
  }

  return artifacts;
};

const mapCanonicalResultRecord = (
  artifact: MagicStudioGenerationArtifact,
  index: number
): Character | null => {
  const url = safeString(artifact.url);
  if (!url) {
    return null;
  }

  const key =
    safeIdString(artifact.uuid) ||
    safeIdString(artifact.id) ||
    `character-result-${index + 1}`;
  const metadata =
    typeof artifact.metadata === 'object' && artifact.metadata !== null
      ? {
          ...artifact.metadata,
          assetId: safeString(artifact.assetId) || undefined,
          assetUuid: safeString(artifact.assetUuid) || undefined,
          primaryResourceId: safeString(artifact.primaryResourceId) || undefined,
          primaryResourceUuid: safeString(artifact.primaryResourceUuid) || undefined,
          resourceViewId: safeString(artifact.resourceViewId) || undefined,
          resourceViewUuid: safeString(artifact.resourceViewUuid) || undefined,
        }
      : {
          assetId: safeString(artifact.assetId) || undefined,
          assetUuid: safeString(artifact.assetUuid) || undefined,
          primaryResourceId: safeString(artifact.primaryResourceId) || undefined,
          primaryResourceUuid: safeString(artifact.primaryResourceUuid) || undefined,
          resourceViewId: safeString(artifact.resourceViewId) || undefined,
          resourceViewUuid: safeString(artifact.resourceViewUuid) || undefined,
        };

  return createCharacter({
    id: key,
    uuid: key,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    name: safeString(artifact.name) || `character-${index + 1}.png`,
    description: '',
    avatarUrl: url,
    url,
    resource: {
      id: key,
      uuid: key,
      assetId: safeString(artifact.assetId) || null,
      assetUuid: safeString(artifact.assetUuid) || null,
      primaryResourceId: safeString(artifact.primaryResourceId) || null,
      primaryResourceUuid: safeString(artifact.primaryResourceUuid) || null,
      resourceViewId: safeString(artifact.resourceViewId) || null,
      resourceViewUuid: safeString(artifact.resourceViewUuid) || null,
      path:
        readMetadataString(metadata, 'path') ||
        readMetadataString(metadata, 'canonicalPath') ||
        readMetadataString(metadata, 'sourcePath') ||
        undefined,
      url,
      mimeType: safeString(artifact.mimeType) || undefined,
      name: safeString(artifact.name) || `character-${index + 1}.png`,
      type: MediaResourceType.IMAGE,
      metadata,
    },
  });
};

const mapCanonicalTaskResults = (
  task: MagicStudioGenerationTask
): CharacterTask['results'] => {
  const artifacts = normalizeCanonicalCharacterArtifacts(task);
  const mapped = artifacts
    .map((artifact, index) => mapCanonicalResultRecord(artifact, index))
    .filter((item): item is Character => item !== null);

  return mapped.length > 0 ? mapped : undefined;
};

export const mapCharacterTaskStatus = (
  status?: CharacterTaskRecordLike['status']
): CharacterTask['status'] => {
  switch (String(status || '').toUpperCase()) {
    case 'SUCCESS':
      return 'completed';
    case 'FAILED':
    case 'CANCELLED':
      return 'failed';
    case 'PENDING':
    case 'PROCESSING':
    default:
      return 'pending';
  }
};

export const isCharacterTaskTerminalStatus = (
  task?: Pick<CharacterTaskRecordLike, 'status'> | null
): boolean => {
  const normalized = String(task?.status || '').toUpperCase();
  return normalized === 'SUCCESS' || normalized === 'FAILED' || normalized === 'CANCELLED';
};

export const mapCharacterTaskConfig = (
  task: CharacterTaskRecordLike,
  fallbackConfig?: CharacterConfig
): CharacterConfig => {
  if (fallbackConfig) {
    return fallbackConfig;
  }

  const inputParams =
    task.inputParams && typeof task.inputParams === 'object'
      ? task.inputParams
      : {};
  const extraParams =
    typeof inputParams.extraParams === 'object' && inputParams.extraParams !== null
      ? (inputParams.extraParams as Record<string, Record<string, unknown>>)
      : {};
  const characterStudio = extraParams.characterStudio || {};
  const referenceAsset =
    Array.isArray(inputParams.referenceAssets) && inputParams.referenceAssets.length > 0
      ? (inputParams.referenceAssets[0] as Record<string, unknown>)
      : null;
  const referenceMetadata =
    referenceAsset &&
    typeof referenceAsset.metadata === 'object' &&
    referenceAsset.metadata !== null
      ? (referenceAsset.metadata as Record<string, unknown>)
      : {};

  const prompt = safeString(inputParams.prompt) || safeString(inputParams.description);
  const description = safeString(inputParams.description) || prompt;
  const aspectRatio =
    safeString(characterStudio.aspectRatio) ||
    deriveAspectRatio(safeNumber(inputParams.width), safeNumber(inputParams.height));
  const characterStudioAvatarImage = safeString(characterStudio.avatarImage);
  const avatar = createCharacterAvatarInputResourceRef({
    assetId: safeString(referenceMetadata.assetId) || undefined,
    assetUuid: safeString(referenceMetadata.assetUuid) || undefined,
    primaryResourceId: safeString(referenceMetadata.primaryResourceId) || undefined,
    primaryResourceUuid: safeString(referenceMetadata.primaryResourceUuid) || undefined,
    resourceViewId: safeString(referenceMetadata.resourceViewId) || undefined,
    resourceViewUuid: safeString(referenceMetadata.resourceViewUuid) || undefined,
    path:
      safeString(referenceMetadata.path) ||
      safeString(referenceMetadata.canonicalPath) ||
      safeString(referenceMetadata.sourcePath) ||
      (isStableInputResourceLocator(characterStudioAvatarImage)
        ? characterStudioAvatarImage
        : undefined),
    url:
      safeString(referenceAsset?.url) ||
      (isRenderableInputResourceUrl(characterStudioAvatarImage)
        ? characterStudioAvatarImage
        : undefined),
    metadata:
      Object.keys(referenceMetadata).length > 0 ? { ...referenceMetadata } : undefined,
  });

  return {
    prompt,
    description,
    model: safeString(task.model) || safeString(inputParams.model) || undefined,
    archetype:
      normalizeArchetype(
        safeString(characterStudio.archetype) || safeString(inputParams.style)
      ) || undefined,
    gender: normalizeGender(safeString(inputParams.gender)) || undefined,
    mediaType: 'character',
    age: safeNumber(inputParams.age),
    outfit: safeString(inputParams.clothing) || undefined,
    aspectRatio,
    voiceId: safeString(characterStudio.voiceId) || undefined,
    avatarMode: safeString(characterStudio.avatarMode) || undefined,
    avatar: hasCharacterAvatarInputResourceReference(avatar) ? avatar : undefined,
  };
};

export const mapCharacterTaskRecord = (
  task: CharacterTaskRecordLike,
  fallbackConfig?: CharacterConfig
): CharacterTask => {
  const taskId = safeIdString(task.taskId) || `character-task-${Date.now()}`;

  return {
    id: taskId,
    uuid: taskId,
    createdAt: safeTimestamp(task.createdAt) ?? Date.now(),
    updatedAt:
      safeTimestamp(task.updatedAt) ??
      safeTimestamp(task.completedAt) ??
      Date.now(),
    status: mapCharacterTaskStatus(task.status),
    config: mapCharacterTaskConfig(task, fallbackConfig),
    results: mapTaskResults(task),
    error: safeString(task.errorMessage) || undefined,
  };
};

const mapCanonicalCharacterTaskStatus = (
  status?: MagicStudioGenerationTask['status']
): CharacterTask['status'] => {
  switch (String(status || '').toLowerCase()) {
    case 'succeeded':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'draft':
    case 'queued':
    case 'processing':
    default:
      return 'pending';
  }
};

const normalizeCanonicalProviderModel = (
  value: unknown
): string | undefined => {
  const normalized = safeString(value);
  return normalized && normalized !== 'unconfigured' ? normalized : undefined;
};

const mapCharacterTaskConfigFromCanonicalTask = (
  task: MagicStudioGenerationTask,
  fallbackConfig?: CharacterConfig
): CharacterConfig => {
  if (fallbackConfig) {
    return fallbackConfig;
  }

  const parameters =
    task.parameters && typeof task.parameters === 'object'
      ? task.parameters
      : {};
  const avatarInput =
    Array.isArray(task.inputRefs)
      ? task.inputRefs.find((input) => {
          const role = safeString(input.role);
          return role === 'character-reference' || role === 'reference';
        })
      : undefined;
  const avatarMetadata =
    avatarInput?.metadata && typeof avatarInput.metadata === 'object'
      ? { ...avatarInput.metadata }
      : undefined;
  const avatar = avatarInput
    ? createCharacterAvatarInputResourceRef({
        id: avatarInput.id,
        uuid: avatarInput.uuid,
        createdAt: avatarInput.createdAt,
        updatedAt: avatarInput.updatedAt,
        deletedAt: avatarInput.deletedAt,
        assetId: avatarInput.assetId ?? undefined,
        assetUuid: avatarInput.assetUuid ?? undefined,
        primaryResourceId: avatarInput.primaryResourceId ?? undefined,
        primaryResourceUuid: avatarInput.primaryResourceUuid ?? undefined,
        resourceViewId: avatarInput.resourceViewId ?? undefined,
        resourceViewUuid: avatarInput.resourceViewUuid ?? undefined,
        path:
          safeString(avatarInput.path) ||
          readMetadataString(avatarMetadata, 'canonicalPath') ||
          readMetadataString(avatarMetadata, 'sourcePath') ||
          undefined,
        url:
          safeString(avatarInput.url) ||
          (isRenderableInputResourceUrl(readMetadataString(avatarMetadata, 'url'))
            ? readMetadataString(avatarMetadata, 'url')
            : undefined),
        name: safeString(avatarInput.name) || undefined,
        mimeType: safeString(avatarInput.mimeType) || undefined,
        metadata: avatarMetadata,
      })
    : undefined;

  return {
    prompt: safeString(task.prompt) || safeString(parameters.description),
    description: safeString(parameters.description) || safeString(task.prompt),
    model:
      normalizeCanonicalProviderModel(task.providerModel) ||
      safeString(parameters.model) ||
      undefined,
    archetype: normalizeArchetype(safeString(parameters.archetype)) || undefined,
    gender: normalizeGender(safeString(parameters.gender)) || undefined,
    mediaType: 'character',
    age: safeNumber(parameters.age),
    outfit: safeString(parameters.outfit) || undefined,
    aspectRatio: safeString(parameters.aspectRatio) || undefined,
    voiceId: safeString(parameters.voiceId) || undefined,
    avatarMode: safeString(parameters.avatarMode) || undefined,
    hairstyle: safeString(parameters.hairstyle) || undefined,
    hairColor: safeString(parameters.hairColor) || undefined,
    eyeColor: safeString(parameters.eyeColor) || undefined,
    skinTone: safeString(parameters.skinTone) || undefined,
    accessories: safeString(parameters.accessories) || undefined,
    avatar: avatar && hasCharacterAvatarInputResourceReference(avatar) ? avatar : undefined,
  };
};

export const isCharacterGenerationTaskTerminalStatus = (
  task?: Pick<MagicStudioGenerationTask, 'status'> | null
): boolean => {
  const normalized = String(task?.status || '').toLowerCase();
  return normalized === 'succeeded' || normalized === 'failed' || normalized === 'cancelled';
};

export const mapCharacterGenerationTask = (
  task: MagicStudioGenerationTask,
  fallbackConfig?: CharacterConfig
): CharacterTask => {
  const taskId = safeIdString(task.taskId) || `character-task-${Date.now()}`;

  return {
    id: taskId,
    uuid: safeIdString(task.uuid) || taskId,
    createdAt: safeTimestamp(task.createdAt) ?? Date.now(),
    updatedAt:
      safeTimestamp(task.updatedAt) ??
      safeTimestamp(task.completedAt) ??
      Date.now(),
    status: mapCanonicalCharacterTaskStatus(task.status),
    config: mapCharacterTaskConfigFromCanonicalTask(task, fallbackConfig),
    results: mapCanonicalTaskResults(task),
    error: safeString(task.errorMessage) || undefined,
  };
};
