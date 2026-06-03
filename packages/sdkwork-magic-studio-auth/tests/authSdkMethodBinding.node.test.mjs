import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

const authControllerState = {
  currentSession: null,
  loginCalls: [],
  logoutCalls: 0,
  phoneLoginCalls: [],
};

globalThis.__authControllerNodeTestState = authControllerState;

registerHooks({
  resolve(specifier, context, defaultResolve) {
    if (specifier === './appAuthService.ts') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            const state = globalThis.__authControllerNodeTestState;
            export const appAuthService = {
              async checkQrCodeStatus() {
                return { status: 'pending' };
              },
              async generateQrCode() {
                return { qrKey: 'qr-key' };
              },
              async getCurrentSession() {
                return state.currentSession;
              },
              async login(payload) {
                state.loginCalls.push(payload);
                state.currentSession = {
                  accessToken: 'access-token',
                  authToken: 'auth-token',
                  displayName: 'Alice',
                  email: 'alice@example.com',
                  refreshToken: 'refresh-token',
                  userId: 'user-1',
                  username: payload.username,
                };
                return state.currentSession;
              },
              async loginWithPhone(payload) {
                state.phoneLoginCalls.push(payload);
                state.currentSession = {
                  accessToken: 'access-token',
                  authToken: 'auth-token',
                  displayName: 'Alice',
                  phone: payload.phone,
                  refreshToken: 'refresh-token',
                  userId: 'user-1',
                  username: payload.phone,
                };
                return state.currentSession;
              },
              async logout() {
                state.logoutCalls += 1;
                state.currentSession = null;
              },
              async refreshToken() {
                return state.currentSession;
              },
              async register(payload) {
                state.currentSession = {
                  accessToken: 'access-token',
                  authToken: 'auth-token',
                  displayName: payload.username,
                  email: payload.email,
                  refreshToken: 'refresh-token',
                  userId: 'user-1',
                  username: payload.username,
                };
                return state.currentSession;
              },
              async requestPasswordReset() {},
              async resetPassword() {},
              async sendVerifyCode() {},
              async verifyCode() {
                return true;
              },
            };
          `),
      };
    }

    if (specifier === '@sdkwork/magic-studio-core/platform') {
      return {
        shortCircuit: true,
        url:
          'data:text/javascript,' +
          encodeURIComponent(`
            export function getPlatformRuntime() {
              return {
                system: {
                  kind: () => 'web',
                },
              };
            }
            export function isBrowserHostedRuntimeKind(kind) {
              return kind === 'server' || kind === 'web';
            }
            export function isDesktopShellRuntimeKind(kind) {
              return kind === 'desktop';
            }
          `),
      };
    }

    return defaultResolve(specifier, context, defaultResolve);
  },
});

const { createMagicAuthController } = await import('../src/services/sdkworkAuthBridge.ts');

test('creates auth controllers that hydrate and update canonical auth state', async () => {
  authControllerState.currentSession = null;
  authControllerState.loginCalls.length = 0;
  authControllerState.logoutCalls = 0;

  const controller = createMagicAuthController();

  const bootstrappedAnonymous = await controller.bootstrap();
  assert.equal(bootstrappedAnonymous.isAuthenticated, false);
  assert.equal(bootstrappedAnonymous.status, 'anonymous');

  const session = await controller.signIn({
    password: 'secret',
    username: 'demo-user',
  });

  assert.deepEqual(authControllerState.loginCalls, [
    {
      password: 'secret',
      username: 'demo-user',
    },
  ]);
  assert.equal(session.user?.username, 'demo-user');
  assert.equal(controller.getState().isAuthenticated, true);
  assert.equal(controller.getState().user?.email, 'alice@example.com');

  await controller.signOut();
  assert.equal(authControllerState.logoutCalls, 1);
  assert.equal(controller.getState().isAuthenticated, false);
  assert.equal(controller.getState().status, 'anonymous');
});

test('auth service normalizes upstream phone-login device values before calling the canonical app auth service', async () => {
  authControllerState.currentSession = null;
  authControllerState.phoneLoginCalls.length = 0;

  const controller = createMagicAuthController();

  await controller.signInWithPhoneCode({
    code: '246810',
    deviceType: 'ios',
    phone: '13800000000',
  });

  assert.deepEqual(authControllerState.phoneLoginCalls, [
    {
      code: '246810',
      deviceType: 'web',
      phone: '13800000000',
    },
  ]);
});

test('auth controller preserves the session-bridge contract even when the backend does not implement it yet', async () => {
  const controller = createMagicAuthController();

  await assert.rejects(
    () =>
      controller.signInWithSessionBridge({
        email: 'bridge@example.com',
        subject: 'bridge-subject',
      }),
    /session bridge|unified user center|not implemented/i,
  );
});
