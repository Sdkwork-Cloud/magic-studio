import { describe, expect, it } from 'vitest';
import { shouldHydrateStoredSession } from '../src/services/authSessionBootstrap';

describe('auth session bootstrap', () => {
  it('hydrates the app session when a persisted auth token exists even without a cached user snapshot', () => {
    expect(shouldHydrateStoredSession({
      user: null,
      authToken: 'persisted-auth-token',
      refreshToken: 'persisted-refresh-token',
    })).toBe(true);
  });

  it('skips hydration when there is no persisted auth token', () => {
    expect(shouldHydrateStoredSession({
      user: null,
      authToken: null,
      refreshToken: null,
    })).toBe(false);
  });
});
