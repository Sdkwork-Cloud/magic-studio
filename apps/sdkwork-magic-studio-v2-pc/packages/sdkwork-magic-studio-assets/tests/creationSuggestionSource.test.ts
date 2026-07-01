import { describe, expect, it } from 'vitest';

import type { InputAttachment } from '../src/components/CreationChatInput/types';
import { createSuggestionConfigSource } from '../src/components/CreationChatInput/suggestion';

const createAttachment = (overrides: Partial<InputAttachment>): InputAttachment => ({
  id: null,
  uuid: `attachment-${Math.random().toString(36).slice(2)}`,
  name: 'attachment',
  type: 'image',
  ...overrides,
});

describe('creation suggestion source', () => {
  it('keeps one config instance while serving the latest attachments', () => {
    const source = createSuggestionConfigSource([
      createAttachment({
        uuid: 'attachment-alpha',
        name: 'alpha-reference.png',
        type: 'image',
      }),
    ]);

    const stableConfig = source.config;

    expect(stableConfig.items({ query: 'alpha' }).map((item) => item.name)).toEqual([
      'alpha-reference.png',
    ]);

    source.setAttachments([
      createAttachment({
        uuid: 'attachment-beta',
        name: 'beta-footage.mp4',
        type: 'video',
      }),
    ]);

    expect(source.config).toBe(stableConfig);
    expect(stableConfig.items({ query: 'beta' }).map((item) => item.name)).toEqual([
      'beta-footage.mp4',
    ]);
    expect(stableConfig.items({ query: 'alpha' })).toEqual([]);
  });
});
