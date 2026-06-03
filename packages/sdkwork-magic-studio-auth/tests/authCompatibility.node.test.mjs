import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveCompatAuthUser,
  shouldInvokeLoginSuccess,
} from '../src/authCompatibility.ts';

test('treats navigation outside auth routes as login-success callback transitions', () => {
  assert.equal(shouldInvokeLoginSuccess('/'), true);
  assert.equal(shouldInvokeLoginSuccess('/workspace/home'), true);
  assert.equal(shouldInvokeLoginSuccess('/login'), false);
  assert.equal(shouldInvokeLoginSuccess('/auth/login'), false);
  assert.equal(shouldInvokeLoginSuccess('/auth/register'), false);
  assert.equal(shouldInvokeLoginSuccess('/auth/forgot-password'), false);
  assert.equal(shouldInvokeLoginSuccess('/auth/oauth/callback/wechat'), false);
});

test('maps shared auth users onto the legacy auth store user shape with stable fallbacks', () => {
  const mapped = resolveCompatAuthUser(
    {
      avatarUrl: 'https://example.com/avatar.png',
      displayName: '',
      email: 'alice@example.com',
      id: '',
      username: 'alice',
    },
    1700000000000,
  );

  assert.deepEqual(mapped, {
    avatar: 'https://example.com/avatar.png',
    avatarUrl: 'https://example.com/avatar.png',
    createdAt: 1700000000000,
    email: 'alice@example.com',
    id: 'alice',
    name: 'alice',
    updatedAt: 1700000000000,
    username: 'alice',
    uuid: 'alice',
  });
});
