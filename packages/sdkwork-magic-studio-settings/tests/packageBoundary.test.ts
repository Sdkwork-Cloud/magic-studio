import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(__dirname, '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(packageRoot, relativePath), 'utf8');

describe('magic-studio-settings package boundaries', () => {
  it('keeps AgentsSettings independent from magic-studio-assets generation components', () => {
    const source = readFile('src/components/AgentsSettings.tsx');

    expect(source).not.toContain("from '@sdkwork/magic-studio-assets'");
    expect(source).not.toContain('createPromptTextInputCapabilityProps');
  });

  it('does not declare a reverse workspace dependency on magic-studio-assets', () => {
    const packageJson = JSON.parse(readFile('package.json')) as {
      dependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies).not.toHaveProperty('@sdkwork/magic-studio-assets');
  });
});
