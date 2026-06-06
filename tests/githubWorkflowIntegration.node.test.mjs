import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const packageWorkflowPath = path.resolve(workspaceRoot, '.github/workflows/package.yml');
const legacyWorkflowPath = path.resolve(workspaceRoot, '.github/workflows/release.yml');
const workflowConfigPath = path.resolve(workspaceRoot, 'sdkwork.workflow.json');

test('magic-studio packaging delegates to the SDKWork reusable workflow', () => {
  const workflowSource = fs.readFileSync(packageWorkflowPath, 'utf8');
  const workflowConfig = JSON.parse(fs.readFileSync(workflowConfigPath, 'utf8'));
  const targetIds = workflowConfig.targets.map((target) => target.id);

  assert.equal(fs.existsSync(legacyWorkflowPath), false);
  assert.match(
    workflowSource,
    /uses:\s+Sdkwork-Cloud\/sdkwork-github-workflow\/\.github\/workflows\/sdkwork-package\.yml@b0829529b9277a3da32b90c2d36ff34ff09fa832/,
  );
  assert.match(workflowSource, /config_path:\s+sdkwork\.workflow\.json/);
  assert.match(
    workflowSource,
    /package_version:\s+\$\{\{\s*github\.event\.inputs\.package_version\s+\|\|\s+''\s*\}\}/,
  );

  assert.equal(workflowConfig.app.id, 'magic-studio-v2');
  assert.equal(workflowConfig.app.sourcePath, '.');
  assert.equal(workflowConfig.release.changelog.source, 'auto');
  assert.deepEqual(targetIds, [
    'linux-debian-x64-desktop-deb',
    'linux-x64-desktop-appimage',
    'windows-x64-desktop-exe',
    'macos-arm64-desktop-dmg',
    'macos-x64-desktop-dmg',
  ]);
});
