import type { PlatformRuntime } from '../../runtime/index.ts';

type RuntimeKind = 'desktop' | 'web' | 'server';

export interface NetworkCall {
  url: string;
  init?: RequestInit;
}

export function createJsonResponse(
  payload: unknown,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export function createMockRuntime(
  kind: RuntimeKind,
  requestImpl: (url: string, init?: RequestInit) => Promise<Response>,
): PlatformRuntime {
  return {
    raw: {} as never,
    bridge: {
      available: () => false,
      invoke: async () => {
        throw new Error('native bridge unavailable');
      },
      listen: async () => () => {},
    },
    system: {
      kind: () => kind,
    },
    network: {
      request: requestImpl,
    },
  } as unknown as PlatformRuntime;
}

export function installMockWindowLocation(origin: string): () => void {
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        origin,
      },
    },
  });

  return () => {
    if (typeof previousWindow === 'undefined') {
      Reflect.deleteProperty(globalThis, 'window');
      return;
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    });
  };
}
