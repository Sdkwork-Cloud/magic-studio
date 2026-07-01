import {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import {
  assetCenterService,
  readWorkspaceScope,
} from '@sdkwork/magic-studio-assets/asset-center';
import type {
  AssetDomainReference,
} from '@sdkwork/magic-studio-types/asset-center';
import type { CanvasMediaResource } from '@sdkwork/magic-studio-types/canvas';

import { toCanvasImportedAssetResource } from './canvasImportedAssetResource';

interface UploadLike {
  name: string;
  data: Uint8Array;
}

type CanvasReferenceImageImportedAsset = {
  id: string | null;
  path?: string;
  size?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
  metadata?: Record<string, unknown>;
};

export interface CanvasReferenceImageImportContext {
  boardId?: string;
  boardUuid?: string;
  elementId?: string;
  source?: string;
}

const normalizeContextMetadata = (
  context: CanvasReferenceImageImportContext
): Record<string, string> | undefined => {
  const entries = Object.entries({
    boardId: context.boardId,
    boardUuid: context.boardUuid,
    elementId: context.elementId,
    source: context.source,
  }).filter((entry): entry is [string, string] => {
    const value = entry[1];
    return typeof value === 'string' && value.trim().length > 0;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const normalizePersistedMetadata = (
  uploaded: CanvasReferenceImageImportedAsset,
  context: CanvasReferenceImageImportContext
): Record<string, unknown> | undefined => {
  const merged = {
    ...(uploaded.metadata || {}),
    ...(normalizeContextMetadata(context) || {}),
  };
  const entries = Object.entries(merged).filter(([, value]) => value !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const resolveCanvasReferenceScope = () => {
  const workspaceScope = readWorkspaceScope();
  return {
    workspaceId: workspaceScope.workspaceId,
    projectId: workspaceScope.projectId || undefined,
    domain: 'canvas' as const,
  };
};

const resolveCanvasProjectReference = (
  context: CanvasReferenceImageImportContext
): AssetDomainReference | undefined => {
  const scope = resolveCanvasReferenceScope();
  if (!scope.projectId) {
    return undefined;
  }

  const metadata = normalizeContextMetadata(context);
  return {
    domain: 'canvas',
    entityType: 'project',
    entityId: scope.projectId,
    relation: 'reference',
    slot: 'reference-image',
    ...(metadata ? { metadata } : {}),
  };
};

const resolveCanvasReferenceLocator = (
  uploaded: CanvasReferenceImageImportedAsset,
  resolvedUrl: string
): { protocol: 'http' | 'https' | 'assets'; uri: string; url?: string; path?: string } | null => {
  const candidate = resolvedUrl || uploaded.path || '';
  if (!candidate) {
    return null;
  }

  if (candidate.startsWith('https://')) {
    return {
      protocol: 'https',
      uri: candidate,
      url: candidate,
    };
  }

  if (candidate.startsWith('http://')) {
    return {
      protocol: 'http',
      uri: candidate,
      url: candidate,
    };
  }

  return {
    protocol: 'assets',
    uri: candidate,
    path: candidate,
  };
};

const normalizeTimestamp = (value: string | number | undefined): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
};

const persistCanvasReferenceImage = async (
  uploaded: CanvasReferenceImageImportedAsset,
  resolvedUrl: string,
  name: string,
  context: CanvasReferenceImageImportContext
): Promise<void> => {
  if (!uploaded.id) {
    return;
  }

  const projectReference = resolveCanvasProjectReference(context);
  if (!projectReference) {
    return;
  }

  await assetCenterService.initialize();
  const existingAsset = await assetCenterService.findById(uploaded.id);
  if (existingAsset) {
    await assetCenterService.bindReference(uploaded.id, projectReference);
    return;
  }

  const locator = resolveCanvasReferenceLocator(uploaded, resolvedUrl);
  if (!locator) {
    return;
  }

  const metadata = normalizePersistedMetadata(uploaded, context);
  const scope = resolveCanvasReferenceScope();
  await assetCenterService.registerExistingAsset({
    scope,
    type: 'image',
    name,
    assetId: uploaded.id,
    locator,
    ...(metadata ? { metadata } : {}),
    references: [projectReference],
    status: 'imported',
    ...(typeof uploaded.size === 'number' ? { size: uploaded.size } : {}),
    ...(normalizeTimestamp(uploaded.createdAt)
      ? { createdAt: normalizeTimestamp(uploaded.createdAt) }
      : {}),
    ...(normalizeTimestamp(uploaded.updatedAt)
      ? { updatedAt: normalizeTimestamp(uploaded.updatedAt) }
      : {}),
  });
};

export const importCanvasReferenceImageFile = async (
  file: UploadLike,
  context: CanvasReferenceImageImportContext = {}
): Promise<CanvasMediaResource> => {
  const uploaded = await importAssetBySdk(
    {
      name: file.name,
      data: file.data,
    },
    'image',
    { domain: 'canvas' }
  );

  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    '';
  await persistCanvasReferenceImage(uploaded, resolvedUrl, file.name, context);
  return toCanvasImportedAssetResource({
    uploaded,
    fallbackType: 'image',
    resolvedUrl,
    name: file.name,
  });
};
