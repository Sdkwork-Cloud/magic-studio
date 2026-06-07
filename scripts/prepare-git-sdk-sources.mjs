import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  GIT_APPBASE_CHECKOUT,
  GIT_APPBASE_PC_REACT_ENTRY,
  GIT_AUTH_PC_REACT_ENTRY,
  GIT_CORE_PC_REACT_ENTRY,
  GIT_SEARCH_CHECKOUT,
  GIT_SDK_COMMON_CHECKOUT,
  GIT_SDK_COMMON_ENTRY,
  GIT_SDK_ROOT,
  GIT_SEARCH_PC_REACT_ENTRY,
  GIT_CORE_CHECKOUT,
  GIT_UI_CHECKOUT,
  GIT_UI_PC_REACT_ENTRY,
  GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
  GIT_USER_CENTER_PC_REACT_ENTRY,
  GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  GIT_USER_PC_REACT_ENTRY,
} from './sdk-mode.mjs';

const SDK_SOURCES = [
  {
    name: 'sdkwork-core',
    checkoutDir: GIT_CORE_CHECKOUT,
    entries: [GIT_CORE_PC_REACT_ENTRY],
    sparsePaths: ['sdkwork-core-pc-react'],
    url:
      process.env.MAGIC_STUDIO_SDKWORK_CORE_GIT_URL ??
      'git@github.com:Sdkwork-Cloud/sdkwork-core.git',
    ref: process.env.MAGIC_STUDIO_SDKWORK_CORE_GIT_REF ?? 'main',
  },
  {
    name: 'sdk-common',
    checkoutDir: GIT_SDK_COMMON_CHECKOUT,
    entries: [GIT_SDK_COMMON_ENTRY],
    sparsePaths: ['sdkwork-sdk-common-typescript'],
    url:
      process.env.MAGIC_STUDIO_SDK_COMMON_GIT_URL ??
      'git@github.com:Sdkwork-Cloud/sdkwork-sdk-commons.git',
    ref: process.env.MAGIC_STUDIO_SDK_COMMON_GIT_REF ?? 'main',
  },
  {
    name: 'sdkwork-ui',
    checkoutDir: GIT_UI_CHECKOUT,
    entries: [GIT_UI_PC_REACT_ENTRY],
    sparsePaths: ['sdkwork-ui-pc-react'],
    url:
      process.env.MAGIC_STUDIO_SDKWORK_UI_GIT_URL ??
      'git@github.com:Sdkwork-Cloud/sdkwork-ui.git',
    ref: process.env.MAGIC_STUDIO_SDKWORK_UI_GIT_REF ?? 'main',
  },
  {
    name: 'sdkwork-appbase',
    checkoutDir: GIT_APPBASE_CHECKOUT,
    entries: [
      GIT_APPBASE_PC_REACT_ENTRY,
      GIT_AUTH_PC_REACT_ENTRY,
      GIT_USER_PC_REACT_ENTRY,
      GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
      GIT_USER_CENTER_PC_REACT_ENTRY,
      GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
    ],
    sparsePaths: [
      'packages/pc-react/foundation/sdkwork-appbase-pc-react',
      'packages/pc-react/iam/sdkwork-auth-pc-react',
      'packages/pc-react/iam/sdkwork-user-pc-react',
      'packages/pc-react/iam/sdkwork-user-center-core-pc-react',
      'packages/pc-react/iam/sdkwork-user-center-pc-react',
      'packages/pc-react/iam/sdkwork-user-center-validation-pc-react',
    ],
    url:
      process.env.MAGIC_STUDIO_SDKWORK_APPBASE_GIT_URL ??
      'git@github.com:Sdkwork-Cloud/sdkwork-appbase.git',
    ref: process.env.MAGIC_STUDIO_SDKWORK_APPBASE_GIT_REF ?? 'main',
  },
  {
    name: 'sdkwork-search',
    checkoutDir: GIT_SEARCH_CHECKOUT,
    entries: [GIT_SEARCH_PC_REACT_ENTRY],
    sparsePaths: ['packages/pc-react/foundation/sdkwork-search-pc-react'],
    url:
      process.env.MAGIC_STUDIO_SDKWORK_SEARCH_GIT_URL ??
      'git@github.com:Sdkwork-Cloud/sdkwork-search.git',
    ref: process.env.MAGIC_STUDIO_SDKWORK_SEARCH_GIT_REF ?? 'main',
  },
];

const shouldRefresh = /^(1|true|yes)$/i.test(
  (process.env.MAGIC_STUDIO_GIT_SDK_REFRESH ?? '').trim()
);

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

function hasAllEntries(source) {
  return source.entries.every((entry) => fs.existsSync(entry));
}

function configureSparseCheckout(source) {
  if (!Array.isArray(source.sparsePaths) || source.sparsePaths.length === 0) {
    return;
  }

  runGit(['sparse-checkout', 'init', '--cone'], source.checkoutDir);
  runGit(['sparse-checkout', 'set', '--skip-checks', ...source.sparsePaths], source.checkoutDir);
}

function syncSubmodules(source) {
  if (!Array.isArray(source.submodulePaths) || source.submodulePaths.length === 0) {
    return;
  }

  runGit(['submodule', 'sync', '--', ...source.submodulePaths], source.checkoutDir);
  runGit(
    ['submodule', 'update', '--init', '--depth', '1', '--', ...source.submodulePaths],
    source.checkoutDir
  );
}

function cloneCheckout(source) {
  fs.rmSync(source.checkoutDir, { recursive: true, force: true });
  runGit(
    [
      'clone',
      '--depth',
      '1',
      '--filter',
      'blob:none',
      '--branch',
      source.ref,
      '--sparse',
      source.url,
      source.checkoutDir,
    ],
    GIT_SDK_ROOT
  );
  configureSparseCheckout(source);
  syncSubmodules(source);
}

function refreshCheckout(source) {
  if (shouldRefresh) {
    runGit(['remote', 'set-url', 'origin', source.url], source.checkoutDir);
    runGit(['fetch', '--depth', '1', 'origin', source.ref], source.checkoutDir);
    runGit(['reset', '--hard', 'FETCH_HEAD'], source.checkoutDir);
    runGit(['clean', '-fdx'], source.checkoutDir);
    configureSparseCheckout(source);
    syncSubmodules(source);
  }
}

function syncCheckout(source) {
  const gitDir = path.join(source.checkoutDir, '.git');
  const hasGitCheckout = fs.existsSync(gitDir);
  const hasEntry = hasAllEntries(source);

  if (hasGitCheckout && !shouldRefresh && hasEntry) {
    console.log(
      `[sdk:git] ${source.name} => reuse existing checkout (${source.checkoutDir})`
    );
    return;
  }

  if (!hasGitCheckout || !hasEntry) {
    cloneCheckout(source);
  } else if (shouldRefresh) {
    refreshCheckout(source);
  }

  if (!hasAllEntries(source)) {
    throw new Error(
      `SDK source entries not found for ${source.name}:\n${source.entries
        .filter((entry) => !fs.existsSync(entry))
        .join('\n')}`
    );
  }

  const revision = readGitOutput(['rev-parse', '--short', 'HEAD'], source.checkoutDir);
  console.log(`[sdk:git] ${source.name} => ${revision} (${source.url}#${source.ref})`);
}

fs.mkdirSync(GIT_SDK_ROOT, { recursive: true });

for (const source of SDK_SOURCES) {
  syncCheckout(source);
}
