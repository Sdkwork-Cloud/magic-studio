import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';

import { isDesktopShellRuntimeKind } from '../platform/runtime/kinds.ts';
import type { PlatformRuntime } from '../platform/runtime/types.ts';
import {
  buildMagicStudioProjectLayout,
  buildMagicStudioWorkspaceLayout,
  type MagicStudioRootOverrides,
} from './magicStudioPaths.ts';
import {
  isAbsoluteFilePath,
  isExplicitLocalAssetLocator,
  isMagicStudioAssetPath,
  isRenderableAssetUrl,
  MAGIC_STUDIO_ASSET_PROTOCOL,
  stripExplicitLocalAssetLocatorProtocol,
  stripMagicStudioAssetProtocol,
} from './runtimeMagicStudioAssetReference.ts';
import { loadMagicStudioStorageConfigFromRuntime } from './runtimeMagicStudioStorage.ts';

export {
  DESKTOP_ASSET_PROTOCOL,
  FILE_ASSET_PROTOCOL,
  isAbsoluteFilePath,
  isCanonicalMagicStudioAssetReference,
  isDesktopAssetLocator,
  isExplicitLocalAssetLocator,
  isFileAssetLocator,
  isLocalFileAssetReference,
  isLocalFilePath,
  isMagicStudioAssetPath,
  isRelativeFilePath,
  isRenderableAssetUrl,
  MAGIC_STUDIO_ASSET_PROTOCOL,
  normalizeMagicStudioAssetReference,
  resolveMagicStudioAssetReferenceName,
  stripExplicitLocalAssetLocatorProtocol,
  stripMagicStudioAssetProtocol,
} from './runtimeMagicStudioAssetReference.ts';

export type RuntimeMagicStudioAssetRuntime = Pick<PlatformRuntime, 'system' | 'storage' | 'fileSystem'>;

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

export const resolveMagicStudioAssetAbsolutePath = (
  config: MagicStudioRootOverrides,
  pathLike: string
): string => {
  const normalized = String(pathLike ?? '').trim();
  if (!normalized) {
    return normalized;
  }

  if (isRenderableAssetUrl(normalized)) {
    return normalized;
  }

  const explicitLocalPath = isExplicitLocalAssetLocator(normalized)
    ? stripExplicitLocalAssetLocatorProtocol(normalized)
    : normalized;
  const candidate = stripMagicStudioAssetProtocol(explicitLocalPath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (!candidate) {
    return config.rootDir;
  }

  if (isAbsoluteFilePath(explicitLocalPath) || isAbsoluteFilePath(candidate)) {
    return isAbsoluteFilePath(explicitLocalPath) ? explicitLocalPath : candidate;
  }

  if (candidate.startsWith('workspaces/')) {
    return resolveWorkspaceRelativeAbsolutePath(config, candidate);
  }

  return pathUtils.join(config.rootDir, candidate);
};

export const resolveMagicStudioAssetVirtualPath = (
  config: MagicStudioRootOverrides,
  absolutePath: string
): string => {
  if (!absolutePath || !absolutePath.trim()) {
    return absolutePath;
  }

  if (isMagicStudioAssetPath(absolutePath)) {
    return absolutePath;
  }

  const cacheRelativePath = config.cacheRootDir
    ? stripRootPrefix(absolutePath, config.cacheRootDir)
    : null;
  if (cacheRelativePath) {
    const segments = cacheRelativePath.split('/');
    if (segments.length >= 3) {
      return `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/${segments[0]}/projects/${segments[1]}/${segments
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
      return `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/${segments[0]}/projects/${segments[1]}/${segments
        .slice(2)
        .join('/')}`;
    }
  }

  const workspaceRoot = config.workspacesRootDir || pathUtils.join(config.rootDir, 'workspaces');
  const workspaceRelativePath = stripRootPrefix(absolutePath, workspaceRoot);
  if (workspaceRelativePath !== null) {
    return `${MAGIC_STUDIO_ASSET_PROTOCOL}workspaces/${workspaceRelativePath}`;
  }

  const rootRelativePath = stripRootPrefix(absolutePath, config.rootDir);
  if (rootRelativePath !== null) {
    return rootRelativePath ? `${MAGIC_STUDIO_ASSET_PROTOCOL}${rootRelativePath}` : MAGIC_STUDIO_ASSET_PROTOCOL;
  }

  const fallbackRelativePath = toForwardRelativePath(config.rootDir, absolutePath);
  return fallbackRelativePath.startsWith('/') ? absolutePath : `${MAGIC_STUDIO_ASSET_PROTOCOL}${fallbackRelativePath}`;
};

export const resolveRuntimeMagicStudioAssetAbsolutePath = async (
  runtime: RuntimeMagicStudioAssetRuntime,
  pathLike: string
): Promise<string> =>
  resolveMagicStudioAssetAbsolutePath(
    await loadMagicStudioStorageConfigFromRuntime(runtime),
    pathLike,
  );

export const resolveRuntimeMagicStudioAssetUrl = async (
  runtime: RuntimeMagicStudioAssetRuntime,
  pathLike: string
): Promise<string> => {
  const normalized = String(pathLike ?? '').trim();
  if (!normalized) {
    return normalized;
  }

  if (isRenderableAssetUrl(normalized)) {
    return normalized;
  }

  const absolutePath = await resolveRuntimeMagicStudioAssetAbsolutePath(runtime, normalized);
  if (!absolutePath) {
    return absolutePath;
  }

  if (isDesktopShellRuntimeKind(runtime.system.kind())) {
    return runtime.fileSystem.convertFileSrc(absolutePath);
  }

  const blob = await runtime.fileSystem.readBlob(absolutePath);
  return URL.createObjectURL(blob);
};
