import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

const userCenterNodeState = {
  client: {},
  runtime: {
    system: {
      kind: () => 'web',
    },
  },
};

globalThis.__userCenterServiceNodeTestState = userCenterNodeState;

registerHooks({
  resolve(specifier, context, defaultResolve) {
    if (specifier === '@sdkwork/magic-studio-core') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            const state = globalThis.__userCenterServiceNodeTestState;
            export function readDefaultPlatformRuntime() {
              return state.runtime;
            }
            export function createRuntimeMagicStudioServerClient() {
              return state.client;
            }
          `),
      };
    }
    if (specifier === '@sdkwork/magic-studio-core/sdk') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            const state = globalThis.__userCenterServiceNodeTestState;
            export function readDefaultPlatformRuntime() {
              return state.runtime;
            }
            export function createRuntimeMagicStudioServerClient() {
              return state.client;
            }
          `),
      };
    }
    if (specifier === '@sdkwork/magic-studio-commons/utils/serviceAdapter') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            export function createServiceAdapterController(service) {
              return {
                service,
                setAdapter() {},
                getAdapter() {
                  return service;
                },
                resetAdapter() {},
              };
            }
          `),
      };
    }
    return defaultResolve(specifier, context, defaultResolve);
  },
});

const { userCenterService } = await import('../src/services/userCenterService.ts');

test('reads canonical profile data through the runtime server client', async () => {
  userCenterNodeState.client = {
    readUserProfile: async () => ({
      data: {
        id: 'user-1',
        uuid: 'user-1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-03T13:00:00Z',
        email: 'alice@example.com',
        nickname: 'Alice',
        bio: 'profile bio',
        gender: 'female',
        phone: '18800001111',
        region: 'Shanghai',
      },
    }),
  };

  const profile = await userCenterService.getUserProfile();

  assert.deepEqual(profile, {
    bio: 'profile bio',
    createdAt: '2026-04-03T12:00:00Z',
    email: 'alice@example.com',
    gender: 'female',
    nickname: 'Alice',
    phone: '18800001111',
    region: 'Shanghai',
    updatedAt: '2026-04-03T13:00:00Z',
    userId: 'user-1',
  });
});

test('delegates canonical address, history, and third-party binding methods through the runtime server client', async () => {
  let createAddressPayload = null;
  let bindPlatformPayload = null;

  userCenterNodeState.client = {
    bindUserPlatform: async (platform, payload) => {
      bindPlatformPayload = { platform, payload };
      return { data: { ok: true } };
    },
    createUserAddress: async (payload) => {
      createAddressPayload = payload;
      return {
        data: {
          id: 'address-1',
          uuid: 'address-1',
          createdAt: '2026-04-20T10:00:00Z',
          updatedAt: '2026-04-20T10:00:00Z',
          cityCode: payload.cityCode,
          name: 'Alice',
          phone: '18800001111',
          addressDetail: 'No. 1 Bund',
          fullAddress: 'Shanghai No. 1 Bund',
          isDefault: true,
        },
      };
    },
    listUserAddresses: async () => ({
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
    }),
    readUserGenerationHistory: async (params) => ({
      items: [
        {
          id: `generation-${params.page}`,
          uuid: `generation-${params.page}`,
          createdAt: '2026-04-20T11:00:00Z',
          updatedAt: '2026-04-20T11:00:00Z',
          taskId: 'task-1',
          category: 'image',
          status: 'completed',
        },
      ],
      meta: {
        page: params.page,
        pageSize: params.pageSize ?? 20,
        total: 1,
        version: 'v1',
      },
    }),
    readUserLoginHistory: async (params) => ({
      items: [
        {
          id: `login-${params.page}`,
          uuid: `login-${params.page}`,
          createdAt: '2026-04-20T10:00:00Z',
          updatedAt: '2026-04-20T10:00:00Z',
          authMethod: 'password',
          status: 'success',
          loginAt: '2026-04-20T10:00:00Z',
        },
      ],
      meta: {
        page: params.page,
        pageSize: params.pageSize ?? 20,
        total: 1,
        version: 'v1',
      },
    }),
    uploadUserAvatar: async () => ({
      data: {
        id: 'user-1',
        uuid: 'user-1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:10:00Z',
        userId: 'user-1',
        nickname: 'Alice',
        email: 'alice@example.com',
        avatar: 'https://example.com/uploaded-avatar.png',
      },
    }),
  };

  const createdAddress = await userCenterService.createAddress({
    cityCode: '310100',
    name: 'Alice',
    phone: '18800001111',
    addressDetail: 'No. 1 Bund',
  });
  const addressList = await userCenterService.listUserAddresses();
  const loginHistory = await userCenterService.getLoginHistory({ pageNum: 1 });
  const generationHistory = await userCenterService.getGenerationHistory({ pageNum: 2 });
  await userCenterService.bindThirdParty('wechat', {
    code: 'oauth-code',
    state: 'oauth-state',
  });
  const profile = await userCenterService.uploadUserAvatar({
    contentType: 'image/png',
    data: new Uint8Array([137, 80, 78, 71]),
    name: 'avatar.png',
  });

  assert.deepEqual(createAddressPayload, {
    addressDetail: 'No. 1 Bund',
    cityCode: '310100',
    name: 'Alice',
    phone: '18800001111',
  });
  assert.deepEqual(createdAddress, {
    addressDetail: 'No. 1 Bund',
    cityCode: '310100',
    createdAt: '2026-04-20T10:00:00Z',
    fullAddress: 'Shanghai No. 1 Bund',
    id: 'address-1',
    isDefault: true,
    name: 'Alice',
    phone: '18800001111',
    updatedAt: '2026-04-20T10:00:00Z',
    uuid: 'address-1',
  });
  assert.deepEqual(addressList, [
    {
      addressDetail: 'No. 1 Bund',
      createdAt: '2026-04-20T10:00:00Z',
      fullAddress: 'Shanghai No. 1 Bund',
      id: 'address-1',
      isDefault: true,
      name: 'Alice',
      phone: '18800001111',
      updatedAt: '2026-04-20T10:00:00Z',
      uuid: 'address-1',
    },
  ]);
  assert.deepEqual(loginHistory.records, [{ id: 'login-1', uuid: 'login-1', createdAt: '2026-04-20T10:00:00Z', updatedAt: '2026-04-20T10:00:00Z', authMethod: 'password', status: 'success', loginAt: '2026-04-20T10:00:00Z' }]);
  assert.equal(loginHistory.current, 1);
  assert.deepEqual(generationHistory.records, [{ id: 'generation-2', uuid: 'generation-2', createdAt: '2026-04-20T11:00:00Z', updatedAt: '2026-04-20T11:00:00Z', taskId: 'task-1', category: 'image', status: 'completed' }]);
  assert.equal(generationHistory.current, 2);
  assert.deepEqual(bindPlatformPayload, {
    platform: 'wechat',
    payload: {
      code: 'oauth-code',
      state: 'oauth-state',
    },
  });
  assert.deepEqual(profile, {
    avatar: 'https://example.com/uploaded-avatar.png',
    createdAt: '2026-04-03T12:00:00Z',
    email: 'alice@example.com',
    nickname: 'Alice',
    updatedAt: '2026-04-20T12:10:00Z',
    userId: 'user-1',
  });
});

test('supports canonical email and phone binding methods explicitly', async () => {
  userCenterNodeState.client = {
    bindUserEmail: async (payload) => ({
      data: {
        id: 'user-1',
        uuid: 'user-1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:05:00Z',
        userId: 'user-1',
        nickname: 'Alice',
        email: payload.email,
      },
    }),
    bindUserPhone: async (payload) => ({
      data: {
        id: 'user-1',
        uuid: 'user-1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:07:00Z',
        userId: 'user-1',
        nickname: 'Alice',
        phone: payload.phone,
      },
    }),
    unbindUserEmail: async () => ({
      data: {
        id: 'user-1',
        uuid: 'user-1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:08:00Z',
        userId: 'user-1',
        nickname: 'Alice',
      },
    }),
    unbindUserPhone: async () => ({
      data: {
        id: 'user-1',
        uuid: 'user-1',
        createdAt: '2026-04-03T12:00:00Z',
        updatedAt: '2026-04-20T12:09:00Z',
        userId: 'user-1',
        nickname: 'Alice',
      },
    }),
  };

  await assert.deepEqual(
    await userCenterService.bindEmail('alice@example.com', '123456'),
    {
      createdAt: '2026-04-03T12:00:00Z',
      email: 'alice@example.com',
      nickname: 'Alice',
      updatedAt: '2026-04-20T12:05:00Z',
      userId: 'user-1',
    },
  );
  await assert.deepEqual(
    await userCenterService.bindPhone('18800001111', '654321'),
    {
      createdAt: '2026-04-03T12:00:00Z',
      nickname: 'Alice',
      phone: '18800001111',
      updatedAt: '2026-04-20T12:07:00Z',
      userId: 'user-1',
    },
  );
  await assert.deepEqual(
    await userCenterService.unbindEmail(),
    {
      createdAt: '2026-04-03T12:00:00Z',
      nickname: 'Alice',
      updatedAt: '2026-04-20T12:08:00Z',
      userId: 'user-1',
    },
  );
  await assert.deepEqual(
    await userCenterService.unbindPhone(),
    {
      createdAt: '2026-04-03T12:00:00Z',
      nickname: 'Alice',
      updatedAt: '2026-04-20T12:09:00Z',
      userId: 'user-1',
    },
  );
});
