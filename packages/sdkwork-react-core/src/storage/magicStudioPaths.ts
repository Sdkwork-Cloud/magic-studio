import { pathUtils } from '@sdkwork/react-commons';

export const MAGICSTUDIO_HOME_DIRNAME = '.sdkwork';
export const MAGICSTUDIO_ROOT_DIRNAME = 'magicstudio';
export const DEFAULT_MAGICSTUDIO_ROOT_RELATIVE_PATH = pathUtils.join(
  MAGICSTUDIO_HOME_DIRNAME,
  MAGICSTUDIO_ROOT_DIRNAME
);

export interface MagicStudioRootOverrides {
  rootDir: string;
  workspacesRootDir?: string;
  cacheRootDir?: string;
  exportsRootDir?: string;
}

export interface BuildMagicStudioRootLayoutInput
  extends Pick<MagicStudioRootOverrides, 'rootDir' | 'workspacesRootDir'> {}

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
    systemLibraryVideoDir: pathUtils.join(systemLibraryRoot, 'video'),
    systemLibraryImageDir: pathUtils.join(systemLibraryRoot, 'image'),
    systemLibraryAudioDir: pathUtils.join(systemLibraryRoot, 'audio'),
    systemLibraryTextDir: pathUtils.join(systemLibraryRoot, 'text'),
    systemLibraryOtherDir: pathUtils.join(systemLibraryRoot, 'other'),
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
