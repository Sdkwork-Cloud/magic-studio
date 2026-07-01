/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@/tests/support/reactTesting';
import type { AppSdkClient } from '../useAppSdkClient';

const mocks = vi.hoisted(() => {
  const modules = {
    generation: { id: 'generation-module' },
    auth: { id: 'auth-module' },
  };
  const client = {
    generation: modules.generation,
    auth: modules.auth,
  } as unknown as AppSdkClient;

  return {
    client,
    modules,
    getAppSdkClientConfig: vi.fn(() => ({ baseUrl: 'https://api.example.com' })),
    getAppSdkClientWithSession: vi.fn(() => client),
    initAppSdkClient: vi.fn(() => client),
  };
});

vi.mock('../useAppSdkClient', () => ({
  getAppSdkClientConfig: mocks.getAppSdkClientConfig,
  getAppSdkClientWithSession: mocks.getAppSdkClientWithSession,
  initAppSdkClient: mocks.initAppSdkClient,
}));

import { useSdkworkModule } from '../hooks';

describe('sdk hooks', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('returns the selected sdk module and updates when the selector changes', () => {
    const Harness = ({
      selector,
    }: {
      selector: (client: AppSdkClient) => { id: string };
    }) => {
      const { module, isReady } = useSdkworkModule(selector);
      return <div data-testid="module">{isReady ? module?.id : 'not-ready'}</div>;
    };

    const view = render(
      <Harness selector={(client) => (client as unknown as typeof mocks.modules).generation} />
    );

    expect(view.getByTestId('module').textContent).toBe('generation-module');

    view.rerender(
      <Harness selector={(client) => (client as unknown as typeof mocks.modules).auth} />
    );

    expect(view.getByTestId('module').textContent).toBe('auth-module');
  });

  it('falls back to null when the sdk client is unavailable', () => {
    mocks.getAppSdkClientWithSession.mockImplementationOnce(() => {
      throw new Error('missing client');
    });

    const Harness = () => {
      const { module, isReady } = useSdkworkModule(
        (client) => (client as unknown as typeof mocks.modules).generation
      );
      return <div data-testid="module">{isReady ? module?.id : 'not-ready'}</div>;
    };

    const view = render(<Harness />);

    expect(view.getByTestId('module').textContent).toBe('not-ready');
  });
});
