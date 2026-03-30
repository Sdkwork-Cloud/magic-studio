import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let capturedLoginSuccess: (() => void) | undefined;

const mockNavigate = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  ROUTES: {
    HOME: '/',
  },
  useRouter: () => mockUseRouter(),
}));

vi.mock('@sdkwork/react-auth', () => ({
  LoginPage: ({ onLoginSuccess }: { onLoginSuccess?: () => void }) => {
    capturedLoginSuccess = onLoginSuccess;
    return React.createElement('div', null, 'AuthLoginPage');
  },
}));

describe('app login redirect', () => {
  beforeEach(() => {
    capturedLoginSuccess = undefined;
    mockNavigate.mockReset();
    mockUseRouter.mockReset();
  });

  it('returns to the requested protected route after login', async () => {
    mockUseRouter.mockReturnValue({
      navigate: mockNavigate,
      currentQuery: 'redirect=%2Fprofile%3Ftab%3Dsecurity',
    });

    const { default: LoginPage } = await import('./LoginPage');

    renderToStaticMarkup(<LoginPage />);
    capturedLoginSuccess?.();

    expect(mockNavigate).toHaveBeenCalledWith('/profile', 'tab=security');
  });

  it('falls back to home when no redirect is present', async () => {
    mockUseRouter.mockReturnValue({
      navigate: mockNavigate,
      currentQuery: '',
    });

    const { default: LoginPage } = await import('./LoginPage');

    renderToStaticMarkup(<LoginPage />);
    capturedLoginSuccess?.();

    expect(mockNavigate).toHaveBeenCalledWith('/', '');
  });
});
