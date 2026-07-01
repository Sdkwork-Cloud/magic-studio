import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateRuntimeMagicStudioServerClient,
  mockReadDefaultPlatformRuntime,
} = vi.hoisted(() => ({
  mockCreateRuntimeMagicStudioServerClient: vi.fn(),
  mockReadDefaultPlatformRuntime: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: mockCreateRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime: mockReadDefaultPlatformRuntime,
}));

import { userCenterService } from '../src/services/userCenterService';

const mockServerClient = {
  bindUserEmail: vi.fn(),
  bindUserPhone: vi.fn(),
  bindUserPlatform: vi.fn(),
  changeUserPassword: vi.fn(),
  createUserAddress: vi.fn(),
  deleteUserAddress: vi.fn(),
  listUserAddresses: vi.fn(),
  listUserBindings: vi.fn(),
  readDefaultUserAddress: vi.fn(),
  readUserGenerationHistory: vi.fn(),
  readUserLoginHistory: vi.fn(),
  readUserProfile: vi.fn(),
  readUserSettings: vi.fn(),
  setDefaultUserAddress: vi.fn(),
  unbindUserEmail: vi.fn(),
  unbindUserPhone: vi.fn(),
  unbindUserPlatform: vi.fn(),
  updateUserAddress: vi.fn(),
  updateUserProfile: vi.fn(),
  updateUserSettings: vi.fn(),
  uploadUserAvatar: vi.fn(),
};

describe('userCenterService canonical server bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadDefaultPlatformRuntime.mockReturnValue({
      system: {
        kind: () => 'web',
      },
    });
    mockCreateRuntimeMagicStudioServerClient.mockReturnValue(mockServerClient);
  });

  it('reads and updates the canonical user profile through the runtime server client', async () => {
    mockServerClient.readUserProfile.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-03T13:00:00Z',
        email: 'alice@example.com',
        nickname: 'Alice',
        bio: 'profile bio',
        gender: 'female',
        phone: '18800001111',
        region: 'Shanghai',
      },
    });
    mockServerClient.updateUserProfile.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-03T14:00:00Z',
        email: 'alice@example.com',
        nickname: 'Alice Updated',
        bio: 'updated bio',
        gender: 'female',
        phone: '18800001111',
        region: 'Hangzhou',
        avatar: 'https://example.com/next-avatar.png',
      },
    });

    await expect(userCenterService.getUserProfile()).resolves.toEqual({
      bio: 'profile bio',
      createdAt: '2026-04-03T12:00:00Z',
      email: 'alice@example.com',
      gender: 'female',
      nickname: 'Alice',
      phone: '18800001111',
      region: 'Shanghai',
      updatedAt: '2026-04-03T13:00:00Z',
      userId: '1',
    });

    await expect(
      userCenterService.updateUserProfile({
        avatar: 'https://example.com/next-avatar.png',
        bio: 'updated bio',
        email: 'alice@example.com',
        gender: 'female',
        nickname: 'Alice Updated',
        phone: '18800001111',
        region: 'Hangzhou',
      }),
    ).resolves.toEqual({
      avatar: 'https://example.com/next-avatar.png',
      bio: 'updated bio',
      createdAt: '2026-04-03T12:00:00Z',
      email: 'alice@example.com',
      gender: 'female',
      nickname: 'Alice Updated',
      phone: '18800001111',
      region: 'Hangzhou',
      updatedAt: '2026-04-03T14:00:00Z',
      userId: '1',
    });

    expect(mockReadDefaultPlatformRuntime).toHaveBeenCalledWith('UserCenterService');
    expect(mockServerClient.updateUserProfile).toHaveBeenCalledWith({
      avatar: 'https://example.com/next-avatar.png',
      bio: 'updated bio',
      email: 'alice@example.com',
      gender: 'female',
      nickname: 'Alice Updated',
      phone: '18800001111',
      region: 'Hangzhou',
    });
  });

  it('maps canonical address and history envelopes back into the legacy user-center shapes', async () => {
    mockServerClient.createUserAddress.mockResolvedValue({
      data: {
        id: 'address-1',
        uuid: 'address-1',
        createdAt: '2026-04-20T10:00:00Z',
        updatedAt: '2026-04-20T10:00:00Z',
        name: 'Alice',
        phone: '18800001111',
        cityCode: '310100',
        addressDetail: 'No. 1 Bund',
        fullAddress: 'Shanghai No. 1 Bund',
        isDefault: true,
      },
    });
    mockServerClient.listUserAddresses.mockResolvedValue({
      items: [
        {
          id: 'address-1',
          uuid: 'address-1',
          createdAt: '2026-04-20T10:00:00Z',
          updatedAt: '2026-04-20T10:00:00Z',
          name: 'Alice',
          phone: '18800001111',
          addressDetail: 'No. 1 Bund',
          fullAddress: 'Shanghai No. 1 Bund',
          isDefault: true,
        },
      ],
    });
    mockServerClient.readDefaultUserAddress.mockResolvedValue({
      data: {
        id: 'address-1',
        uuid: 'address-1',
        createdAt: '2026-04-20T10:00:00Z',
        updatedAt: '2026-04-20T10:00:00Z',
        name: 'Alice',
        phone: '18800001111',
        addressDetail: 'No. 1 Bund',
        fullAddress: 'Shanghai No. 1 Bund',
        isDefault: true,
      },
    });
    mockServerClient.setDefaultUserAddress.mockResolvedValue({
      data: {
        id: 'address-2',
        uuid: 'address-2',
        createdAt: '2026-04-20T10:05:00Z',
        updatedAt: '2026-04-20T10:05:00Z',
        name: 'Alice',
        phone: '18800001111',
        addressDetail: 'No. 88 West Lake Road',
        fullAddress: 'Hangzhou No. 88 West Lake Road',
        isDefault: true,
      },
    });
    mockServerClient.updateUserAddress.mockResolvedValue({
      data: {
        id: 'address-2',
        uuid: 'address-2',
        createdAt: '2026-04-20T10:05:00Z',
        updatedAt: '2026-04-20T10:06:00Z',
        name: 'Alice',
        phone: '18800001111',
        cityCode: '330100',
        addressDetail: 'No. 88 West Lake Road',
        fullAddress: 'Hangzhou No. 88 West Lake Road',
        isDefault: false,
      },
    });
    mockServerClient.readUserLoginHistory.mockResolvedValue({
      items: [
        {
          id: 'login-1',
          uuid: 'login-1',
          createdAt: '2026-04-20T10:00:00Z',
          updatedAt: '2026-04-20T10:00:00Z',
          authMethod: 'password',
          status: 'success',
          loginAt: '2026-04-20T10:00:00Z',
        },
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 1,
        version: 'v1',
      },
    });
    mockServerClient.readUserGenerationHistory.mockResolvedValue({
      items: [
        {
          id: 'generation-1',
          uuid: 'generation-1',
          createdAt: '2026-04-20T11:00:00Z',
          updatedAt: '2026-04-20T11:00:00Z',
          taskId: 'task-1',
          category: 'image',
          status: 'completed',
        },
      ],
      meta: {
        page: 2,
        pageSize: 10,
        total: 11,
        version: 'v1',
      },
    });

    await expect(
      userCenterService.createAddress({
        cityCode: '310100',
        name: 'Alice',
        phone: '18800001111',
        addressDetail: 'No. 1 Bund',
      }),
    ).resolves.toMatchObject({
      id: 'address-1',
      fullAddress: 'Shanghai No. 1 Bund',
      isDefault: true,
    });
    await expect(userCenterService.listUserAddresses()).resolves.toMatchObject([
      {
        id: 'address-1',
        fullAddress: 'Shanghai No. 1 Bund',
      },
    ]);
    await expect(userCenterService.getDefaultAddress()).resolves.toMatchObject({
      id: 'address-1',
      isDefault: true,
    });
    await expect(userCenterService.setDefaultAddress(2)).resolves.toMatchObject({
      id: 'address-2',
      isDefault: true,
    });
    await expect(
      userCenterService.updateAddress(2, {
        cityCode: '330100',
        addressDetail: 'No. 88 West Lake Road',
      }),
    ).resolves.toMatchObject({
      id: 'address-2',
      cityCode: '330100',
      isDefault: false,
    });
    await expect(userCenterService.deleteAddress(2)).resolves.toBeUndefined();
    await expect(userCenterService.getLoginHistory({ pageNum: 1 })).resolves.toMatchObject({
      current: 1,
      pageNum: 1,
      total: 1,
      totalPages: 1,
      records: [{ id: 'login-1' }],
    });
    await expect(userCenterService.getGenerationHistory({ pageNum: 2, pageSize: 10 })).resolves.toMatchObject({
      current: 2,
      pageNum: 2,
      total: 11,
      totalPages: 2,
      records: [{ id: 'generation-1' }],
    });

    expect(mockServerClient.setDefaultUserAddress).toHaveBeenCalledWith('2');
    expect(mockServerClient.updateUserAddress).toHaveBeenCalledWith('2', {
      addressDetail: 'No. 88 West Lake Road',
      cityCode: '330100',
    });
    expect(mockServerClient.deleteUserAddress).toHaveBeenCalledWith('2');
    expect(mockServerClient.readUserLoginHistory).toHaveBeenCalledWith({ page: 1 });
    expect(mockServerClient.readUserGenerationHistory).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
    });
  });

  it('delegates canonical binding and password capabilities through the runtime server client', async () => {
    mockServerClient.changeUserPassword.mockResolvedValue({
      data: {
        ok: true,
      },
    });
    mockServerClient.listUserBindings.mockResolvedValue({
      items: [
        {
          id: 'binding-1',
          uuid: 'binding-1',
          createdAt: '2026-04-20T12:00:00Z',
          updatedAt: '2026-04-20T12:00:00Z',
          platform: 'wechat',
          target: 'alice_wechat',
          displayName: 'Alice',
          boundAt: '2026-04-20T12:00:00Z',
        },
      ],
    });
    mockServerClient.bindUserEmail.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:05:00Z',
        userId: '1',
        nickname: 'Alice',
        email: 'alice@example.com',
      },
    });
    mockServerClient.unbindUserEmail.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:06:00Z',
        userId: '1',
        nickname: 'Alice',
      },
    });
    mockServerClient.bindUserPhone.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:07:00Z',
        userId: '1',
        nickname: 'Alice',
        phone: '18800001111',
      },
    });
    mockServerClient.unbindUserPhone.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:08:00Z',
        userId: '1',
        nickname: 'Alice',
      },
    });
    mockServerClient.bindUserPlatform.mockResolvedValue({
      data: {
        ok: true,
      },
    });
    mockServerClient.unbindUserPlatform.mockResolvedValue({
      data: {
        ok: true,
      },
    });

    await expect(
      userCenterService.changePassword({
        confirmPassword: 'next-password',
        newPassword: 'next-password',
        oldPassword: 'current-password',
      }),
    ).resolves.toBeUndefined();
    await expect(userCenterService.listUserBindings()).resolves.toEqual([
      {
        boundAt: '2026-04-20T12:00:00Z',
        createdAt: '2026-04-20T12:00:00Z',
        displayName: 'Alice',
        id: 'binding-1',
        platform: 'wechat',
        target: 'alice_wechat',
        updatedAt: '2026-04-20T12:00:00Z',
        uuid: 'binding-1',
      },
    ]);
    await expect(
      userCenterService.bindEmail('alice@example.com', '123456'),
    ).resolves.toMatchObject({
      email: 'alice@example.com',
      userId: '1',
    });
    await expect(userCenterService.unbindEmail()).resolves.toMatchObject({
      nickname: 'Alice',
      userId: '1',
    });
    await expect(
      userCenterService.bindPhone('18800001111', '654321'),
    ).resolves.toMatchObject({
      phone: '18800001111',
      userId: '1',
    });
    await expect(userCenterService.unbindPhone()).resolves.toMatchObject({
      nickname: 'Alice',
      userId: '1',
    });
    await expect(
      userCenterService.bindThirdParty('wechat', {
        code: 'oauth-code',
        state: 'oauth-state',
      }),
    ).resolves.toBeUndefined();
    await expect(userCenterService.unbindThirdParty('wechat')).resolves.toBeUndefined();

    expect(mockServerClient.changeUserPassword).toHaveBeenCalledWith({
      confirmPassword: 'next-password',
      newPassword: 'next-password',
      oldPassword: 'current-password',
    });
    expect(mockServerClient.bindUserEmail).toHaveBeenCalledWith({
      email: 'alice@example.com',
      verificationCode: '123456',
    });
    expect(mockServerClient.bindUserPhone).toHaveBeenCalledWith({
      phone: '18800001111',
      verificationCode: '654321',
    });
    expect(mockServerClient.bindUserPlatform).toHaveBeenCalledWith('wechat', {
      code: 'oauth-code',
      state: 'oauth-state',
    });
    expect(mockServerClient.unbindUserPlatform).toHaveBeenCalledWith('wechat');
  });

  it('uploads avatars through the canonical user endpoint and returns the mapped profile', async () => {
    mockServerClient.uploadUserAvatar.mockResolvedValue({
      data: {
        id: '1',
        uuid: '1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:10:00Z',
        userId: '1',
        nickname: 'Alice',
        email: 'alice@example.com',
        avatar: 'https://example.com/uploaded-avatar.png',
      },
    });

    await expect(
      userCenterService.uploadUserAvatar({
        contentType: 'image/png',
        data: new Uint8Array([137, 80, 78, 71]),
        name: 'avatar.png',
      }),
    ).resolves.toEqual({
      avatar: 'https://example.com/uploaded-avatar.png',
      createdAt: '2026-04-03T12:00:00Z',
      email: 'alice@example.com',
      nickname: 'Alice',
      updatedAt: '2026-04-20T12:10:00Z',
      userId: '1',
    });

    expect(mockServerClient.uploadUserAvatar).toHaveBeenCalledWith({
      file: 'data:image/png;base64,iVBORw==',
    });
  });

  it('does not import generated SDK types directly from retired generic app SDK', async () => {
    const serviceSource = await readFile(
      new URL('../src/services/userCenterService.ts', import.meta.url),
      'utf8',
    );
    const contractSource = await readFile(
      new URL('../src/services/userCenterService.contract.ts', import.meta.url),
      'utf8',
    );

    expect(serviceSource.includes(`@sdkwork/${'app'}-sdk`)).toBe(false);
    expect(contractSource.includes(`@sdkwork/${'app'}-sdk`)).toBe(false);
    expect(contractSource.includes('@sdkwork/magic-studio-server')).toBe(true);
  });

  it('ships a user-center contract typecheck guard and dedicated tsconfig', async () => {
    await expect(
      access(
        new URL('../src/services/userCenterService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
    const source = await readFile(
      new URL('../src/services/userCenterService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
