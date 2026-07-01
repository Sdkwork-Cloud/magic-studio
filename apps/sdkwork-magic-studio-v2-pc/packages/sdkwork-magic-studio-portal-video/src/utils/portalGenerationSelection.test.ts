import { describe, expect, it } from 'vitest';

import { resolvePortalGenMode } from './portalGenerationSelection';

describe('resolvePortalGenMode', () => {
  it('forces start_end for video tab when image attachments exist', () => {
    expect(
      resolvePortalGenMode({
        activeTab: 'video',
        requestedMode: 'smart_reference',
        attachments: [{ type: 'image' }],
      }),
    ).toBe('start_end');
  });

  it('keeps the requested mode when it is valid for the active tab', () => {
    expect(
      resolvePortalGenMode({
        activeTab: 'video',
        requestedMode: 'smart_multi',
        attachments: [],
      }),
    ).toBe('smart_multi');
  });

  it('falls back to the first valid mode for the tab when the requested mode is invalid', () => {
    expect(
      resolvePortalGenMode({
        activeTab: 'image',
        requestedMode: 'start_end',
        attachments: [],
      }),
    ).toBe('text');
  });

  it('returns text when the tab has no configured modes', () => {
    expect(
      resolvePortalGenMode({
        activeTab: 'speech',
        requestedMode: 'smart_reference',
        attachments: [],
      }),
    ).toBe('text');
  });
});
