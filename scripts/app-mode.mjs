const APP_MODE_ALIASES = {
  dev: 'development',
  development: 'development',
  prod: 'production',
  production: 'production',
  stage: 'staging',
  staging: 'staging',
  test: 'test',
};

const SUPPORTED_APP_MODES = new Set(Object.values(APP_MODE_ALIASES));

export function normalizeAppMode(value, fallback = 'development') {
  const normalized = String(value ?? '').trim().toLowerCase();
  const resolved = APP_MODE_ALIASES[normalized] ?? normalized;

  if (!resolved) {
    return fallback;
  }

  if (!SUPPORTED_APP_MODES.has(resolved)) {
    throw new Error(`Unsupported MAGIC_STUDIO_VITE_MODE: ${value}`);
  }

  return resolved;
}

export function resolveAppMode({ command = 'dev', requestedMode = process.env.MAGIC_STUDIO_VITE_MODE } = {}) {
  const fallback = command === 'build' ? 'production' : 'development';
  return normalizeAppMode(requestedMode, fallback);
}
