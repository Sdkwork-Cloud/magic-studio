import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import LoginPage from './LoginPage';

const mockUseRouter = vi.fn();
const mockUseTranslation = vi.fn();

let mockPlatformMode: 'web' | 'desktop' = 'web';

vi.mock('@sdkwork/react-core', () => ({
  ROUTES: {
    HOME: '/',
  },
  useRouter: () => mockUseRouter(),
  platform: {
    getPlatform: () => mockPlatformMode,
  },
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('@sdkwork/react-commons', () => ({
  WindowControls: () =>
    React.createElement('div', { 'data-testid': 'window-controls' }, 'Minimize Maximize Close'),
}));

vi.mock('../index', () => ({
  LoginForm: () => React.createElement('div', null, 'LoginForm'),
  RegisterForm: () => React.createElement('div', null, 'RegisterForm'),
  ForgotPasswordForm: () => React.createElement('div', null, 'ForgotPasswordForm'),
  QrCodeLogin: () => React.createElement('div', null, 'QrCodeLogin'),
}));

describe('Auth LoginPage', () => {
  beforeEach(() => {
    mockPlatformMode = 'web';
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
    });
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders desktop window controls on the desktop login shell', () => {
    mockPlatformMode = 'desktop';

    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('data-testid="window-controls"');
  });

  it('does not render desktop window controls on the web login shell', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).not.toContain('data-testid="window-controls"');
  });
});
