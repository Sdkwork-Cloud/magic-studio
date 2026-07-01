import type {
  AssetRelationType,
  AssetBusinessDomain,
  AssetDomainReference,
} from '@sdkwork/magic-studio-types/asset-center';

import {
  assetCenterService,
  isDesktopAssetLocator,
  isExplicitLocalAssetLocator,
  isManagedAssetLocator,
  readWorkspaceScope,
  stripExplicitLocalAssetLocatorProtocol,
} from '../asset-center';
import type { Asset, AssetType } from '../entities';

export interface ChooseAssetProjectReference {
  projectId?: string;
  relation?: AssetRelationType;
  slot: string;
  metadata?: Record<string, unknown>;
}

const normalizeMetadata = (
  uploaded: Asset,
  projectReference: ChooseAssetProjectReference
): Record<string, unknown> | undefined => {
  const merged = {
    ...(uploaded.metadata || {}),
    ...(projectReference.metadata || {}),
  };
  const entries = Object.entries(merged).filter(([, value]) => value !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
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

const resolveChooseAssetScope = (
  domain: AssetBusinessDomain,
  projectReference: ChooseAssetProjectReference
) => {
  const workspaceScope = readWorkspaceScope();
  return {
    workspaceId: workspaceScope.workspaceId,
    projectId: projectReference.projectId || workspaceScope.projectId || undefined,
    domain,
  };
};

const resolveProjectReference = (
  domain: AssetBusinessDomain,
  projectReference: ChooseAssetProjectReference
): AssetDomainReference | undefined => {
  const scope = resolveChooseAssetScope(domain, projectReference);
  if (!scope.projectId) {
    return undefined;
  }

  return {
    domain,
    entityType: 'project',
    entityId: scope.projectId,
    relation: projectReference.relation || 'reference',
    slot: projectReference.slot,
    ...(projectReference.metadata ? { metadata: projectReference.metadata } : {}),
  };
};

const resolveLocator = (
  uploaded: Asset,
  resolvedUrl: string
): { protocol: 'http' | 'https' | 'assets' | 'file' | 'desktop'; uri: string; url?: string; path?: string } | null => {
  const canonicalCandidate = String(uploaded.path || '').trim();
  const deliveryCandidate = String(resolvedUrl || '').trim();
  const remoteCandidate =
    (deliveryCandidate.startsWith('https://') || deliveryCandidate.startsWith('http://')
      ? deliveryCandidate
      : '') ||
    (canonicalCandidate.startsWith('https://') || canonicalCandidate.startsWith('http://')
      ? canonicalCandidate
      : '');

  if (isManagedAssetLocator(canonicalCandidate)) {
    return {
      protocol: 'assets',
      uri: canonicalCandidate,
      ...(remoteCandidate ? { url: remoteCandidate } : {}),
    };
  }

  if (isExplicitLocalAssetLocator(canonicalCandidate)) {
    return {
      protocol: isDesktopAssetLocator(canonicalCandidate) ? 'desktop' : 'file',
      uri: canonicalCandidate,
      path: stripExplicitLocalAssetLocatorProtocol(canonicalCandidate),
      ...(remoteCandidate ? { url: remoteCandidate } : {}),
    };
  }

  if (isManagedAssetLocator(deliveryCandidate)) {
    return {
      protocol: 'assets',
      uri: deliveryCandidate,
    };
  }

  if (isExplicitLocalAssetLocator(deliveryCandidate)) {
    return {
      protocol: isDesktopAssetLocator(deliveryCandidate) ? 'desktop' : 'file',
      uri: deliveryCandidate,
      path: stripExplicitLocalAssetLocatorProtocol(deliveryCandidate),
    };
  }

  if (remoteCandidate.startsWith('https://')) {
    return {
      protocol: 'https',
      uri: remoteCandidate,
      url: remoteCandidate,
    };
  }

  if (remoteCandidate.startsWith('http://')) {
    return {
      protocol: 'http',
      uri: remoteCandidate,
      url: remoteCandidate,
    };
  }

  const localCandidate = canonicalCandidate || deliveryCandidate;
  if (!localCandidate) {
    return null;
  }

  return {
    protocol: 'file',
    uri: localCandidate,
    path: localCandidate,
  };
};

const resolveAssetStatus = (uploaded: Asset): 'generated' | 'imported' | 'ready' => {
  if (uploaded.origin === 'ai') {
    return 'generated';
  }
  if (uploaded.origin === 'upload') {
    return 'imported';
  }
  return 'ready';
};

export const persistChooseAssetProjectReference = async (input: {
  uploaded: Asset;
  resolvedUrl: string;
  fallbackType: AssetType;
  domain: AssetBusinessDomain;
  projectReference?: ChooseAssetProjectReference;
}): Promise<void> => {
  const { uploaded, resolvedUrl, fallbackType, domain, projectReference } = input;
  if (!projectReference || !uploaded.id) {
    return;
  }

  const persistedReference = resolveProjectReference(domain, projectReference);
  if (!persistedReference) {
    return;
  }

  await assetCenterService.initialize();
  const existingAsset = await assetCenterService.findById(uploaded.id);
  if (existingAsset) {
    await assetCenterService.bindReference(uploaded.id, persistedReference);
    return;
  }

  const locator = resolveLocator(uploaded, resolvedUrl);
  if (!locator) {
    return;
  }

  const metadata = normalizeMetadata(uploaded, projectReference);
  const scope = resolveChooseAssetScope(domain, projectReference);
  await assetCenterService.registerExistingAsset({
    scope,
    type: uploaded.type || fallbackType,
    name: uploaded.name,
    assetId: uploaded.id,
    locator,
    ...(metadata ? { metadata } : {}),
    references: [persistedReference],
    status: resolveAssetStatus(uploaded),
    ...(typeof uploaded.size === 'number' ? { size: uploaded.size } : {}),
    ...(normalizeTimestamp(uploaded.createdAt)
      ? { createdAt: normalizeTimestamp(uploaded.createdAt) }
      : {}),
    ...(normalizeTimestamp(uploaded.updatedAt)
      ? { updatedAt: normalizeTimestamp(uploaded.updatedAt) }
      : {}),
  });
};
