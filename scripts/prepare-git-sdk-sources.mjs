import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  GIT_APP_SDK_CHECKOUT,
  GIT_APP_SDK_ENTRY,
  GIT_SDK_COMMON_CHECKOUT,
  GIT_SDK_COMMON_ENTRY,
  GIT_SDK_ROOT,
} from './sdk-mode.mjs';

const SDK_SOURCES = [
  {
    name: 'app-sdk',
    checkoutDir: GIT_APP_SDK_CHECKOUT,
    entry: GIT_APP_SDK_ENTRY,
    url:
      process.env.MAGIC_STUDIO_APP_SDK_GIT_URL ??
      'https://github.com/Sdkwork-Cloud/sdkwork-sdk-app.git',
    ref: process.env.MAGIC_STUDIO_APP_SDK_GIT_REF ?? 'main',
  },
  {
    name: 'sdk-common',
    checkoutDir: GIT_SDK_COMMON_CHECKOUT,
    entry: GIT_SDK_COMMON_ENTRY,
    url:
      process.env.MAGIC_STUDIO_SDK_COMMON_GIT_URL ??
      'https://github.com/Sdkwork-Cloud/sdkwork-sdk-commons.git',
    ref: process.env.MAGIC_STUDIO_SDK_COMMON_GIT_REF ?? 'main',
  },
];

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readGitOutput(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

function syncCheckout(source) {
  const gitDir = path.join(source.checkoutDir, '.git');

  if (!fs.existsSync(gitDir)) {
    fs.rmSync(source.checkoutDir, { recursive: true, force: true });
    runGit(
      ['clone', '--depth', '1', '--branch', source.ref, source.url, source.checkoutDir],
      GIT_SDK_ROOT
    );
  } else {
    runGit(['remote', 'set-url', 'origin', source.url], source.checkoutDir);
    runGit(['fetch', '--depth', '1', 'origin', source.ref], source.checkoutDir);
    runGit(['reset', '--hard', 'FETCH_HEAD'], source.checkoutDir);
    runGit(['clean', '-fdx'], source.checkoutDir);
  }

  if (!fs.existsSync(source.entry)) {
    throw new Error(`SDK source entry not found for ${source.name}: ${source.entry}`);
  }

  const revision = readGitOutput(['rev-parse', '--short', 'HEAD'], source.checkoutDir);
  console.log(`[sdk:git] ${source.name} => ${revision} (${source.url}#${source.ref})`);
}

fs.mkdirSync(GIT_SDK_ROOT, { recursive: true });

for (const source of SDK_SOURCES) {
  syncCheckout(source);
}
