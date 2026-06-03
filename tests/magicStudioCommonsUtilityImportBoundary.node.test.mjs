import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const packagesRoot = path.join(workspaceRoot, 'packages');

const focusedUtilityExports = {
  './utils/helpers': './src/utils/helpers.ts',
  './utils/logger': './src/utils/logger.ts',
  './utils/assetIdentity': './src/utils/assetIdentity.ts',
};

const focusedUtilitySubpaths = [
  '@sdkwork/magic-studio-commons/utils/helpers',
  '@sdkwork/magic-studio-commons/utils/logger',
  '@sdkwork/magic-studio-commons/utils/assetIdentity',
];

const protectedFiles = [
  {
    file: 'packages/sdkwork-magic-studio-core/src/platform/desktop.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['logger'],
  },
  {
    file: 'packages/sdkwork-magic-studio-core/src/platform/server.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-core/src/platform/web.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-core/src/storage/runtimeMagicStudioAssets.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-browser/src/services/browserHistoryService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-browser/src/components/DownloadsPanel.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-chat/src/services/chatService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-types/entity',
    forbiddenRootSymbols: ['generateUUID', 'pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-chat/src/services/chatIdentity.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-drive/src/services/viewerBootstrap.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-drive/src/viewers/impl/CodeViewer.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-drive/src/store/driveStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-drive/src/components/DriveBreadcrumbs.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-ide-config/src/services/ideConfigService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-fs/src/providers/local.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID', 'pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/JsonAssetIndexRepository.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RuntimeAssetVfs.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-assets/src/services/generatedSelectionAssetPersistence.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: ['readAssetRecordMetadataValue'],
  },
  {
    file: 'packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: ['deriveAssetRecordClientUuid'],
  },
  {
    file: 'packages/sdkwork-magic-studio-audio/src/utils/audioInputResource.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-image/src/utils/imageInputResource.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-image/src/services/imageService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-image/src/services/imageEditorAssetPersistence.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordClientUuid',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-image/src/pages/ImageChatPage.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordClientUuid',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-video/src/utils/videoInputResource.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-voicespeaker/src/utils/voiceInputResource.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-character/src/utils/characterAvatarAsset.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-music/src/utils/musicSourceAsset.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-notes/src/utils/generatedSelectionAssetResolver.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: ['readAssetRecordMetadataValue'],
  },
  {
    file: 'packages/sdkwork-magic-studio-notes/src/utils/noteUploadedAssetAttrs.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: ['readAssetRecordMetadataValue'],
  },
  {
    file: 'packages/sdkwork-magic-studio-notes/src/components/NoteSidebar.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['logger'],
  },
  {
    file: 'packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-notifications/src/services/notificationService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID', 'pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-editor/src/services/editorService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-editor/src/store/editorStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-editor/src/components/FileExplorer.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-chatppt/src/services/presentationIdentity.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-prompt/src/store/promptOptimizerStore.ts',
    expectedSpecifier: '@sdkwork/magic-studio-types',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-audio/src/store/audioStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-image/src/store/imageStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-music/src/store/musicStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-video/src/store/videoStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-voicespeaker/src/store/voiceStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-voicespeaker/src/services/voiceService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-sfx/src/store/sfxStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-sfx/src/services/sfxHistoryService.ts',
    expectedSpecifier: '@sdkwork/magic-studio-types/entity',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-settings/src/components/AgentsSettings.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-film/src/utils/filmAssetFactories.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-film/src/utils/filmAtomicAssetAdapters.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/assetIdentity',
    forbiddenRootSymbols: [
      'deriveAssetRecordClientUuid',
      'readAssetRecordMetadataValue',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-film/src/store/filmStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: [
      'generateUUID',
      'resolveAssetRecordAssetUuid',
      'resolveAssetRecordClientUuid',
      'resolveAssetRecordId',
    ],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/utils/logger.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['createLogger', 'Logger', 'LogLevel', 'LoggerConfig'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/engine/gl/UniformBinder.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['logger'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/components/ErrorBoundary/MagicCutErrorBoundary.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['logger'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/utils/uuid.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID', 'pathUtils'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/VoiceSettingsPanel.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['generateUUID'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/components/Export/ExportModal.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['logger'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/components/SaveTemplateModal.tsx',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/logger',
    forbiddenRootSymbols: ['logger'],
  },
  {
    file: 'packages/sdkwork-magic-studio-magiccut/src/services/export/strategies/DesktopExportStrategy.ts',
    expectedSpecifier: '@sdkwork/magic-studio-commons/utils/helpers',
    forbiddenRootSymbols: ['pathUtils'],
  },
];

function collectFiles(directoryPath, predicate) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(fullPath, entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function importsSymbolFromCommonsRoot(source, symbol) {
  const rootImportPattern =
    /import\s*\{([^}]*)\}\s*from ['"]@sdkwork\/magic-studio-commons['"]/gms;
  const symbolPattern = new RegExp(
    `(^|[\\s,])(?:type\\s+)?${symbol}(?:\\s+as\\s+[A-Za-z0-9_$]+)?(?=[\\s,]|$)`
  );

  for (const match of source.matchAll(rootImportPattern)) {
    if (symbolPattern.test(match[1])) {
      return true;
    }
  }

  return false;
}

test('magic-studio-commons exposes focused utility subpaths for foundational helpers', () => {
  const commonsPackageJson = JSON.parse(
    fs.readFileSync(
      path.join(packagesRoot, 'sdkwork-magic-studio-commons', 'package.json'),
      'utf8',
    ),
  );

  for (const [exportKey, expectedPath] of Object.entries(focusedUtilityExports)) {
    assert.equal(
      commonsPackageJson.exports[exportKey]?.import,
      expectedPath,
      `Expected magic-studio-commons to expose ${exportKey} -> ${expectedPath}.`,
    );
  }
});

test('package-local tsconfig path mappings preserve focused utility subpaths when they override magic-studio-commons resolution', () => {
  const tsconfigFiles = collectFiles(
    packagesRoot,
    (_filePath, fileName) => fileName === 'tsconfig.json' || fileName === 'tsconfig.contract.json',
  );
  const offenders = [];

  for (const filePath of tsconfigFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    const overridesMagicStudioCommonsResolution =
      source.includes('"@sdkwork/magic-studio-commons"')
      || source.includes('"sdkwork-magic-studio-commons"')
      || source.includes('"@sdkwork/magic-studio-*"')
      || source.includes('"sdkwork-magic-studio-*"');

    if (!overridesMagicStudioCommonsResolution) {
      continue;
    }

    const missing = focusedUtilitySubpaths.filter((specifier) => !source.includes(`"${specifier}"`));
    if (missing.length > 0) {
      offenders.push(`${path.relative(workspaceRoot, filePath)} => ${missing.join(', ')}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Expected package-local tsconfig path mappings to preserve focused utility subpaths. Offenders: ${offenders.join('; ')}`,
  );
});

test('foundational low-level files use focused magic-studio-commons utility subpaths instead of the broad root entry', () => {
  for (const entry of protectedFiles) {
    const absolutePath = path.join(workspaceRoot, entry.file);
    const source = fs.readFileSync(absolutePath, 'utf8');

    assert.ok(
      source.includes(entry.expectedSpecifier),
      `Expected ${entry.file} to import ${entry.expectedSpecifier}.`,
    );

    for (const symbol of entry.forbiddenRootSymbols) {
      assert.equal(
        importsSymbolFromCommonsRoot(source, symbol),
        false,
        `Expected ${entry.file} to stop importing ${symbol} from @sdkwork/magic-studio-commons root.`,
      );
    }
  }
});

test('uuid utility delegates to the helpers entry so generateUUID has a single implementation authority', () => {
  const uuidSource = fs.readFileSync(
    path.join(packagesRoot, 'sdkwork-magic-studio-commons', 'src', 'utils', 'uuid.ts'),
    'utf8',
  );

  assert.match(
    uuidSource,
    /export\s*\{\s*generateUUID\s*\}\s*from ['"]\.\/helpers['"]/,
    'Expected uuid.ts to delegate generateUUID to helpers.ts.',
  );
});
