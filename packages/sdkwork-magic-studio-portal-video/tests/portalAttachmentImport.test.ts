import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
  resolveAssetUrlByAssetIdFirst,
} = vi.hoisted(() => ({
  importAssetBySdk: vi.fn(),
  resolveAssetPrimaryUrlBySdk: vi.fn(),
  resolveAssetUrlByAssetIdFirst: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk,
  resolveAssetPrimaryUrlBySdk,
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst,
}));

vi.mock('@sdkwork/magic-studio-assets/creation-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-assets/creation-chat')>();

  return {
    ...actual,
  };
});

import {
  importPortalAttachmentFromLocalFile,
  resolvePortalAttachmentFromAsset,
} from '../src/utils/portalAttachmentImport';

describe('portalAttachmentImport', () => {
  beforeEach(() => {
    importAssetBySdk.mockReset();
    resolveAssetPrimaryUrlBySdk.mockReset();
    resolveAssetUrlByAssetIdFirst.mockReset();
  });

  it('keeps imported local attachments transient while preserving asset linkage separately', async () => {
    importAssetBySdk.mockResolvedValue({
      id: 'asset-db-1',
      uuid: 'asset-uuid-1',
      path: 'assets://portal-video/start-frame.png',
    });
    resolveAssetPrimaryUrlBySdk.mockResolvedValue('https://cdn.example.com/start-frame.png');

    const attachment = await importPortalAttachmentFromLocalFile(
      {
        name: 'story.txt',
        data: new TextEncoder().encode('INT. ROOM - NIGHT'),
      },
      'short_drama'
    );

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'asset-uuid-1',
      assetId: 'asset-db-1',
      name: 'story.txt',
      type: 'script',
      url: 'https://cdn.example.com/start-frame.png',
      content: 'INT. ROOM - NIGHT',
    });
    expect(attachment.assetUuid).toBeUndefined();
  });

  it('keeps selected asset identity aligned with the asset center record', async () => {
    resolveAssetUrlByAssetIdFirst.mockResolvedValue('https://cdn.example.com/reference.png');

    await expect(
      resolvePortalAttachmentFromAsset({
        id: 'asset-db-2',
        uuid: 'asset-uuid-2',
        name: 'Reference Image',
        type: 'image',
        path: 'assets://portal-video/reference.png',
        size: 0,
        origin: 'upload',
        createdAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T00:00:00.000Z',
        metadata: {},
      } as any)
    ).resolves.toMatchObject({
      id: 'asset-db-2',
      uuid: 'asset-uuid-2',
      assetId: 'asset-db-2',
      assetUuid: 'asset-uuid-2',
      name: 'Reference Image',
      type: 'image',
      url: 'https://cdn.example.com/reference.png',
    });
  });
});
