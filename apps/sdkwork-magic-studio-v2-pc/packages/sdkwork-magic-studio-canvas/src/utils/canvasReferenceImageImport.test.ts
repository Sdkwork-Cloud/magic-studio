import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
} = vi.hoisted(() => ({
  importAssetBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
}));

const {
  assetCenterInitialize,
  assetCenterFindById,
  assetCenterRegisterExistingAsset,
  assetCenterBindReference,
  readWorkspaceScope,
} = vi.hoisted(() => ({
  assetCenterInitialize: vi.fn(),
  assetCenterFindById: vi.fn(),
  assetCenterRegisterExistingAsset: vi.fn(),
  assetCenterBindReference: vi.fn(),
  readWorkspaceScope: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  readWorkspaceScope,
  assetCenterService: {
    initialize: assetCenterInitialize,
    findById: assetCenterFindById,
    registerExistingAsset: assetCenterRegisterExistingAsset,
    bindReference: assetCenterBindReference,
  },
}));

import { importCanvasReferenceImageFile } from './canvasReferenceImageImport';

describe('importCanvasReferenceImageFile', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    assetCenterInitialize.mockReset();
    assetCenterFindById.mockReset();
    assetCenterRegisterExistingAsset.mockReset();
    assetCenterBindReference.mockReset();
    readWorkspaceScope.mockReset();
    readWorkspaceScope.mockReturnValue({
      workspaceId: 'workspace-canvas-1',
      projectId: 'workspace-project-canvas-1',
    });
  });

  it('uploads local reference images through the asset sdk and returns a persistent url', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'canvas-ref-1',
      uuid: 'canvas-ref-asset-uuid-1',
      path: 'https://storage.example.com/raw-ref.png',
      metadata: {
        assetUuid: 'canvas-ref-asset-uuid-1',
        primaryResourceId: 'canvas-ref-resource-db-1',
        primaryResourceUuid: 'canvas-ref-resource-uuid-1',
        resourceViewId: 'canvas-ref-view-db-1',
        resourceViewUuid: 'canvas-ref-view-uuid-1',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/canvas-ref.png');

    await expect(
      importCanvasReferenceImageFile({
        name: 'reference.png',
        data: new Uint8Array([9, 8, 7]),
      })
    ).resolves.toMatchObject({
      id: 'canvas-ref-1',
      uuid: 'canvas-ref-view-uuid-1',
      assetId: 'canvas-ref-1',
      assetUuid: 'canvas-ref-asset-uuid-1',
      primaryResourceId: 'canvas-ref-resource-db-1',
      primaryResourceUuid: 'canvas-ref-resource-uuid-1',
      resourceViewId: 'canvas-ref-view-db-1',
      resourceViewUuid: 'canvas-ref-view-uuid-1',
      type: 'image',
      url: 'https://cdn.example.com/canvas-ref.png',
      path: 'https://cdn.example.com/canvas-ref.png',
      name: 'reference.png',
    });

    expect(importAssetBySdk).toHaveBeenCalledWith(
      {
        name: 'reference.png',
        data: new Uint8Array([9, 8, 7]),
      },
      'image',
      { domain: 'canvas' }
    );
  });

  it('registers project-level persisted references for uploaded canvas reference images that are not yet indexed', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'canvas-ref-register-1',
      uuid: 'canvas-ref-register-asset-uuid-1',
      path: 'https://storage.example.com/raw-reference-register.png',
      size: 2048,
      createdAt: '2026-04-07T10:30:00.000Z',
      updatedAt: '2026-04-07T10:30:00.000Z',
      metadata: {
        assetUuid: 'canvas-ref-register-asset-uuid-1',
        primaryResourceId: 'canvas-ref-register-resource-id-1',
        primaryResourceUuid: 'canvas-ref-register-resource-uuid-1',
        resourceViewId: 'canvas-ref-register-view-id-1',
        resourceViewUuid: 'canvas-ref-register-view-uuid-1',
      },
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(
      'https://cdn.example.com/reference-register.png'
    );
    assetCenterFindById.mockResolvedValue(null);

    await importCanvasReferenceImageFile(
      {
        name: 'reference-register.png',
        data: new Uint8Array([1, 3, 5]),
      },
      {
        boardId: 'canvas-board-id-1',
        boardUuid: 'canvas-board-uuid-1',
        elementId: 'canvas-element-1',
        source: 'canvas-reference-image-upload',
      }
    );

    expect(assetCenterInitialize).toHaveBeenCalledTimes(1);
    expect(assetCenterRegisterExistingAsset).toHaveBeenCalledWith({
      scope: {
        workspaceId: 'workspace-canvas-1',
        projectId: 'workspace-project-canvas-1',
        domain: 'canvas',
      },
      type: 'image',
      name: 'reference-register.png',
      assetId: 'canvas-ref-register-1',
      locator: {
        protocol: 'https',
        uri: 'https://cdn.example.com/reference-register.png',
        url: 'https://cdn.example.com/reference-register.png',
      },
      metadata: {
        assetUuid: 'canvas-ref-register-asset-uuid-1',
        boardId: 'canvas-board-id-1',
        boardUuid: 'canvas-board-uuid-1',
        elementId: 'canvas-element-1',
        primaryResourceId: 'canvas-ref-register-resource-id-1',
        primaryResourceUuid: 'canvas-ref-register-resource-uuid-1',
        resourceViewId: 'canvas-ref-register-view-id-1',
        resourceViewUuid: 'canvas-ref-register-view-uuid-1',
        source: 'canvas-reference-image-upload',
      },
      references: [
        {
          domain: 'canvas',
          entityType: 'project',
          entityId: 'workspace-project-canvas-1',
          relation: 'reference',
          slot: 'reference-image',
          metadata: {
            boardId: 'canvas-board-id-1',
            boardUuid: 'canvas-board-uuid-1',
            elementId: 'canvas-element-1',
            source: 'canvas-reference-image-upload',
          },
        },
      ],
      status: 'imported',
      size: 2048,
      createdAt: '2026-04-07T10:30:00.000Z',
      updatedAt: '2026-04-07T10:30:00.000Z',
    });
    expect(assetCenterBindReference).not.toHaveBeenCalled();
  });

  it('binds project-level persisted references for uploaded canvas reference images that already exist in asset center', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'canvas-ref-bind-1',
      uuid: 'canvas-ref-bind-asset-uuid-1',
      path: 'https://storage.example.com/raw-reference-bind.png',
      metadata: {},
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue(
      'https://cdn.example.com/reference-bind.png'
    );
    assetCenterFindById.mockResolvedValue({
      assetId: 'canvas-ref-bind-1',
      references: [],
    });

    await importCanvasReferenceImageFile(
      {
        name: 'reference-bind.png',
        data: new Uint8Array([2, 4, 6]),
      },
      {
        boardId: 'canvas-board-id-2',
        boardUuid: 'canvas-board-uuid-2',
        elementId: 'canvas-element-2',
        source: 'canvas-reference-image-upload',
      }
    );

    expect(assetCenterInitialize).toHaveBeenCalledTimes(1);
    expect(assetCenterRegisterExistingAsset).not.toHaveBeenCalled();
    expect(assetCenterBindReference).toHaveBeenCalledWith('canvas-ref-bind-1', {
      domain: 'canvas',
      entityType: 'project',
      entityId: 'workspace-project-canvas-1',
      relation: 'reference',
      slot: 'reference-image',
      metadata: {
        boardId: 'canvas-board-id-2',
        boardUuid: 'canvas-board-uuid-2',
        elementId: 'canvas-element-2',
        source: 'canvas-reference-image-upload',
      },
    });
  });
});
