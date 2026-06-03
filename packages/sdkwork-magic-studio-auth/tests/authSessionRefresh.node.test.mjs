import assert from 'node:assert/strict';
import test from 'node:test';

import { refreshAuthStoreSession } from '../src/store/authSessionRefresh.ts';

test('refreshes the legacy auth session before re-bootstrapping the shared auth controller', async () => {
  const calls = [];

  await refreshAuthStoreSession({
    clearSession: async () => {
      calls.push('clear');
    },
    controller: {
      async bootstrap() {
        calls.push('bootstrap');
      },
    },
    refreshSession: async (refreshToken) => {
      calls.push(['refresh', refreshToken]);
    },
    refreshToken: 'stored-refresh-token',
  });

  assert.deepEqual(calls, [
    ['refresh', 'stored-refresh-token'],
    'bootstrap',
  ]);
});

test('clears the persisted auth session and re-bootstraps when refresh fails', async () => {
  const calls = [];
  const refreshError = new Error('refresh failed');

  await assert.rejects(
    () =>
      refreshAuthStoreSession({
        clearSession: async () => {
          calls.push('clear');
        },
        controller: {
          async bootstrap() {
            calls.push('bootstrap');
          },
        },
        refreshSession: async () => {
          calls.push('refresh');
          throw refreshError;
        },
        refreshToken: 'stale-refresh-token',
      }),
    refreshError,
  );

  assert.deepEqual(calls, [
    'refresh',
    'clear',
    'bootstrap',
  ]);
});
