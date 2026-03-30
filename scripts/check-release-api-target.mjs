import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROD_API_BASE_URL = 'https://api.sdkwork.com';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export function parseDotEnv(content) {
  const result = {};

  for (const line of String(content ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    result[key] = value;
  }

  return result;
}

function hasProductionMode(script) {
  return typeof script === 'string' && /MAGIC_STUDIO_VITE_MODE=production/.test(script);
}

function hasGitSdk(script) {
  return typeof script === 'string' && /MAGIC_STUDIO_SDK_MODE=git/.test(script);
}

export function analyzeReleaseApiTarget({ packageJson, envProduction, tauriProdConfig }) {
  const errors = [];
  const scripts = packageJson?.scripts ?? {};
  const expectedEnvKeys = [
    'VITE_API_BASE_URL',
    'VITE_APP_API_BASE_URL',
    'SDKWORK_API_BASE_URL',
  ];

  for (const key of expectedEnvKeys) {
    if (envProduction?.[key] !== PROD_API_BASE_URL) {
      errors.push(`.env.production ${key} must be ${PROD_API_BASE_URL}`);
    }
  }

  if (!hasProductionMode(scripts.build)) {
    errors.push('package.json script "build" must set MAGIC_STUDIO_VITE_MODE=production');
  }

  if (!hasProductionMode(scripts['build:git-sdk'])) {
    errors.push(
      'package.json script "build:git-sdk" must set MAGIC_STUDIO_VITE_MODE=production'
    );
  }

  if (!hasGitSdk(scripts['build:git-sdk'])) {
    errors.push('package.json script "build:git-sdk" must set MAGIC_STUDIO_SDK_MODE=git');
  }

  if (tauriProdConfig?.build?.beforeBuildCommand !== 'pnpm run build:git-sdk') {
    errors.push(
      'src-tauri/tauri.prod.conf.json beforeBuildCommand must call "pnpm run build:git-sdk"'
    );
  }

  for (const scriptName of ['tauri:build', 'tauri:bundle']) {
    const script = scripts[scriptName];
    if (!hasGitSdk(script)) {
      errors.push(`package.json script "${scriptName}" must set MAGIC_STUDIO_SDK_MODE=git`);
    }
    if (typeof script !== 'string' || !script.includes('src-tauri/tauri.prod.conf.json')) {
      errors.push(
        `package.json script "${scriptName}" must use src-tauri/tauri.prod.conf.json`
      );
    }
  }

  return { errors };
}

export function analyzeBuiltBundle(content) {
  const source = String(content ?? '');
  const errors = [];

  if (!source.includes('MODE:"production"') && !source.includes("MODE:'production'")) {
    errors.push('Built bundle MODE must be "production"');
  }

  if (!source.includes(`VITE_API_BASE_URL:"${PROD_API_BASE_URL}"`)) {
    errors.push(`Built bundle VITE_API_BASE_URL must be ${PROD_API_BASE_URL}`);
  }

  if (!source.includes('VITE_APP_ENV:"production"') && !source.includes("VITE_APP_ENV:'production'")) {
    errors.push('Built bundle VITE_APP_ENV must be "production"');
  }

  return { errors };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readLatestBuiltBundle(distAssetsDir) {
  if (!fs.existsSync(distAssetsDir)) {
    return null;
  }

  const candidates = fs
    .readdirSync(distAssetsDir)
    .filter(name => name.endsWith('.js'))
    .map(name => {
      const absolutePath = path.join(distAssetsDir, name);
      return {
        absolutePath,
        modifiedAt: fs.statSync(absolutePath).mtimeMs,
      };
    })
    .sort((left, right) => right.modifiedAt - left.modifiedAt);

  for (const candidate of candidates) {
    const content = fs.readFileSync(candidate.absolutePath, 'utf8');
    if (content.includes('VITE_API_BASE_URL')) {
      return {
        path: candidate.absolutePath,
        content,
      };
    }
  }

  return null;
}

export function verifyReleaseApiTarget({
  repoDir = repoRoot,
  distDir = path.join(repoRoot, 'dist'),
} = {}) {
  const envProduction = parseDotEnv(
    fs.readFileSync(path.join(repoDir, '.env.production'), 'utf8')
  );
  const packageJson = readJson(path.join(repoDir, 'package.json'));
  const tauriProdConfig = readJson(path.join(repoDir, 'src-tauri', 'tauri.prod.conf.json'));

  const releaseConfigResult = analyzeReleaseApiTarget({
    packageJson,
    envProduction,
    tauriProdConfig,
  });

  const bundle = readLatestBuiltBundle(path.join(distDir, 'assets'));
  const bundleResult = bundle ? analyzeBuiltBundle(bundle.content) : { errors: [] };

  return {
    errors: [...releaseConfigResult.errors, ...bundleResult.errors],
    bundlePath: bundle?.path ?? null,
  };
}

function main() {
  const result = verifyReleaseApiTarget();

  if (result.errors.length > 0) {
    console.error('[release-api-target] verification failed');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`[release-api-target] verified ${PROD_API_BASE_URL}`);
  if (result.bundlePath) {
    console.log(`[release-api-target] bundle checked: ${path.relative(repoRoot, result.bundlePath)}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
