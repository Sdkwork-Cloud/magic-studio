import { describe, expect, it } from 'vitest';
import {
  buildLoginRedirectQuery,
  resolveAuthRouteAccess,
  resolvePostLoginTarget,
} from './authRouteGuard';

describe('auth route guard', () => {
  it('waits for auth restoration before deciding protected-route access', () => {
    expect(resolveAuthRouteAccess({
      requiresAuth: true,
      isAuthenticated: false,
      isAuthResolved: false,
    })).toBe('pending');
  });

  it('redirects unauthenticated users after auth restoration completes', () => {
    expect(resolveAuthRouteAccess({
      requiresAuth: true,
      isAuthenticated: false,
      isAuthResolved: true,
    })).toBe('redirect');
  });

  it('allows authenticated users and public routes through immediately', () => {
    expect(resolveAuthRouteAccess({
      requiresAuth: true,
      isAuthenticated: true,
      isAuthResolved: true,
    })).toBe('allow');
    expect(resolveAuthRouteAccess({
      requiresAuth: false,
      isAuthenticated: false,
      isAuthResolved: false,
    })).toBe('allow');
  });

  it('builds and restores login redirect targets with query strings', () => {
    expect(buildLoginRedirectQuery('/profile', 'tab=security')).toBe(
      'redirect=%2Fprofile%3Ftab%3Dsecurity'
    );
    expect(resolvePostLoginTarget('redirect=%2Fprofile%3Ftab%3Dsecurity', '/')).toEqual({
      path: '/profile',
      query: 'tab=security',
    });
  });

  it('falls back safely when no login redirect target is present', () => {
    expect(resolvePostLoginTarget('', '/')).toEqual({
      path: '/',
      query: '',
    });
  });

  it('rejects unsafe redirect targets and falls back to the default route', () => {
    expect(resolvePostLoginTarget('redirect=https%3A%2F%2Fevil.example%2Fphish', '/')).toEqual({
      path: '/',
      query: '',
    });
    expect(resolvePostLoginTarget('redirect=%2F%2Fevil.example%2Fphish', '/')).toEqual({
      path: '/',
      query: '',
    });
  });
});
