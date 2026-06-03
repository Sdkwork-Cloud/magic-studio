import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

const authServiceNodeState = {
  clearSessionCalls: 0,
  persistedSessions: [],
  runtime: {
    system: {
      kind: () => 'web',
    },
  },
  deviceType: 'web',
  serverClient: {},
  storedSession: {
    authToken: 'stale-auth-token',
    refreshToken: 'stored-refresh-token',
  },
};

globalThis.__appAuthServiceNodeTestState = authServiceNodeState;

registerHooks({
  resolve(specifier, context, defaultResolve) {
    if (specifier === '@sdkwork/magic-studio-core') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            const state = globalThis.__appAuthServiceNodeTestState;
            export function readDefaultPlatformRuntime() {
              return state.runtime;
            }
            export function createRuntimeMagicStudioServerClient() {
              return state.serverClient;
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
            const state = globalThis.__appAuthServiceNodeTestState;
            export function readDefaultPlatformRuntime() {
              return state.runtime;
            }
            export function createRuntimeMagicStudioServerClient() {
              return state.serverClient;
            }
            export function clearAppSdkSessionTokens() {
              state.clearSessionCalls += 1;
            }
            export function persistAppSdkSessionTokens(session) {
              state.persistedSessions.push(session);
            }
            export function readAppSdkSessionTokens() {
              return state.storedSession;
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

    if (specifier === '../runtime/authDeviceType.ts') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            const state = globalThis.__appAuthServiceNodeTestState;
            export function resolveAuthDeviceType() {
              return state.deviceType;
            }
          `),
      };
    }

    return defaultResolve(specifier, context, defaultResolve);
  },
});

const { appAuthService } = await import('../src/services/appAuthService.ts');

test('refreshes the canonical auth session through the runtime server client', async () => {
  authServiceNodeState.clearSessionCalls = 0;
  authServiceNodeState.persistedSessions.length = 0;
  let refreshPayload = null;

  authServiceNodeState.serverClient = {
    async refreshSession(payload) {
      refreshPayload = payload;
      return {
        data: {
          accessToken: 'fresh-access-token',
          authToken: 'fresh-auth-token',
          refreshToken: 'next-refresh-token',
          expiresAt: '2026-04-20T23:59:59Z',
          user: {
            displayName: 'Alice',
            email: 'alice@example.com',
            userId: 'user-1',
            username: 'alice',
          },
        },
      };
    },
  };

  const session = await appAuthService.refreshToken();

  assert.deepEqual(refreshPayload, {
    refreshToken: 'stored-refresh-token',
  });
  assert.deepEqual(authServiceNodeState.persistedSessions, [
    {
      accessToken: 'fresh-access-token',
      authToken: 'fresh-auth-token',
      refreshToken: 'next-refresh-token',
    },
  ]);
  assert.deepEqual(session, {
    accessToken: 'fresh-access-token',
    authToken: 'fresh-auth-token',
    displayName: 'Alice',
    email: 'alice@example.com',
    refreshToken: 'next-refresh-token',
    userId: 'user-1',
    username: 'alice',
  });
});

test('clears persisted tokens when the canonical session state is anonymous', async () => {
  authServiceNodeState.clearSessionCalls = 0;
  authServiceNodeState.serverClient = {
    async readAuthSession() {
      return {
        data: {
          isAuthenticated: false,
          session: null,
        },
      };
    },
  };

  const session = await appAuthService.getCurrentSession();

  assert.equal(session, null);
  assert.equal(authServiceNodeState.clearSessionCalls, 1);
});

test('sends centralized auth device type with password login payloads', async () => {
  authServiceNodeState.deviceType = 'web';
  let loginPayload = null;

  authServiceNodeState.serverClient = {
    async login(payload) {
      loginPayload = payload;
      return {
        data: {
          accessToken: 'access-token',
          authToken: 'auth-token',
          refreshToken: 'refresh-token',
          user: {
            displayName: 'Alice',
            userId: 'user-1',
            username: payload.username,
          },
        },
      };
    },
  };

  await appAuthService.login({
    password: 'secret',
    username: 'alice',
  });

  assert.deepEqual(loginPayload, {
    deviceType: 'web',
    password: 'secret',
    username: 'alice',
  });
});

test('preserves explicit phone-login device type and falls back to the centralized helper', async () => {
  authServiceNodeState.deviceType = 'desktop';
  const phoneLoginPayloads = [];

  authServiceNodeState.serverClient = {
    async loginWithPhone(payload) {
      phoneLoginPayloads.push(payload);
      return {
        data: {
          accessToken: 'access-token',
          authToken: 'auth-token',
          refreshToken: 'refresh-token',
          user: {
            displayName: 'Alice',
            phone: payload.phone,
            userId: 'user-1',
            username: payload.phone,
          },
        },
      };
    },
  };

  await appAuthService.loginWithPhone({
    code: '246810',
    deviceType: 'web',
    phone: '13800000000',
  });
  await appAuthService.loginWithPhone({
    code: '135790',
    phone: '13900000000',
  });

  assert.deepEqual(phoneLoginPayloads, [
    {
      code: '246810',
      deviceType: 'web',
      phone: '13800000000',
    },
    {
      code: '135790',
      deviceType: 'desktop',
      phone: '13900000000',
    },
  ]);
});
