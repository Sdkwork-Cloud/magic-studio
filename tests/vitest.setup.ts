import { beforeEach, vi } from 'vitest';

function createMatchMedia() {
  return (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => false,
    removeEventListener: () => undefined,
    removeListener: () => undefined,
  });
}

function createIndexedDbStub() {
  const createRequest = (result: unknown) => {
    const request: {
      result: unknown;
      error: unknown;
      onsuccess?: ((event: { target: typeof request }) => void) | null;
      onerror?: ((event: { target: typeof request }) => void) | null;
    } = {
      result,
      error: null,
      onsuccess: null,
      onerror: null,
    };

    queueMicrotask(() => {
      request.onsuccess?.({ target: request });
    });

    return request;
  };

  return {
    open: () => {
      const database = {
        objectStoreNames: {
          contains: () => false,
        },
        createObjectStore: () => ({
          createIndex: () => undefined,
        }),
        transaction: () => ({
          objectStore: () => ({
            get: () => createRequest(undefined),
            put: () => createRequest(undefined),
            getAll: () => createRequest([]),
          }),
        }),
      };

      const request: {
        result: typeof database;
        error: unknown;
        onsuccess?: ((event: { target: typeof request }) => void) | null;
        onerror?: ((event: { target: typeof request }) => void) | null;
        onupgradeneeded?: ((event: { target: typeof request }) => void) | null;
      } = {
        result: database,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      queueMicrotask(() => {
        request.onupgradeneeded?.({ target: request });
        request.onsuccess?.({ target: request });
      });

      return request;
    },
  };
}

function installBrowserPolyfills() {
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    const matchMedia = createMatchMedia();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia,
      writable: true,
    });
    vi.stubGlobal('matchMedia', matchMedia);
  }

  if (typeof globalThis.indexedDB === 'undefined') {
    vi.stubGlobal('indexedDB', createIndexedDbStub());
  }
}

installBrowserPolyfills();

beforeEach(() => {
  installBrowserPolyfills();
});
