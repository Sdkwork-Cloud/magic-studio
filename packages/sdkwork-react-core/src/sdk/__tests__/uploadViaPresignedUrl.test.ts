import { afterEach, describe, expect, it, vi } from 'vitest';

import { uploadViaPresignedUrl } from '../uploadViaPresignedUrl';

describe('uploadViaPresignedUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers the official registerPresigned sdk method when registering uploads', async () => {
    const getPresignedUrl = vi.fn(async () => ({
      code: '2000',
      data: {
        url: 'https://upload.example.com/presigned',
      },
    }));
    const registerPresigned = vi.fn(async () => ({
      code: '2000',
      data: {
        fileId: 'file-1',
      },
    }));
    const registerPresignedUpload = vi.fn(async () => ({
      code: '2000',
      data: {
        fileId: 'legacy-file',
      },
    }));
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
    }));

    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadViaPresignedUrl({
      upload: {
        getPresignedUrl,
        registerPresigned,
        registerPresignedUpload,
      },
    } as any, {
      file: new Uint8Array([1, 2, 3]),
      fileName: 'demo.png',
      type: 'IMAGE',
      path: 'assets/test',
    });

    expect(getPresignedUrl).toHaveBeenCalled();
    expect(registerPresigned).toHaveBeenCalled();
    expect(registerPresignedUpload).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://upload.example.com/presigned',
      expect.objectContaining({
        method: 'PUT',
      })
    );
    expect(result.registerResult).toMatchObject({
      data: {
        fileId: 'file-1',
      },
    });
  });

  it('forwards presigned response headers during the direct PUT upload', async () => {
    const getPresignedUrl = vi.fn(async () => ({
      code: '2000',
      data: {
        url: 'https://upload.example.com/presigned',
        headers: {
          'x-upload-token': 'token-1',
        },
      },
    }));
    const registerPresigned = vi.fn(async () => ({
      code: '2000',
      data: {
        fileId: 'file-2',
      },
    }));
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
    }));

    vi.stubGlobal('fetch', fetchMock);

    await uploadViaPresignedUrl({
      upload: {
        getPresignedUrl,
        registerPresigned,
      },
    } as any, {
      file: new Uint8Array([1, 2, 3]),
      fileName: 'avatar.png',
      contentType: 'image/png',
      type: 'IMAGE',
      path: 'assets/test',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://upload.example.com/presigned',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'x-upload-token': 'token-1',
        },
        body: expect.any(Blob),
      })
    );
  });
});
