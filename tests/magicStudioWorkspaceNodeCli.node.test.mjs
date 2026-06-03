import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { resolveWorkspacePackageBinPath } from '../scripts/run-workspace-node-cli.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, '..');

function withTempWorkspace(callback) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'magic-studio-workspace-cli-'));

  try {
    callback(workspaceRoot);
  } finally {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  }
}

function writeText(targetPath, source) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, source, 'utf8');
}

function writeJson(targetPath, value) {
  writeText(targetPath, JSON.stringify(value, null, 2));
}

test('run-workspace-node-cli resolves keyed package bin entries from workspace-local metadata', () => {
  withTempWorkspace((workspaceRoot) => {
    writeJson(path.join(workspaceRoot, 'package.json'), {
      name: 'magic-studio-test',
      version: '0.0.0',
    });
    writeJson(path.join(workspaceRoot, 'node_modules', 'vite', 'package.json'), {
      name: 'vite',
      version: '8.0.3',
      bin: {
        vite: './bin/vite.js',
      },
    });
    writeText(path.join(workspaceRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '');

    assert.equal(
      resolveWorkspacePackageBinPath({
        workspaceRoot,
        packageName: 'vite',
        binName: 'vite',
      }),
      path.join(workspaceRoot, 'node_modules', 'vite', 'bin', 'vite.js'),
    );
  });
});

test('run-workspace-node-cli resolves string package bin entries from workspace-local metadata', () => {
  withTempWorkspace((workspaceRoot) => {
    writeJson(path.join(workspaceRoot, 'package.json'), {
      name: 'magic-studio-test',
      version: '0.0.0',
    });
    writeJson(path.join(workspaceRoot, 'node_modules', 'typescript', 'package.json'), {
      name: 'typescript',
      version: '6.0.2',
      bin: './bin/tsc',
    });
    writeText(path.join(workspaceRoot, 'node_modules', 'typescript', 'bin', 'tsc'), '');

    assert.equal(
      resolveWorkspacePackageBinPath({
        workspaceRoot,
        packageName: 'typescript',
      }),
      path.join(workspaceRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    );
  });
});

test('run-workspace-node-cli surfaces a clear error when a requested bin is not declared', () => {
  withTempWorkspace((workspaceRoot) => {
    writeJson(path.join(workspaceRoot, 'package.json'), {
      name: 'magic-studio-test',
      version: '0.0.0',
    });
    writeJson(path.join(workspaceRoot, 'node_modules', '@tauri-apps', 'cli', 'package.json'), {
      name: '@tauri-apps/cli',
      version: '2.10.1',
      bin: {
        tauri: './tauri.js',
      },
    });
    writeText(path.join(workspaceRoot, 'node_modules', '@tauri-apps', 'cli', 'tauri.js'), '');

    assert.throws(
      () =>
        resolveWorkspacePackageBinPath({
          workspaceRoot,
          packageName: '@tauri-apps/cli',
          binName: 'missing-bin',
        }),
      /Expected @tauri-apps\/cli package to declare a "missing-bin" bin entry/,
    );
  });
});

test('run-workspace-node-cli executes the requested workspace package bin when invoked as a script', () => {
  withTempWorkspace((workspaceRoot) => {
    const outputPath = path.join(workspaceRoot, 'bin-output.json');
    writeJson(path.join(workspaceRoot, 'package.json'), {
      name: 'magic-studio-test',
      version: '0.0.0',
    });
    writeJson(path.join(workspaceRoot, 'node_modules', 'fixture-cli', 'package.json'), {
      name: 'fixture-cli',
      version: '0.0.0',
      bin: {
        fixture: './bin/fixture.js',
      },
    });
    writeText(
      path.join(workspaceRoot, 'node_modules', 'fixture-cli', 'bin', 'fixture.js'),
      [
        "const fs = require('node:fs');",
        "fs.writeFileSync(process.env.FIXTURE_OUTPUT, JSON.stringify({",
        '  cwd: process.cwd(),',
        '  argv: process.argv.slice(2),',
        '}));',
      ].join('\n'),
    );

    const result = spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts', 'run-workspace-node-cli.mjs'),
        '--workspace-root',
        workspaceRoot,
        '--package',
        'fixture-cli',
        '--bin',
        'fixture',
        '--',
        '--marker',
        'value',
      ],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          FIXTURE_OUTPUT: outputPath,
        },
        stdio: 'inherit',
      },
    );

    assert.ifError(result.error);
    assert.equal(result.status, 0);
    assert.ok(
      fs.existsSync(outputPath),
      'Expected run-workspace-node-cli to execute the package bin instead of exiting without work.',
    );

    const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.equal(output.cwd, workspaceRoot);
    assert.deepEqual(output.argv, ['--marker', 'value']);
  });
});
