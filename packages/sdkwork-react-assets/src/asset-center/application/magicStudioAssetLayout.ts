import { pathUtils } from '@sdkwork/react-commons';
import type { AssetContentKey } from '@sdkwork/react-types';
import {
  buildMagicStudioProjectLayout,
  buildMagicStudioWorkspaceLayout,
  type MagicStudioRootOverrides,
} from '../../../../sdkwork-react-core/src/storage/magicStudioPaths';

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

type ManagedTypedDir = 'video' | 'image' | 'audio' | 'text' | 'other';

const normalizeExtension = (extension: string): string =>
  extension.startsWith('.') ? extension : `.${extension}`;

const toManagedTypedDir = (type: AssetContentKey): ManagedTypedDir => {
  switch (type) {
    case 'video':
      return 'video';
    case 'image':
      return 'image';
    case 'audio':
    case 'music':
    case 'voice':
    case 'sfx':
      return 'audio';
    case 'text':
    case 'subtitle':
      return 'text';
    default:
      return 'other';
  }
};

const toForwardRelativePath = (rootDir: string, absolutePath: string): string => {
  const normalizedRoot = pathUtils.normalize(rootDir);
  const normalizedAbsolute = pathUtils.normalize(absolutePath);
  const separator = pathUtils.detectSeparator(normalizedRoot);
  const rootWithSeparator = normalizedRoot.endsWith(separator)
    ? normalizedRoot
    : `${normalizedRoot}${separator}`;

  if (normalizedAbsolute.startsWith(rootWithSeparator)) {
    return normalizedAbsolute.slice(rootWithSeparator.length).replace(/\\/g, '/');
  }

  return normalizedAbsolute.replace(/\\/g, '/');
};

const stripRootPrefix = (absolutePath: string, rootDir: string): string | null => {
  const normalizedRoot = pathUtils.normalize(rootDir);
  const normalizedAbsolute = pathUtils.normalize(absolutePath);
  const separator = pathUtils.detectSeparator(normalizedRoot);
  const rootWithSeparator = normalizedRoot.endsWith(separator)
    ? normalizedRoot
    : `${normalizedRoot}${separator}`;

  if (normalizedAbsolute === normalizedRoot) {
    return '';
  }

  if (normalizedAbsolute.startsWith(rootWithSeparator)) {
    return normalizedAbsolute.slice(rootWithSeparator.length).replace(/\\/g, '/');
  }

  return null;
};

const buildCanonicalProjectRelativeDir = (
  input: BuildManagedAssetTargetInput,
  typedDir: ManagedTypedDir,
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
  typedDir: ManagedTypedDir,
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

const resolveWorkspaceRelativeAbsolutePath = (
  config: MagicStudioRootOverrides,
  relativePath: string
): string => {
  const segments = relativePath.split('/');
  const workspaceId = segments[1];

  if (!workspaceId) {
    return pathUtils.join(config.rootDir, relativePath);
  }

  if (segments[2] === 'projects' && segments[3]) {
    const projectId = segments[3];
    const projectRelativePath = segments.slice(4).join('/');
    const projectLayout = buildMagicStudioProjectLayout({
      rootDir: config.rootDir,
      workspacesRootDir: config.workspacesRootDir,
      cacheRootDir: config.cacheRootDir,
      exportsRootDir: config.exportsRootDir,
      workspaceId,
      projectId,
    });

    if (projectRelativePath.startsWith('cache/')) {
      return pathUtils.join(projectLayout.cacheRoot, projectRelativePath.slice('cache/'.length));
    }

    if (projectRelativePath.startsWith('exports/')) {
      return pathUtils.join(projectLayout.exportsRoot, projectRelativePath.slice('exports/'.length));
    }

    return pathUtils.join(projectLayout.projectRoot, projectRelativePath);
  }

  const workspaceLayout = buildMagicStudioWorkspaceLayout({
    rootDir: config.rootDir,
    workspacesRootDir: config.workspacesRootDir,
    workspaceId,
  });
  const workspaceRelativePath = segments.slice(2).join('/');
  return workspaceRelativePath
    ? pathUtils.join(workspaceLayout.workspaceRoot, workspaceRelativePath)
    : workspaceLayout.workspaceRoot;
};

export const resolveManagedAssetAbsolutePath = (
  config: MagicStudioRootOverrides,
  relativePath: string
): string => {
  const normalizedRelativePath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (normalizedRelativePath.startsWith('workspaces/')) {
    return resolveWorkspaceRelativeAbsolutePath(config, normalizedRelativePath);
  }

  return pathUtils.join(config.rootDir, normalizedRelativePath);
};

export const resolveManagedAssetVirtualPath = (
  config: MagicStudioRootOverrides,
  absolutePath: string
): string => {
  const cacheRelativePath = config.cacheRootDir
    ? stripRootPrefix(absolutePath, config.cacheRootDir)
    : null;
  if (cacheRelativePath) {
    const segments = cacheRelativePath.split('/');
    if (segments.length >= 3) {
      return `${ASSET_CENTER_PROTOCOL}workspaces/${segments[0]}/projects/${segments[1]}/${segments
        .slice(2)
        .join('/')}`;
    }
  }

  const exportsRelativePath = config.exportsRootDir
    ? stripRootPrefix(absolutePath, config.exportsRootDir)
    : null;
  if (exportsRelativePath) {
    const segments = exportsRelativePath.split('/');
    if (segments.length >= 3) {
      return `${ASSET_CENTER_PROTOCOL}workspaces/${segments[0]}/projects/${segments[1]}/${segments
        .slice(2)
        .join('/')}`;
    }
  }

  const workspaceRoot = config.workspacesRootDir || pathUtils.join(config.rootDir, 'workspaces');
  const workspaceRelativePath = stripRootPrefix(absolutePath, workspaceRoot);
  if (workspaceRelativePath !== null) {
    return `${ASSET_CENTER_PROTOCOL}workspaces/${workspaceRelativePath}`;
  }

  const rootRelativePath = stripRootPrefix(absolutePath, config.rootDir);
  if (rootRelativePath !== null) {
    return rootRelativePath
      ? `${ASSET_CENTER_PROTOCOL}${rootRelativePath}`
      : ASSET_CENTER_PROTOCOL;
  }

  return toForwardRelativePath(config.rootDir, absolutePath).startsWith('/')
    ? absolutePath
    : `${ASSET_CENTER_PROTOCOL}${toForwardRelativePath(config.rootDir, absolutePath)}`;
};
