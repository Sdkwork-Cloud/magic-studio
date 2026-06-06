import { describe, expect, it } from 'vitest';

import { uploadViaPresignedUrl } from '../uploadViaPresignedUrl';

const createUploadResult = (overrides: {
  profile?: string;
  fileName?: string;
  contentType?: string;
  contentLength?: string;
  spaceId?: string;
  nodeId?: string;
} = {}) => {
  const profile = overrides.profile ?? 'image';
  const fileName = overrides.fileName ?? 'demo.png';
  const contentType = overrides.contentType ?? 'image/png';
  const contentLength = overrides.contentLength ?? '3';
  const spaceId = overrides.spaceId ?? 'space-magic';
  const nodeId = overrides.nodeId ?? 'node-magic-001';

  return {
    uploadItem: {
      id: 'upload-item-1',
      taskId: 'task-1',
      tenantId: 'tenant-1',
      actorType: 'user',
      actorId: 'user-1',
      appId: 'magic-studio',
      appResourceType: 'magic-studio-upload',
      appResourceId: 'asset-draft-1',
      uploadProfileCode: profile,
      fileFingerprint: 'fingerprint-1',
      spaceId,
      nodeId,
      uploadSessionId: 'session-1',
      originalFileName: fileName,
      contentType,
      contentTypeGroup: contentType.split('/')[0] || 'application',
      contentLength,
      chunkSizeBytes: '8388608',
      totalParts: '1',
      uploadedPartsCount: '1',
      uploadedBytes: contentLength,
      status: 'completed',
      retentionMode: 'long_term',
      cleanupStatus: 'not_required',
      postProcessStatus: 'not_required',
      scene: 'magic_studio_upload',
      source: 'magic-studio-core',
    },
    uploadSession: {
      id: 'session-1',
      tenantId: 'tenant-1',
      spaceId,
      nodeId,
      bucket: 'drive-internal',
      objectKey: 'drive/object/key',
      state: 'completed' as const,
      expiresAtEpochMs: '1774108800000',
      version: '1',
      storageProviderId: 'provider-1',
      storageUploadId: 'storage-upload-1',
    },
    parts: [
      {
        partNo: 1,
        etag: '"etag-1"',
        offsetBytes: 0,
        sizeBytes: Number(contentLength),
      },
    ],
  };
};

describe('uploadViaPresignedUrl', () => {
  it('delegates uploads to Drive uploader and returns stable Drive references', async () => {
    const requests: Array<Record<string, unknown>> = [];
    const uploadByProfile = vi.fn(async (profile: string, request: Record<string, unknown>) => {
      requests.push({ profile, ...request });
      return createUploadResult({ profile });
    });

    const result = await uploadViaPresignedUrl({
      uploader: {
        uploadByProfile,
      },
    }, {
      file: new Uint8Array([1, 2, 3]),
      fileName: 'demo.png',
      contentType: 'image/png',
      type: 'IMAGE',
      path: 'assets/test',
      tenantId: 'tenant-1',
      userId: 'user-1',
      appResourceId: 'asset-draft-1',
    });

    expect(uploadByProfile).toHaveBeenCalledTimes(1);
    expect(requests[0]).toMatchObject({
      profile: 'image',
      tenantId: 'tenant-1',
      userId: 'user-1',
      operatorId: 'user-1',
      appId: 'magic-studio',
      appResourceType: 'magic-studio-upload',
      appResourceId: 'asset-draft-1',
      scene: 'magic_studio_upload',
      source: 'magic-studio-core',
      uploadProfileCode: 'image',
      originalFileName: 'demo.png',
      contentType: 'image/png',
      retention: {
        mode: 'long_term',
      },
    });
    expect(requests[0]?.file).toBeInstanceOf(Blob);
    expect(result).toMatchObject({
      driveUri: 'drive://spaces/space-magic/nodes/node-magic-001',
      driveSpaceId: 'space-magic',
      driveNodeId: 'node-magic-001',
      fileId: 'node-magic-001',
      fileName: 'demo.png',
      contentType: 'image/png',
      size: 3,
    });
    expect(result.objectKey).toBeUndefined();
    expect(result.uploadUrl).toBeUndefined();
  });

  it('maps generic legacy type values to the generic Drive upload profile', async () => {
    const uploadByProfile = vi.fn(async (profile: string) =>
      createUploadResult({
        profile,
        fileName: 'payload.bin',
        contentType: 'application/octet-stream',
        nodeId: 'node-generic',
      }),
    );

    const result = await uploadViaPresignedUrl({
      uploader: {
        uploadByProfile,
      },
    }, {
      file: new Uint8Array([1, 2, 3, 4]),
      fileName: 'payload.bin',
      type: 'unknown',
      tenantId: 'tenant-1',
      anonymousId: 'anon-1',
    });

    expect(uploadByProfile).toHaveBeenCalledWith(
      'generic',
      expect.objectContaining({
        anonymousId: 'anon-1',
        operatorId: 'anon-1',
        uploadProfileCode: 'generic',
      }),
    );
    expect(result.driveUri).toBe('drive://spaces/space-magic/nodes/node-generic');
  });

  it('requires tenant attribution before starting a Drive upload', async () => {
    const uploadByProfile = vi.fn(async () => createUploadResult());

    await expect(
      uploadViaPresignedUrl({
        uploader: {
          uploadByProfile,
        },
      }, {
        file: new Uint8Array([1]),
        fileName: 'missing-tenant.png',
        type: 'IMAGE',
      }),
    ).rejects.toThrow(/tenantId/i);

    expect(uploadByProfile).not.toHaveBeenCalled();
  });
});
