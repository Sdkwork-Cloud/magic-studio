import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  updateUserProfileMock,
  getAppSdkClientWithSessionMock,
  uploadViaPresignedUrlMock,
} = vi.hoisted(() => {
  const updateUserProfile = vi.fn();
  return {
    updateUserProfileMock: updateUserProfile,
    getAppSdkClientWithSessionMock: vi.fn(() => ({
      user: {
        updateUserProfile,
      },
    })),
    uploadViaPresignedUrlMock: vi.fn(),
  };
});

vi.mock('@sdkwork/react-core', () => ({
  getAppSdkClientWithSession: getAppSdkClientWithSessionMock,
  uploadViaPresignedUrl: uploadViaPresignedUrlMock,
}));

import { userCenterService } from '../userCenterService';

describe('userCenterService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uploads avatar images via presigned url before updating the user profile', async () => {
    uploadViaPresignedUrlMock.mockResolvedValue({
      registerResult: {
        code: '2000',
        data: {
          accessUrl: 'https://cdn.example.com/users/avatar.png',
          objectKey: 'users/avatars/avatar.png',
        },
      },
    });
    updateUserProfileMock.mockResolvedValue({
      code: '2000',
      data: {
        nickname: 'Demo User',
        email: 'demo@example.com',
        avatar: 'https://cdn.example.com/users/avatar.png',
      },
    });

    const result = await userCenterService.uploadUserAvatar({
      data: new Uint8Array([1, 2, 3]),
      name: 'avatar.png',
      contentType: 'image/png',
    });

    expect(uploadViaPresignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        file: expect.any(Blob),
        fileName: 'avatar.png',
        contentType: 'image/png',
        type: 'IMAGE',
        path: 'users/avatars',
      })
    );
    expect(updateUserProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar: 'https://cdn.example.com/users/avatar.png',
      })
    );
    expect(result.avatar).toBe('https://cdn.example.com/users/avatar.png');
  });
});
