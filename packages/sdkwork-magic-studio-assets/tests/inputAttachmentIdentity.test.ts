import { describe, expect, it } from 'vitest';

import {
  createInputAttachment,
  matchesInputAttachmentKey,
  removeInputAttachmentByKey,
  resolveInputAttachmentKey,
} from '../src/components/CreationChatInput/attachmentIdentity';

describe('createInputAttachment', () => {
  it('uses uuid-first identity for local attachment state while preserving asset ids', () => {
    const attachment = createInputAttachment({
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      name: 'Reference Frame',
      type: 'image',
      url: 'https://cdn.example.com/ref.png',
    });

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'asset-uuid-1',
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      name: 'Reference Frame',
      type: 'image',
      url: 'https://cdn.example.com/ref.png',
    });
  });

  it('keeps local attachment id empty while allowing explicit local identity fallback', () => {
    const attachment = createInputAttachment({
      id: 'start_frame',
      name: 'Start Frame',
      type: 'image',
      url: 'https://cdn.example.com/start.png',
    });

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'start_frame',
      name: 'Start Frame',
      type: 'image',
      url: 'https://cdn.example.com/start.png',
    });
    expect(attachment.assetId).toBeUndefined();
    expect(attachment.assetUuid).toBeUndefined();
  });

  it('does not fabricate assetUuid from assetId when only persisted id is known', () => {
    const attachment = createInputAttachment({
      assetId: 'asset-db-9',
      uuid: 'resource-view-uuid-9',
      name: 'Reference Frame',
      type: 'image',
      url: 'https://cdn.example.com/ref-9.png',
    });

    expect(attachment).toMatchObject({
      id: null,
      uuid: 'resource-view-uuid-9',
      assetId: 'asset-db-9',
      name: 'Reference Frame',
      type: 'image',
      url: 'https://cdn.example.com/ref-9.png',
    });
    expect(attachment.assetUuid).toBeUndefined();
  });

  it('resolves attachment keys by uuid first with id fallback', () => {
    expect(
      resolveInputAttachmentKey({
        id: 'attachment-local-1',
        uuid: 'attachment-uuid-1',
      } as any)
    ).toBe('attachment-uuid-1');

    expect(
      resolveInputAttachmentKey({
        id: 'attachment-local-2',
        uuid: '',
      } as any)
    ).toBe('attachment-local-2');
  });

  it('matches attachment keys against both uuid and non-empty id', () => {
    expect(
      matchesInputAttachmentKey(
        {
          id: 'attachment-local-3',
          uuid: 'attachment-uuid-3',
        } as any,
        'attachment-uuid-3'
      )
    ).toBe(true);

    expect(
      matchesInputAttachmentKey(
        {
          id: 'attachment-local-4',
          uuid: '',
        } as any,
        'attachment-local-4'
      )
    ).toBe(true);
  });

  it('removes attachments by uuid-first key even when local ids are empty', () => {
    const remaining = removeInputAttachmentByKey(
      [
        {
          id: null,
          uuid: 'attachment-uuid-1',
          name: 'Start Frame',
          type: 'image',
        },
        {
          id: 'asset-db-2',
          uuid: 'asset-uuid-2',
          name: 'Reference',
          type: 'image',
        },
      ] as any,
      'attachment-uuid-1'
    );

    expect(remaining).toEqual([
      {
        id: 'asset-db-2',
        uuid: 'asset-uuid-2',
        name: 'Reference',
        type: 'image',
      },
    ]);
  });
});
