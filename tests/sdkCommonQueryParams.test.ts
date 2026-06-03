import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBaseHttpClient } from '@sdkwork/sdk-common';

const originalFetch = globalThis.fetch;

describe('sdk-common query params', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('serializes array query params as repeated keys for generated SDK clients', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: '2000', data: { ok: true } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    globalThis.fetch = fetchMock as typeof fetch;

    const client = createBaseHttpClient({
      baseUrl: 'https://api.example.com',
    });

    await client.get('/app/v3/api/asset-center/assets/page', {
      page: 0,
      size: 20,
      sort: ['updatedAt,desc', 'createdAt,asc'],
      types: ['image', 'video'],
      status: ['ready', 'processing'],
      includeDeleted: false,
    } as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl] = fetchMock.mock.calls[0] || [];
    expect(typeof requestUrl).toBe('string');

    const parsed = new URL(String(requestUrl));
    expect(parsed.pathname).toBe('/app/v3/api/asset-center/assets/page');
    expect(parsed.searchParams.get('page')).toBe('0');
    expect(parsed.searchParams.get('size')).toBe('20');
    expect(parsed.searchParams.get('includeDeleted')).toBe('false');
    expect(parsed.searchParams.getAll('sort')).toEqual(['updatedAt,desc', 'createdAt,asc']);
    expect(parsed.searchParams.getAll('types')).toEqual(['image', 'video']);
    expect(parsed.searchParams.getAll('status')).toEqual(['ready', 'processing']);
  });
});
