import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';
import {
  buildMagicStudioProjectLayout,
  buildMagicStudioRootLayout,
  resolveMagicStudioAssetAbsolutePath,
  resolveMagicStudioAssetVirtualPath,
  resolveMagicStudioSystemLibraryDir,
  type MagicStudioRootOverrides,
  type MagicStudioSystemLibraryDirName,
} from '@sdkwork/magic-studio-core/storage';
import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';

import { ASSET_CENTER_PROTOCOL } from '../domain/assetCenter.domain';

export type ManagedAssetStorageClass =
  | 'original'
  | 'generated'
  | 'proxy'
  | 'optimized'
  | 'cache';

export interface BuildManagedAssetTargetInput {
  rootDir: string;
  workspacesRootDir?: string;
  cacheRootDir?: string;
  exportsRootDir?: string;
  workspaceId: string;
  projectId?: string;
  type: AssetContentKey;
  assetId: string;
  extension: string;
  storageClass?: ManagedAssetStorageClass;
}

export interface ManagedAssetTarget {
  absoluteDir: string;
  absolutePath: string;
  relativePath: string;
  virtualPath: string;
  managedFileName: string;
  storageClass: ManagedAssetStorageClass;
}

const normalizeExtension = (extension: string): string =>
  extension.startsWith('.') ? extension : `.${extension}`;

const toManagedTypedDir = (type: AssetContentKey): MagicStudioSystemLibraryDirName =>
  resolveMagicStudioSystemLibraryDir(type);

const toComparablePath = (value: string): string => {
  const normalized = pathUtils.normalize(value).replace(/\\/g, '/').replace(/\/+$/, '');
  return /^[a-zA-Z]:/.test(normalized) ? normalized.toLowerCase() : normalized;
};

const stripComparableRootPrefix = (absolutePath: string, rootDir: string): string | null => {
  const normalizedRoot = toComparablePath(rootDir);
  const normalizedAbsolute = toComparablePath(absolutePath);

  if (!normalizedRoot || !normalizedAbsolute) {
    return null;
  }

  if (normalizedAbsolute === normalizedRoot) {
    return '';
  }

  const rootWithSeparator = `${normalizedRoot}/`;
  if (!normalizedAbsolute.startsWith(rootWithSeparator)) {
    return null;
  }

  return normalizedAbsolute.slice(rootWithSeparator.length);
};

const isManagedProjectRelativePath = (
  relativePath: string,
  projectSegmentIndex: number
): boolean => {
  const segments = relativePath.split('/').filter(Boolean);
  const terminalSegment = segments[projectSegmentIndex];

  return (
    segments.length > projectSegmentIndex + 1 &&
    terminalSegment !== undefined &&
    ['media', 'cache', 'exports'].includes(terminalSegment)
  );
};

const buildCanonicalProjectRelativeDir = (
  input: BuildManagedAssetTargetInput,
  typedDir: MagicStudioSystemLibraryDirName,
  storageClass: ManagedAssetStorageClass
): string => {
  const workspacePrefix = `workspaces/${input.workspaceId}/projects/${input.projectId}`;

  switch (storageClass) {
    case 'generated':
      return `${workspacePrefix}/media/generated/${typedDir}`;
    case 'proxy':
      return `${workspacePrefix}/media/proxies/${typedDir}`;
    case 'optimized':
      return `${workspacePrefix}/media/optimized/${typedDir}`;
    case 'cache':
      return `${workspacePrefix}/cache/temp/${typedDir}`;
    case 'original':
    default:
      return `${workspacePrefix}/media/originals/${typedDir}`;
  }
};

const buildProjectScopedDir = (
  input: BuildManagedAssetTargetInput,
  typedDir: MagicStudioSystemLibraryDirName,
  storageClass: ManagedAssetStorageClass
): string => {
  const projectLayout = buildMagicStudioProjectLayout({
    rootDir: input.rootDir,
    workspacesRootDir: input.workspacesRootDir,
    cacheRootDir: input.cacheRootDir,
    exportsRootDir: input.exportsRootDir,
    workspaceId: input.workspaceId,
    projectId: input.projectId || 'default-project',
  });

  switch (storageClass) {
    case 'generated':
      return pathUtils.join(projectLayout.generatedRoot, typedDir);
    case 'proxy':
      return pathUtils.join(projectLayout.proxiesRoot, typedDir);
    case 'optimized':
      return pathUtils.join(projectLayout.optimizedRoot, typedDir);
    case 'cache':
      return pathUtils.join(projectLayout.tempCacheDir, typedDir);
    case 'original':
    default:
      return pathUtils.join(projectLayout.originalsRoot, typedDir);
  }
};

export const buildManagedAssetTarget = (
  input: BuildManagedAssetTargetInput
): ManagedAssetTarget => {
  const normalizedRootDir = pathUtils.normalize(input.rootDir);
  const storageClass = input.storageClass || 'original';
  const typedDir = toManagedTypedDir(input.type);
  const managedFileName = `${input.assetId}${normalizeExtension(input.extension)}`;
  const absoluteDir = input.projectId
    ? buildProjectScopedDir(input, typedDir, storageClass)
    : pathUtils.join(normalizedRootDir, 'system', 'library', typedDir);
  const absolutePath = pathUtils.join(absoluteDir, managedFileName);
  const relativeDir = input.projectId
    ? buildCanonicalProjectRelativeDir(input, typedDir, storageClass)
    : `system/library/${typedDir}`;
  const relativePath = `${relativeDir}/${managedFileName}`;

  return {
    absoluteDir,
    absolutePath,
    relativePath,
    virtualPath: `${ASSET_CENTER_PROTOCOL}${relativePath}`,
    managedFileName,
    storageClass,
  };
};

export const resolveManagedAssetAbsolutePath = (
  config: MagicStudioRootOverrides,
  relativePath: string
): string => resolveMagicStudioAssetAbsolutePath(config, relativePath);

export const resolveManagedAssetVirtualPath = (
  config: MagicStudioRootOverrides,
  absolutePath: string
): string => resolveMagicStudioAssetVirtualPath(config, absolutePath);

export const isManagedAssetAbsolutePath = (
  config: MagicStudioRootOverrides,
  absolutePath: string
): boolean => {
  if (!absolutePath || !absolutePath.trim()) {
    return false;
  }

  const rootLayout = buildMagicStudioRootLayout(config);

  const systemLibraryRelative = stripComparableRootPrefix(
    absolutePath,
    rootLayout.systemLibraryRoot
  );
  if (systemLibraryRelative && systemLibraryRelative.length > 0) {
    return true;
  }

  const workspaceRelative = stripComparableRootPrefix(absolutePath, rootLayout.workspacesRoot);
  if (workspaceRelative && workspaceRelative.length > 0) {
    const segments = workspaceRelative.split('/').filter(Boolean);
    if (
      segments.length > 4 &&
      segments[1] === 'projects' &&
      isManagedProjectRelativePath(workspaceRelative, 3)
    ) {
      return true;
    }
  }

  if (config.cacheRootDir) {
    const cacheRelative = stripComparableRootPrefix(absolutePath, config.cacheRootDir);
    if (cacheRelative && cacheRelative.length > 0 && isManagedProjectRelativePath(cacheRelative, 2)) {
      return true;
    }
  }

  if (config.exportsRootDir) {
    const exportsRelative = stripComparableRootPrefix(absolutePath, config.exportsRootDir);
    if (
      exportsRelative &&
      exportsRelative.length > 0 &&
      isManagedProjectRelativePath(exportsRelative, 2)
    ) {
      return true;
    }
  }

  return false;
};
