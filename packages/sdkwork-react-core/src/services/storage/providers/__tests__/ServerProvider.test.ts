import { afterEach, describe, expect, it, vi } from 'vitest';

import { ServerProvider } from '../ServerProvider';

describe('ServerProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads through a presigned URL flow instead of posting multipart data to the backend', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uploadUrl: 'https://upload.example.com/presigned',
            key: 'library/assets/avatar.png',
            headers: {
              'Content-Type': 'image/png',
              'x-upload-token': 'token-1',
            },
            url: 'https://cdn.example.com/library/assets/avatar.png',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const provider = new ServerProvider({
      provider: 'custom',
      apiEndpoint: 'https://api.example.com/storage',
      authHeaderName: 'Authorization',
      authToken: 'Bearer demo-token',
      pathPrefix: 'library',
    });

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const result = await provider.upload('assets/avatar.png', file);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/storage/upload-url?path=library%2Fassets%2Favatar.png&filename=avatar.png&contentType=image%2Fpng',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upload.example.com/presigned', {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
        'x-upload-token': 'token-1',
      },
      body: file,
    });
    expect(result).toEqual({
      key: 'library/assets/avatar.png',
      url: 'https://cdn.example.com/library/assets/avatar.png',
    });
  });

  it('applies pathPrefix when requesting signed access URLs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          url: 'https://cdn.example.com/library/assets/avatar.png',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new ServerProvider({
      provider: 'custom',
      apiEndpoint: 'https://api.example.com/storage',
      pathPrefix: 'library',
    });

    const url = await provider.getSignedUrl('assets/avatar.png', 120);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/storage/sign?path=library%2Fassets%2Favatar.png&expires=120',
      {
        headers: {},
      }
    );
    expect(url).toBe('https://cdn.example.com/library/assets/avatar.png');
  });
});
