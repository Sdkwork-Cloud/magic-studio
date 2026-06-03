import { describe, expect, it } from 'vitest';

import {
  resolvePortalLaunchAttachmentIdentity,
  resolvePortalLaunchAttachmentRef,
  toPortalLaunchAttachmentAssetUrlSource,
} from '../src/asset-center/application/portalLaunchAttachment';

describe('resolvePortalLaunchAttachmentIdentity', () => {
  it('prefers attachment uuid for canonical client identity while keeping asset semantics separate', () => {
    const identity = resolvePortalLaunchAttachmentIdentity({
      id: 'legacy-local-id',
      uuid: 'attachment-local-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      name: 'Start Frame',
      type: 'image',
    } as any);

    expect(identity).toEqual({
      id: 'legacy-local-id',
      uuid: 'attachment-local-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
    });
  });

  it('keeps assetUuid empty when only persisted assetId is known', () => {
    const identity = resolvePortalLaunchAttachmentIdentity({
      id: null,
      uuid: 'attachment-local-uuid-2',
      assetId: 'asset-db-2',
      name: 'Reference Image',
      type: 'image',
    } as any);

    expect(identity).toEqual({
      id: null,
      uuid: 'attachment-local-uuid-2',
      assetId: 'asset-db-2',
      assetUuid: null,
    });
  });

  it('preserves locator payload while keeping attachment id separate from asset id', () => {
    const attachment = resolvePortalLaunchAttachmentRef({
      id: 'attachment-local-id-1',
      uuid: 'attachment-local-uuid-3',
      assetId: 'asset-db-3',
      assetUuid: 'asset-uuid-3',
      name: 'Portal Frame',
      type: 'image',
      locator: 'assets://asset-db-3',
    } as any);

    expect(attachment).toEqual({
      id: 'attachment-local-id-1',
      uuid: 'attachment-local-uuid-3',
      assetId: 'asset-db-3',
      assetUuid: 'asset-uuid-3',
      name: 'Portal Frame',
      type: 'image',
      locator: 'assets://asset-db-3',
      content: null,
    });
  });

  it('builds asset url resolve source without copying assetId into generic id', () => {
    const source = toPortalLaunchAttachmentAssetUrlSource({
      id: null,
      uuid: 'attachment-local-uuid-4',
      assetId: 'asset-db-4',
      assetUuid: 'asset-uuid-4',
      name: 'Reference Image',
      type: 'image',
      locator: 'https://cdn.example.com/reference-image.png',
    } as any);

    expect(source).toEqual({
      id: undefined,
      assetId: 'asset-db-4',
      url: 'https://cdn.example.com/reference-image.png',
    });
  });
});
