import { describe, expect, it } from 'vitest';

describe('safe selection utilities', () => {
  it('exports a selector that safely returns null for empty collections', async () => {
    const utils = (await import('./index')) as Record<string, unknown>;
    const findByIdOrFirst = utils.findByIdOrFirst as
      | ((items: Array<{ id: string }>, id?: string | null) => { id: string } | null)
      | undefined;

    expect(findByIdOrFirst).toBeTypeOf('function');
    expect(findByIdOrFirst?.([], 'missing')).toBeNull();
  });

  it('falls back to the first item when no id match exists', async () => {
    const utils = (await import('./index')) as Record<string, unknown>;
    const findByIdOrFirst = utils.findByIdOrFirst as
      | ((items: Array<{ id: string }>, id?: string | null) => { id: string } | null)
      | undefined;

    const items = [{ id: 'a' }, { id: 'b' }];

    expect(findByIdOrFirst).toBeTypeOf('function');
    expect(findByIdOrFirst?.(items, 'missing')).toEqual(items[0]);
  });
});
