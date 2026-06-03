import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getStableEnvDefaults } from './envDefaults';

const appRoot = path.resolve(__dirname, '..', '..');

describe('env defaults parity', () => {
  it('keeps UI-affecting defaults stable across runtime modes', () => {
    const development = getStableEnvDefaults('development');
    const test = getStableEnvDefaults('test');
    const staging = getStableEnvDefaults('staging');
    const production = getStableEnvDefaults('production');

    expect(test).toEqual(development);
    expect(staging).toEqual(development);
    expect(production).toEqual(development);
    expect(development).toEqual({
      debug: false,
      logLevel: 'warn',
      features: {
        analytics: false,
        notifications: true,
        websocket: true,
        cache: false,
      },
    });
  });

  it('requires each shipped env file to declare UI-affecting flags explicitly', () => {
    const requiredKeys = [
      'VITE_DEBUG=',
      'VITE_LOG_LEVEL=',
      'VITE_FEATURE_ANALYTICS=',
      'VITE_FEATURE_NOTIFICATIONS=',
      'VITE_FEATURE_WEBSOCKET=',
      'VITE_FEATURE_CACHE=',
    ];
    const envFiles = ['.env.development', '.env.test', '.env.staging', '.env.production'];

    for (const envFile of envFiles) {
      const source = fs.readFileSync(path.join(appRoot, envFile), 'utf8');

      for (const requiredKey of requiredKeys) {
        expect(source, `${envFile} must declare ${requiredKey}`).toContain(requiredKey);
      }
    }
  });
});
