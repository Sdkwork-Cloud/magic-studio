import { describe, expect, it } from 'vitest';

import { buildFilmHomeAttachment } from '../src/utils/filmHomeAttachment';

describe('buildFilmHomeAttachment', () => {
  it('uses assetUuid as the local attachment uuid while keeping transient id empty', () => {
    const attachment = buildFilmHomeAttachment({
      imported: {
        id: null,
        assetId: 'asset-db-1',
        uuid: 'asset-uuid-1',
        assetUuid: 'asset-uuid-1',
        resource: {
          id: null,
          uuid: 'asset-uuid-1',
          assetId: 'asset-db-1',
          assetUuid: 'asset-uuid-1',
          type: 'text',
          url: 'https://cdn.example.com/script.txt',
        },
      },
      fileName: 'story.txt',
      attachmentType: 'script',
      ext: 'txt',
      bytes: new TextEncoder().encode('INT. ROOM - NIGHT'),
    });

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'asset-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      name: 'story.txt',
      type: 'script',
      url: 'https://cdn.example.com/script.txt',
      content: 'INT. ROOM - NIGHT',
    });
  });

  it('keeps transient id empty when imported identity is carried by uuid', () => {
    const attachment = buildFilmHomeAttachment({
      imported: {
        id: null,
        assetId: 'asset-db-2',
        uuid: 'asset-db-2',
        assetUuid: 'asset-db-2',
        resource: {
          id: null,
          uuid: 'asset-db-2',
          assetId: 'asset-db-2',
          assetUuid: 'asset-db-2',
          type: 'file',
          url: 'https://cdn.example.com/script.pdf',
        },
      },
      fileName: 'story.pdf',
      attachmentType: 'script',
      ext: 'pdf',
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'asset-db-2',
      assetId: 'asset-db-2',
      assetUuid: 'asset-db-2',
      name: 'story.pdf',
      type: 'script',
      url: 'https://cdn.example.com/script.pdf',
    });
    expect(attachment.content).toBeUndefined();
  });

  it('uses imported client uuid for local attachment identity without inventing assetUuid', () => {
    const attachment = buildFilmHomeAttachment({
      imported: {
        id: null,
        assetId: 'asset-db-4',
        uuid: 'resource-view-uuid-4',
        resource: {
          id: null,
          uuid: 'resource-view-uuid-4',
          assetId: 'asset-db-4',
          type: 'text',
          url: 'https://cdn.example.com/script-4.txt',
        },
      } as any,
      fileName: 'story-4.txt',
      attachmentType: 'script',
      ext: 'txt',
      bytes: new TextEncoder().encode('EXT. STREET - DAWN'),
    });

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'resource-view-uuid-4',
      assetId: 'asset-db-4',
      name: 'story-4.txt',
      type: 'script',
      url: 'https://cdn.example.com/script-4.txt',
      content: 'EXT. STREET - DAWN',
    });
    expect(attachment.assetUuid).toBeUndefined();
  });
});
