/** @vitest-environment jsdom */

import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/tests/support/reactTesting';
import { LoginPage } from '../src/pages/LoginPage';

const mockUseRouter = vi.fn();
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

vi.mock('@sdkwork/magic-studio-core', () => ({
  ROUTES: {
    AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
    AUTH_REGISTER: '/auth/register',
    HOME: '/',
  },
  platform: {
    getPlatform: () => 'web',
  },
  useRouter: () => mockUseRouter(),
}));

vi.mock('@sdkwork/ui-pc-react/components/ui/feedback', () => ({
  SdkworkToaster: () => null,
  StatusNotice: ({ children }: PropsWithChildren) => <>{children}</>,
  sdkToast: {
    error: vi.fn(),
  },
}));

vi.mock('../src/theme/SdkworkIamThemeProvider', () => ({
  SdkworkIamThemeProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}));

describe('auth compatibility surface', () => {
  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
    });
  });

  afterEach(() => {
    const routerContextWarnings = consoleWarnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes('[useRouter] Router context not found')
    );

    expect(routerContextWarnings).toHaveLength(0);
    consoleWarnSpy.mockRestore();
  });

  it('renders the shared register experience on the reusable auth register route', () => {
    render(
      <MemoryRouter initialEntries={['/auth/register']}>
        <Routes>
          <Route path="/auth/register" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('auth.createAccount').length).toBeGreaterThan(0);
  });

  it('renders the shared password recovery experience on the reusable auth forgot route', () => {
    render(
      <MemoryRouter initialEntries={['/auth/forgot-password']}>
        <Routes>
          <Route path="/auth/forgot-password" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('auth.resetPassword').length).toBeGreaterThan(0);
  });
});
