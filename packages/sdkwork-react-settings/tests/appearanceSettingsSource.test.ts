import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const resolveFromRoot = (relativePath: string) => path.resolve(process.cwd(), relativePath);

describe('appearance settings source guards', () => {
  it('ships a dedicated appearance settings component for density controls', () => {
    const componentPath = resolveFromRoot(
      'packages/sdkwork-react-settings/src/components/AppearanceSettings.tsx',
    );

    expect(existsSync(componentPath)).toBe(true);

    const source = readFileSync(componentPath, 'utf8');
    expect(source).toContain('densityMode');
    expect(source).toContain('Re-recommend');
    expect(source).toContain('applyAppearanceDensityMode');
    expect(source).toContain('applyManualAppearanceMetrics');
  });

  it('routes the appearance tab through the dedicated appearance settings component', () => {
    const pagePath = resolveFromRoot('packages/sdkwork-react-settings/src/pages/SettingsPage.tsx');
    const source = readFileSync(pagePath, 'utf8');

    expect(source).toContain('AppearanceSettings');
    expect(source).toContain("if (activeTab === 'appearance') return <AppearanceSettings />;");
  });
});
