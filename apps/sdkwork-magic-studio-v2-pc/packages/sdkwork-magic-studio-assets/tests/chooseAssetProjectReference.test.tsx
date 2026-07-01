/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  detectAssetTypeByFilename: vi.fn(() => 'image'),
  resolveAcceptExtensionsByTypes: vi.fn(() => ['.png']),
  resolveDomainAssetTypes: vi.fn(() => ['image']),
  importAssetBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
  pickFiles: vi.fn(),
  initialize: vi.fn(async () => {}),
  findById: vi.fn(),
  bindReference: vi.fn(async () => null),
  registerExistingAsset: vi.fn(async () => null),
  readWorkspaceScope: vi.fn(() => ({
    workspaceId: 'ws-1',
    projectId: 'proj-1',
  })),
}));

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
  detectAssetTypeByFilename: mocks.detectAssetTypeByFilename,
  resolveAcceptExtensionsByTypes: mocks.resolveAcceptExtensionsByTypes,
  resolveDomainAssetTypes: mocks.resolveDomainAssetTypes,
}));

vi.mock('../src/asset-center/application/assetUrlResolver', () => ({
  resolveAssetUrlByAssetIdFirst: vi.fn(async () => null),
}));

vi.mock('../src/services/assetBusinessService', () => ({
  assetBusinessService: {
    importAssetBySdk: mocks.importAssetBySdk,
    resolveAssetPrimaryUrlBySdk: mocks.resolveAssetPrimaryUrlBySdk,
  },
}));

vi.mock('@sdkwork/magic-studio-core/services', () => ({
  uploadHelper: {
    pickFiles: mocks.pickFiles,
  },
}));

vi.mock('../src/asset-center', () => ({
  assetCenterService: {
    initialize: mocks.initialize,
    findById: mocks.findById,
    bindReference: mocks.bindReference,
    registerExistingAsset: mocks.registerExistingAsset,
  },
  isManagedAssetLocator: (value: string) => value.startsWith('assets://'),
  isExplicitLocalAssetLocator: (value: string) =>
    value.startsWith('file://') || value.startsWith('desktop://'),
  isDesktopAssetLocator: (value: string) => value.startsWith('desktop://'),
  stripExplicitLocalAssetLocatorProtocol: (value: string) =>
    value.startsWith('file://')
      ? value.slice('file://'.length)
      : value.startsWith('desktop://')
        ? value.slice('desktop://'.length)
        : value,
  readWorkspaceScope: mocks.readWorkspaceScope,
}));

import { ChooseAsset } from '../src/components/ChooseAsset';

describe('ChooseAsset project-level persisted reference', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;

    const importedAsset = {
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      name: 'subject.png',
      type: 'image',
      path: 'assets://uploads/subject.png',
      size: 3,
      origin: 'upload',
      metadata: {
        assetUuid: 'asset-uuid-1',
      },
    };

    mocks.detectAssetTypeByFilename.mockReset();
    mocks.detectAssetTypeByFilename.mockReturnValue('image');
    mocks.resolveAcceptExtensionsByTypes.mockReset();
    mocks.resolveAcceptExtensionsByTypes.mockReturnValue(['.png']);
    mocks.resolveDomainAssetTypes.mockReset();
    mocks.resolveDomainAssetTypes.mockReturnValue(['image']);
    mocks.importAssetBySdk.mockReset();
    mocks.importAssetBySdk.mockResolvedValue(importedAsset);
    mocks.resolveAssetPrimaryUrlBySdk.mockReset();
    mocks.resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/subject.png');
    mocks.pickFiles.mockReset();
    mocks.pickFiles.mockResolvedValue([
      {
        name: 'subject.png',
        data: new Uint8Array([1, 2, 3]),
      },
    ]);
    mocks.initialize.mockClear();
    mocks.initialize.mockResolvedValue(undefined);
    mocks.findById.mockReset();
    mocks.findById.mockResolvedValue(null);
    mocks.bindReference.mockReset();
    mocks.bindReference.mockResolvedValue(null);
    mocks.registerExistingAsset.mockReset();
    mocks.registerExistingAsset.mockResolvedValue(null);
    mocks.readWorkspaceScope.mockReset();
    mocks.readWorkspaceScope.mockReturnValue({
      workspaceId: 'ws-1',
      projectId: 'proj-1',
    });
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
  });

  it('registers a project-level persisted reference after a local upload when the asset is not yet indexed', async () => {
    const onChange = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <ChooseAsset
          value={null}
          onChange={onChange}
          accepts={['image']}
          domain="video-studio"
          projectReference={{
            slot: 'subject-reference',
            metadata: {
              source: 'subject-reference-section',
            },
          }}
        />
      );
    });

    const uploadButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Upload local file')
    );
    expect(uploadButton).toBeTruthy();

    await act(async () => {
      uploadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'asset-db-1',
        name: 'subject.png',
      })
    );
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.findById).toHaveBeenCalledWith('asset-db-1');
    expect(mocks.bindReference).not.toHaveBeenCalled();
    expect(mocks.registerExistingAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: {
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          domain: 'video-studio',
        },
        type: 'image',
        name: 'subject.png',
        assetId: 'asset-db-1',
        locator: {
          protocol: 'assets',
          uri: 'assets://uploads/subject.png',
          url: 'https://cdn.example.com/subject.png',
        },
        metadata: expect.objectContaining({
          assetUuid: 'asset-uuid-1',
          source: 'subject-reference-section',
        }),
        references: [
          {
            domain: 'video-studio',
            entityType: 'project',
            entityId: 'proj-1',
            relation: 'reference',
            slot: 'subject-reference',
            metadata: {
              source: 'subject-reference-section',
            },
          },
        ],
        status: 'imported',
        size: 3,
      })
    );
  });

  it('binds a project-level persisted reference after a local upload when the asset already exists in asset center', async () => {
    mocks.findById.mockResolvedValue({
      assetId: 'asset-db-1',
    });

    await act(async () => {
      root = createRoot(container);
      root.render(
        <ChooseAsset
          value={null}
          onChange={() => {}}
          accepts={['image']}
          domain="video-studio"
          projectReference={{
            slot: 'subject-reference',
            metadata: {
              source: 'subject-reference-section',
            },
          }}
        />
      );
    });

    const uploadButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Upload local file')
    );
    expect(uploadButton).toBeTruthy();

    await act(async () => {
      uploadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.registerExistingAsset).not.toHaveBeenCalled();
    expect(mocks.bindReference).toHaveBeenCalledWith('asset-db-1', {
      domain: 'video-studio',
      entityType: 'project',
      entityId: 'proj-1',
      relation: 'reference',
      slot: 'subject-reference',
      metadata: {
        source: 'subject-reference-section',
      },
    });
  });
});
