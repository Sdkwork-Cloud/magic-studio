import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const resolveFromRoot = (...segments) => path.resolve(root, ...segments);
const toPosixPath = (value) => value.split(path.sep).join('/');
const resolveFromRootPosix = (...segments) => toPosixPath(resolveFromRoot(...segments));
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createWorkspaceEntryAlias = (specifier, ...segments) => ({
  find: new RegExp(`^${escapeRegex(specifier)}$`),
  replacement: resolveFromRootPosix(...segments),
});

const createWorkspacePackageAliases = (specifier, directoryName) => {
  const srcDir = resolveFromRootPosix('packages', directoryName, 'src');
  return [
    {
      find: new RegExp(`^${specifier.replace('/', '\\/')}$`),
      replacement: `${srcDir}/index.ts`,
    },
    {
      find: new RegExp(`^${specifier.replace('/', '\\/')}/(.+)$`),
      replacement: `${srcDir}/$1`,
    },
  ];
};

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: false,
    exclude: ['**/.worktrees/**'],
  },
  resolve: {
    alias: [
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-host-core', 'sdkwork-magic-studio-host-core'),
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-server', 'sdkwork-magic-studio-server'),
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-types', 'sdkwork-magic-studio-types'),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-commons/hooks',
        'packages',
        'sdkwork-magic-studio-commons',
        'src',
        'hooks',
        'index.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-commons/services',
        'packages',
        'sdkwork-magic-studio-commons',
        'src',
        'services',
        'index.ts'
      ),
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-commons', 'sdkwork-magic-studio-commons'),
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-core', 'sdkwork-magic-studio-core'),
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-i18n', 'sdkwork-magic-studio-i18n'),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/asset-reference',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'asset-reference.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/entity',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'entity.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/service',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'service.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/pagination',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'pagination.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/storage',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'storage.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/media',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'media.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/assets',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'assets.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/asset-center',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'asset-center.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/image',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'image.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/video',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'video.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/audio',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'audio.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/music',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'music.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/character',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'character.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/voice',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'voice.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/sfx',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'sfx.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/chat',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'chat.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/agi',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'agi.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/input-resource',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'input-resource.utils.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/vocabulary',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'vocabulary.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/catalog',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'catalog.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/content',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'content.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/auth',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'auth.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/user',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'user.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/workspace',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'workspace.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/runtime',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'runtime.types.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/theme-mode',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'theme-mode.ts'
      ),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-types/infrastructure',
        'packages',
        'sdkwork-magic-studio-types',
        'src',
        'infrastructure.types.ts'
      ),
      ...createWorkspacePackageAliases('@sdkwork/magic-studio-types', 'sdkwork-magic-studio-types'),
      createWorkspaceEntryAlias(
        '@sdkwork/magic-studio-fs/services',
        'packages',
        'sdkwork-magic-studio-fs',
        'src',
        'services',
        'index.ts'
      ),
    ],
  },
});
