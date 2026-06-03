import type { AssetContentKey } from '@sdkwork/magic-studio-types/media';

const detectPathSeparator = (value: string): string =>
  value.includes('\\') ? '\\' : '/';

export const magicStudioPathUtils = {
  join(...segments: string[]): string {
    if (!segments.length) {
      return '';
    }

    const separator = segments.some((segment) => segment.includes('\\')) ? '\\' : '/';
    let joined = segments
      .filter((segment) => segment !== null && segment !== undefined && segment !== '')
      .map((segment, index) => {
        let normalized = segment.replace(/[/\\]/g, separator);

        if (normalized.length > 1 && normalized.endsWith(separator)) {
          normalized = normalized.slice(0, -1);
        }
        if (index !== 0 && normalized.startsWith(separator)) {
          normalized = normalized.slice(1);
        }

        return normalized;
      })
      .join(separator);

    if (joined.length > 1 && joined.endsWith(separator)) {
      joined = joined.slice(0, -1);
    }

    return joined;
  },
  normalize(value: string): string {
    const normalized = value.trim();
    if (!normalized) {
      return '';
    }

    const separator = detectPathSeparator(normalized);
    let output = normalized.replace(/[/\\]/g, separator);
    if (output.length > 1 && output.endsWith(separator)) {
      output = output.slice(0, -1);
    }
    return output;
  },
};

const pathUtils = magicStudioPathUtils;

export const MAGICSTUDIO_HOME_DIRNAME = '.sdkwork';
export const MAGICSTUDIO_ROOT_DIRNAME = 'magicstudio';
export const DEFAULT_MAGICSTUDIO_ROOT_RELATIVE_PATH = pathUtils.join(
  MAGICSTUDIO_HOME_DIRNAME,
  MAGICSTUDIO_ROOT_DIRNAME
);

export const MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS = {
  VIDEO: 'video',
  IMAGE: 'image',
  AUDIO: 'audio',
  TEXT: 'text',
  OTHER: 'other',
} as const;

export type MagicStudioSystemLibraryDirName =
  (typeof MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS)[keyof typeof MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS];

export const MAGIC_STUDIO_SYSTEM_LIBRARY_DIR_ORDER: readonly MagicStudioSystemLibraryDirName[] = [
  MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.VIDEO,
  MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.IMAGE,
  MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.AUDIO,
  MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.TEXT,
  MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.OTHER,
] as const;

const normalizeMagicStudioLibraryType = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, '_');

export const resolveMagicStudioSystemLibraryDir = (
  type: AssetContentKey | string
): MagicStudioSystemLibraryDirName => {
  switch (normalizeMagicStudioLibraryType(String(type ?? ''))) {
    case 'video':
      return MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.VIDEO;
    case 'image':
      return MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.IMAGE;
    case 'audio':
    case 'music':
    case 'voice':
    case 'sfx':
    case 'speech':
      return MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.AUDIO;
    case 'text':
    case 'subtitle':
    case 'document':
    case 'code':
    case 'ppt':
      return MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.TEXT;
    default:
      return MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.OTHER;
  }
};

export interface MagicStudioRootOverrides {
  rootDir: string;
  workspacesRootDir?: string;
  cacheRootDir?: string;
  exportsRootDir?: string;
}

export type BuildMagicStudioRootLayoutInput = Pick<
  MagicStudioRootOverrides,
  'rootDir' | 'workspacesRootDir'
>;

export interface BuildMagicStudioWorkspaceLayoutInput extends MagicStudioRootOverrides {
  workspaceId: string;
}

export interface BuildMagicStudioProjectLayoutInput extends BuildMagicStudioWorkspaceLayoutInput {
  projectId: string;
}

export interface BuildMagicStudioUserLayoutInput
  extends Pick<MagicStudioRootOverrides, 'rootDir' | 'workspacesRootDir'> {
  userId: string;
}

export interface MagicStudioRootLayout {
  rootDir: string;
  usersRoot: string;
  workspacesRoot: string;
  systemRoot: string;
  systemSettingsFile: string;
  systemIndexesRoot: string;
  systemSyncRoot: string;
  systemLogsRoot: string;
  systemTempRoot: string;
  systemCacheRoot: string;
  systemIntegrationsRoot: string;
  systemSkillsRoot: string;
  systemSkillsRegistryFile: string;
  systemMcpRoot: string;
  systemMcpSettingsFile: string;
  systemPluginsRoot: string;
  systemPluginsRegistryFile: string;
  systemThumbnailCacheDir: string;
  systemWaveformsCacheDir: string;
  systemPeaksCacheDir: string;
  systemAnalysisCacheDir: string;
  systemLibraryRoot: string;
  systemLibraryVideoDir: string;
  systemLibraryImageDir: string;
  systemLibraryAudioDir: string;
  systemLibraryTextDir: string;
  systemLibraryOtherDir: string;
}

export const listMagicStudioSystemLibraryDirs = (
  layout: Pick<
    MagicStudioRootLayout,
    | 'systemLibraryVideoDir'
    | 'systemLibraryImageDir'
    | 'systemLibraryAudioDir'
    | 'systemLibraryTextDir'
    | 'systemLibraryOtherDir'
  >
): string[] => [
  layout.systemLibraryVideoDir,
  layout.systemLibraryImageDir,
  layout.systemLibraryAudioDir,
  layout.systemLibraryTextDir,
  layout.systemLibraryOtherDir,
];

export const resolveMagicStudioSystemLibraryAbsoluteDir = (
  layout: Pick<
    MagicStudioRootLayout,
    | 'systemLibraryVideoDir'
    | 'systemLibraryImageDir'
    | 'systemLibraryAudioDir'
    | 'systemLibraryTextDir'
    | 'systemLibraryOtherDir'
  >,
  type: AssetContentKey | string
): string => {
  switch (resolveMagicStudioSystemLibraryDir(type)) {
    case MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.VIDEO:
      return layout.systemLibraryVideoDir;
    case MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.IMAGE:
      return layout.systemLibraryImageDir;
    case MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.AUDIO:
      return layout.systemLibraryAudioDir;
    case MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.TEXT:
      return layout.systemLibraryTextDir;
    case MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.OTHER:
    default:
      return layout.systemLibraryOtherDir;
  }
};

export interface MagicStudioUserLayout extends MagicStudioRootLayout {
  userId: string;
  userRoot: string;
  userFile: string;
  userPreferencesFile: string;
  chatsDir: string;
  presetsDir: string;
  templatesDir: string;
  lutsDir: string;
  shortcutsDir: string;
}

export interface MagicStudioWorkspaceLayout extends MagicStudioRootLayout {
  workspaceId: string;
  workspaceRoot: string;
  workspaceFile: string;
  projectsRoot: string;
}

export interface MagicStudioProjectLayout extends MagicStudioWorkspaceLayout {
  projectId: string;
  projectRoot: string;
  projectFile: string;
  projectLockFile: string;
  autosaveDir: string;
  backupsDir: string;
  ingestDir: string;
  ingestManifestDir: string;
  ingestRelinkDir: string;
  mediaRoot: string;
  originalsRoot: string;
  originalVideoDir: string;
  originalImageDir: string;
  originalAudioDir: string;
  originalTextDir: string;
  originalOtherDir: string;
  generatedRoot: string;
  generatedVideoDir: string;
  generatedImageDir: string;
  generatedAudioDir: string;
  generatedTextDir: string;
  proxiesRoot: string;
  proxyVideoDir: string;
  proxyImageDir: string;
  optimizedRoot: string;
  conformedRoot: string;
  cacheRoot: string;
  renderCacheDir: string;
  waveformsCacheDir: string;
  thumbnailsCacheDir: string;
  peaksCacheDir: string;
  analysisCacheDir: string;
  tempCacheDir: string;
  exportsRoot: string;
  draftExportsDir: string;
  masterExportsDir: string;
  packageExportsDir: string;
  snapshotsDir: string;
  trashDir: string;
}

const normalizePath = (value: string): string => pathUtils.normalize(value.trim());

const hasTildePrefix = (value: string): boolean =>
  value === '~' || value.startsWith('~/') || value.startsWith('~\\');

export const buildMagicStudioRootLayout = ({
  rootDir,
  workspacesRootDir,
}: BuildMagicStudioRootLayoutInput): MagicStudioRootLayout => {
  const normalizedRootDir = normalizePath(rootDir);
  const systemRoot = pathUtils.join(normalizedRootDir, 'system');
  const systemCacheRoot = pathUtils.join(systemRoot, 'cache');
  const systemIntegrationsRoot = pathUtils.join(systemRoot, 'integrations');
  const systemSkillsRoot = pathUtils.join(systemIntegrationsRoot, 'skills');
  const systemMcpRoot = pathUtils.join(systemIntegrationsRoot, 'mcp');
  const systemPluginsRoot = pathUtils.join(systemIntegrationsRoot, 'plugins');
  const systemLibraryRoot = pathUtils.join(systemRoot, 'library');

  return {
    rootDir: normalizedRootDir,
    usersRoot: pathUtils.join(normalizedRootDir, 'users'),
    workspacesRoot: workspacesRootDir
      ? normalizePath(workspacesRootDir)
      : pathUtils.join(normalizedRootDir, 'workspaces'),
    systemRoot,
    systemSettingsFile: pathUtils.join(systemRoot, 'settings.json'),
    systemIndexesRoot: pathUtils.join(systemRoot, 'indexes'),
    systemSyncRoot: pathUtils.join(systemRoot, 'sync'),
    systemLogsRoot: pathUtils.join(systemRoot, 'logs'),
    systemTempRoot: pathUtils.join(systemRoot, 'temp'),
    systemCacheRoot,
    systemIntegrationsRoot,
    systemSkillsRoot,
    systemSkillsRegistryFile: pathUtils.join(systemSkillsRoot, 'registry.json'),
    systemMcpRoot,
    systemMcpSettingsFile: pathUtils.join(systemMcpRoot, 'settings.json'),
    systemPluginsRoot,
    systemPluginsRegistryFile: pathUtils.join(systemPluginsRoot, 'registry.json'),
    systemThumbnailCacheDir: pathUtils.join(systemCacheRoot, 'thumbnails'),
    systemWaveformsCacheDir: pathUtils.join(systemCacheRoot, 'waveforms'),
    systemPeaksCacheDir: pathUtils.join(systemCacheRoot, 'peaks'),
    systemAnalysisCacheDir: pathUtils.join(systemCacheRoot, 'analysis'),
    systemLibraryRoot,
    systemLibraryVideoDir: pathUtils.join(
      systemLibraryRoot,
      MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.VIDEO
    ),
    systemLibraryImageDir: pathUtils.join(
      systemLibraryRoot,
      MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.IMAGE
    ),
    systemLibraryAudioDir: pathUtils.join(
      systemLibraryRoot,
      MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.AUDIO
    ),
    systemLibraryTextDir: pathUtils.join(
      systemLibraryRoot,
      MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.TEXT
    ),
    systemLibraryOtherDir: pathUtils.join(
      systemLibraryRoot,
      MAGIC_STUDIO_SYSTEM_LIBRARY_DIRS.OTHER
    ),
  };
};

export const buildMagicStudioUserLayout = (
  input: BuildMagicStudioUserLayoutInput
): MagicStudioUserLayout => {
  const rootLayout = buildMagicStudioRootLayout(input);
  const userRoot = pathUtils.join(rootLayout.usersRoot, input.userId);

  return {
    ...rootLayout,
    userId: input.userId,
    userRoot,
    userFile: pathUtils.join(userRoot, 'user.json'),
    userPreferencesFile: pathUtils.join(userRoot, 'preferences.json'),
    chatsDir: pathUtils.join(userRoot, 'chats'),
    presetsDir: pathUtils.join(userRoot, 'presets'),
    templatesDir: pathUtils.join(userRoot, 'templates'),
    lutsDir: pathUtils.join(userRoot, 'luts'),
    shortcutsDir: pathUtils.join(userRoot, 'shortcuts'),
  };
};

const buildScopedOverrideRoot = (
  overrideRootDir: string | undefined,
  workspaceId: string,
  projectId: string,
  terminalSegment: string
): string | null => {
  if (!overrideRootDir) {
    return null;
  }

  return pathUtils.join(normalizePath(overrideRootDir), workspaceId, projectId, terminalSegment);
};

export const resolveDefaultMagicStudioRoot = (homeDir: string): string =>
  pathUtils.join(normalizePath(homeDir), DEFAULT_MAGICSTUDIO_ROOT_RELATIVE_PATH);

export const resolveMagicStudioRoot = (rootDir: string, homeDir: string): string => {
  const trimmedRootDir = rootDir.trim();
  if (!trimmedRootDir) {
    return resolveDefaultMagicStudioRoot(homeDir);
  }

  if (!hasTildePrefix(trimmedRootDir)) {
    return normalizePath(trimmedRootDir);
  }

  const suffix = trimmedRootDir.slice(1);
  return pathUtils.join(normalizePath(homeDir), suffix);
};

export const buildMagicStudioWorkspaceLayout = (
  input: BuildMagicStudioWorkspaceLayoutInput
): MagicStudioWorkspaceLayout => {
  const rootLayout = buildMagicStudioRootLayout(input);
  const workspaceRoot = pathUtils.join(rootLayout.workspacesRoot, input.workspaceId);

  return {
    ...rootLayout,
    workspaceId: input.workspaceId,
    workspaceRoot,
    workspaceFile: pathUtils.join(workspaceRoot, 'workspace.json'),
    projectsRoot: pathUtils.join(workspaceRoot, 'projects'),
  };
};

export const buildMagicStudioProjectLayout = (
  input: BuildMagicStudioProjectLayoutInput
): MagicStudioProjectLayout => {
  const workspaceLayout = buildMagicStudioWorkspaceLayout(input);
  const projectRoot = pathUtils.join(workspaceLayout.projectsRoot, input.projectId);
  const mediaRoot = pathUtils.join(projectRoot, 'media');
  const originalsRoot = pathUtils.join(mediaRoot, 'originals');
  const generatedRoot = pathUtils.join(mediaRoot, 'generated');
  const proxiesRoot = pathUtils.join(mediaRoot, 'proxies');
  const cacheRoot =
    buildScopedOverrideRoot(input.cacheRootDir, input.workspaceId, input.projectId, 'cache') ||
    pathUtils.join(projectRoot, 'cache');
  const exportsRoot =
    buildScopedOverrideRoot(input.exportsRootDir, input.workspaceId, input.projectId, 'exports') ||
    pathUtils.join(projectRoot, 'exports');

  return {
    ...workspaceLayout,
    projectId: input.projectId,
    projectRoot,
    projectFile: pathUtils.join(projectRoot, 'project.json'),
    projectLockFile: pathUtils.join(projectRoot, 'project.lock'),
    autosaveDir: pathUtils.join(projectRoot, 'autosave'),
    backupsDir: pathUtils.join(projectRoot, 'backups'),
    ingestDir: pathUtils.join(projectRoot, 'ingest'),
    ingestManifestDir: pathUtils.join(projectRoot, 'ingest', 'manifests'),
    ingestRelinkDir: pathUtils.join(projectRoot, 'ingest', 'relink'),
    mediaRoot,
    originalsRoot,
    originalVideoDir: pathUtils.join(originalsRoot, 'video'),
    originalImageDir: pathUtils.join(originalsRoot, 'image'),
    originalAudioDir: pathUtils.join(originalsRoot, 'audio'),
    originalTextDir: pathUtils.join(originalsRoot, 'text'),
    originalOtherDir: pathUtils.join(originalsRoot, 'other'),
    generatedRoot,
    generatedVideoDir: pathUtils.join(generatedRoot, 'video'),
    generatedImageDir: pathUtils.join(generatedRoot, 'image'),
    generatedAudioDir: pathUtils.join(generatedRoot, 'audio'),
    generatedTextDir: pathUtils.join(generatedRoot, 'text'),
    proxiesRoot,
    proxyVideoDir: pathUtils.join(proxiesRoot, 'video'),
    proxyImageDir: pathUtils.join(proxiesRoot, 'image'),
    optimizedRoot: pathUtils.join(mediaRoot, 'optimized'),
    conformedRoot: pathUtils.join(mediaRoot, 'conformed'),
    cacheRoot,
    renderCacheDir: pathUtils.join(cacheRoot, 'render'),
    waveformsCacheDir: pathUtils.join(cacheRoot, 'waveforms'),
    thumbnailsCacheDir: pathUtils.join(cacheRoot, 'thumbnails'),
    peaksCacheDir: pathUtils.join(cacheRoot, 'peaks'),
    analysisCacheDir: pathUtils.join(cacheRoot, 'analysis'),
    tempCacheDir: pathUtils.join(cacheRoot, 'temp'),
    exportsRoot,
    draftExportsDir: pathUtils.join(exportsRoot, 'drafts'),
    masterExportsDir: pathUtils.join(exportsRoot, 'masters'),
    packageExportsDir: pathUtils.join(exportsRoot, 'packages'),
    snapshotsDir: pathUtils.join(projectRoot, 'snapshots'),
    trashDir: pathUtils.join(projectRoot, 'trash'),
  };
};
