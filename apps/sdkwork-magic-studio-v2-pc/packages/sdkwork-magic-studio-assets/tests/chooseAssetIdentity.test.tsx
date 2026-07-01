import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/components/ChooseAssetModal', () => ({
  ChooseAssetModal: () => null,
}));

vi.mock('../src/hooks/useAssetUrl', () => ({
  useAssetUrl: () => ({
    url: null,
    loading: false,
    error: null,
  }),
}));

vi.mock('../src/asset-center/domain/assetCategory.domain', () => ({
  detectAssetTypeByFilename: vi.fn(),
  resolveAcceptExtensionsByTypes: vi.fn(() => []),
  resolveDomainAssetTypes: vi.fn(() => ['image']),
}));

vi.mock('../src/asset-center/application/assetUrlResolver', () => ({
  resolveAssetUrlByAssetIdFirst: vi.fn(async () => null),
}));

vi.mock('../src/services/assetBusinessService', () => ({
  assetBusinessService: {
    importAssetBySdk: vi.fn(),
    resolveAssetPrimaryUrlBySdk: vi.fn(async () => null),
  },
}));

vi.mock('../src/asset-center', () => ({
  assetCenterService: {
    initialize: vi.fn(async () => {}),
    findById: vi.fn(async () => null),
    bindReference: vi.fn(async () => null),
    registerExistingAsset: vi.fn(async () => null),
  },
  readWorkspaceScope: vi.fn(() => ({
    workspaceId: 'ws-1',
    projectId: 'proj-1',
  })),
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  uploadHelper: {
    pickFiles: vi.fn(),
  },
}));

import { ChooseAsset } from '../src/components/ChooseAsset';

describe('ChooseAsset identity handling', () => {
  it('does not treat an asset entity id as a preview src when no renderable path exists', () => {
    const html = renderToStaticMarkup(
      <ChooseAsset
        value={
          {
            id: 'asset-db-1',
            uuid: 'asset-uuid-1',
            name: 'Selected Image',
            type: 'image',
            size: 0,
            origin: 'ai',
            metadata: {},
          } as any
        }
        onChange={() => {}}
      />
    );

    expect(html).not.toContain('src="asset-db-1"');
  });
});
