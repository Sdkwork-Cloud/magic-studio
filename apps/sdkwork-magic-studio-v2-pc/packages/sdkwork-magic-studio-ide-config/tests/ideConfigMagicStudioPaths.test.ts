import { describe, expect, it } from 'vitest';

import { IDE_AND_TOOLS_CONFIG } from '../src/constants';

const findDefinition = (id: string) => {
  const definition = IDE_AND_TOOLS_CONFIG.definitions.find((item) => item.id === id);
  expect(definition).toBeDefined();
  return definition!;
};

describe('IDE config MagicStudio paths', () => {
  it('stores skill manager assets under the MagicStudio integrations directory', () => {
    const definition = findDefinition('skill-manager');

    expect(definition.platforms.macos.install).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/skills'
    );
    expect(definition.platforms.macos.config).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/skills/registry.json'
    );
    expect(definition.platforms.windows.install).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/skills'
    );
    expect(definition.platforms.windows.config).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/skills/registry.json'
    );
  });

  it('stores mcp and plugin manager assets under MagicStudio system integrations roots', () => {
    const mcp = findDefinition('mcp-manager');
    const plugin = findDefinition('plugin-manager');

    expect(mcp.platforms.linux.install).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/mcp'
    );
    expect(mcp.platforms.linux.config).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/mcp/settings.json'
    );
    expect(plugin.platforms.linux.install).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/plugins'
    );
    expect(plugin.platforms.linux.config).toBe(
      '${MAGICSTUDIO_ROOT}/system/integrations/plugins/registry.json'
    );
  });

  it('keeps global integration definitions anchored under the MagicStudio root variable', () => {
    const requiredRootPrefix = '${MAGICSTUDIO_ROOT}/system/integrations/';
    const managedDefinitions = ['skill-manager', 'mcp-manager', 'plugin-manager'];

    for (const definitionId of managedDefinitions) {
      const definition = findDefinition(definitionId);
      for (const platformConfig of Object.values(definition.platforms)) {
        expect(platformConfig.install || '').toContain(requiredRootPrefix);
        expect(platformConfig.config || '').toContain(requiredRootPrefix);
      }
    }
  });
});
