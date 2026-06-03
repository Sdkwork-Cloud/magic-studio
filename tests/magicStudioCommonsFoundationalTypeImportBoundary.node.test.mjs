import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const foundationBoundaryDirectories = [
  'packages/sdkwork-magic-studio-assets/src/services',
  'packages/sdkwork-magic-studio-assets/src/asset-center/application',
  'packages/sdkwork-magic-studio-notifications/src/services',
  'packages/sdkwork-magic-studio-notifications/src/store',
  'packages/sdkwork-magic-studio-core/src/services',
  'packages/sdkwork-magic-studio-film/src/utils',
  'packages/sdkwork-magic-studio-canvas/src/services',
  'packages/sdkwork-magic-studio-canvas/src/components',
  'packages/sdkwork-magic-studio-browser/src/services',
  'packages/sdkwork-magic-studio-audio/src/utils',
  'packages/sdkwork-magic-studio-generation-history/src/components',
  'packages/sdkwork-magic-studio-image/src/components',
  'packages/sdkwork-magic-studio-image/src/utils',
  'packages/sdkwork-magic-studio-image/src/services',
  'packages/sdkwork-magic-studio-drive/src/entities',
  'packages/sdkwork-magic-studio-video/src/components',
  'packages/sdkwork-magic-studio-video/src/utils',
  'packages/sdkwork-magic-studio-voicespeaker/src/utils',
  'packages/sdkwork-magic-studio-character/src/utils',
  'packages/sdkwork-magic-studio-music/src/utils',
  'packages/sdkwork-magic-studio-magiccut/src/domain',
  'packages/sdkwork-magic-studio-magiccut/src/components',
  'packages/sdkwork-magic-studio-magiccut/src/engine',
  'packages/sdkwork-magic-studio-magiccut/src/services',
  'packages/sdkwork-magic-studio-magiccut/src/store',
  'packages/sdkwork-magic-studio-magiccut/src/utils',
  'packages/sdkwork-magic-studio-notes/src/components',
  'packages/sdkwork-magic-studio-notes/src/entities',
  'packages/sdkwork-magic-studio-notes/src/services',
  'packages/sdkwork-magic-studio-notes/src/store',
  'packages/sdkwork-magic-studio-notes/src/utils',
  'packages/sdkwork-magic-studio-prompt/src/services',
  'packages/sdkwork-magic-studio-prompt/src/store',
  'packages/sdkwork-magic-studio-portal-video/src/components',
  'packages/sdkwork-magic-studio-portal-video/src/pages',
  'packages/sdkwork-magic-studio-portal-video/src/services',
  'packages/sdkwork-magic-studio-settings/src/services',
  'packages/sdkwork-magic-studio-settings/src/data',
  'packages/sdkwork-magic-studio-portal-video/src/utils',
  'packages/sdkwork-magic-studio-film/src/components',
  'packages/sdkwork-magic-studio-film/src/pages',
  'packages/sdkwork-magic-studio-film/src/repository',
  'packages/sdkwork-magic-studio-film/src/services',
  'packages/sdkwork-magic-studio-film/src/store',
  'packages/sdkwork-magic-studio-workspace/src/components',
  'packages/sdkwork-magic-studio-workspace/src/entities',
  'packages/sdkwork-magic-studio-workspace/src/services',
  'packages/sdkwork-magic-studio-workspace/src/store',
];

const foundationBoundaryFiles = [
  'packages/sdkwork-magic-studio-magiccut/src/events.ts',
  'packages/sdkwork-magic-studio-film/src/constants.ts',
  'packages/sdkwork-magic-studio-image/src/constants.ts',
  'packages/sdkwork-magic-studio-portal-video/src/constants.ts',
  'packages/sdkwork-magic-studio-sfx/src/constants.ts',
  'packages/sdkwork-magic-studio-video/src/constants.ts',
];

const forbiddenRootSymbols = [
  'Result',
  'ServiceResult',
  'IBaseService',
  'Page',
  'PageRequest',
  'Sort',
  'BaseEntity',
  'matchesEntityKey',
  'resolveEntityKey',
  'EntityIdentityLike',
  'MediaScene',
  'MediaType',
  'MediaResourceType',
  'AnyMediaResource',
  'StorageObject',
  'UploadResult',
  'AppNotification',
  'NotificationType',
  'ThemeMode',
  'ModelProvider',
  'GalleryItem',
  'GalleryItemType',
  'QuadTree',
  'Rect',
  'AssetType',
  'Asset',
  'AssetAtomicMediaResource',
  'MediaResource',
  'createUuid',
  'IMAGE_STYLES',
  'VIDEO_STYLES',
  'VideoAspectRatio',
  'VideoResolution',
  'VideoConfig',
  'FilmProject',
  'FilmShot',
  'FilmCharacter',
  'FilmLocation',
  'FilmProp',
  'FilmScene',
  'FilmDialogueItem',
  'FilmSettings',
  'FilmViewMode',
  'GenerationProduct',
  'StyleOption',
];

function collectFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function importsSymbolFromCommonsRoot(source, symbol) {
  const rootImportPattern =
    /import\s*(type\s+)?\{([^}]*)\}\s*from ['"]@sdkwork\/magic-studio-commons['"]/gms;
  const symbolPattern = new RegExp(
    `(^|[\\s,])(?:type\\s+)?${symbol}(?:\\s+as\\s+[A-Za-z0-9_$]+)?(?=[\\s,]|$)`
  );

  for (const match of source.matchAll(rootImportPattern)) {
    if (symbolPattern.test(match[2])) {
      return true;
    }
  }

  return false;
}

test('service, store, utility, entity, and focused feature files do not source foundational contracts from the broad magic-studio-commons root entry', () => {
  const offenders = [];

  for (const relativeDirectory of foundationBoundaryDirectories) {
    const directoryPath = path.join(workspaceRoot, relativeDirectory);
    for (const filePath of collectFiles(directoryPath)) {
      const source = fs.readFileSync(filePath, 'utf8');
      const importedForbiddenSymbols = forbiddenRootSymbols.filter((symbol) =>
        importsSymbolFromCommonsRoot(source, symbol)
      );

      if (importedForbiddenSymbols.length === 0) {
        continue;
      }

      offenders.push(
        `${path.relative(workspaceRoot, filePath)} => ${importedForbiddenSymbols.join(', ')}`
      );
    }
  }

  for (const relativeFile of foundationBoundaryFiles) {
    const filePath = path.join(workspaceRoot, relativeFile);
    const source = fs.readFileSync(filePath, 'utf8');
    const importedForbiddenSymbols = forbiddenRootSymbols.filter((symbol) =>
      importsSymbolFromCommonsRoot(source, symbol)
    );

    if (importedForbiddenSymbols.length === 0) {
      continue;
    }

    offenders.push(
      `${path.relative(workspaceRoot, filePath)} => ${importedForbiddenSymbols.join(', ')}`
    );
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected foundational contracts to come from @sdkwork/magic-studio-types or focused magic-studio-commons subpaths. Offenders: ${offenders.join('; ')}`
  );
});
