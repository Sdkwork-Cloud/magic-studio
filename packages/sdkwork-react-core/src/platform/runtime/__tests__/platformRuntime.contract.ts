import type { PlatformAPI } from '../../types';
import { createPlatformRuntime } from '../createPlatformRuntime';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`[platform-runtime-contract] ${message}`);
  }
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createMockPlatform = (): PlatformAPI => {
  const storage = new Map<string, string>();
  const files = new Map<string, Uint8Array>();

  const api: PlatformAPI = {
    getPlatform: () => 'web',
    getOsType: async () => 'windows',
    getDeviceId: async () => 'mock-device',
    getAppMetadata: async () => ({ name: 'mock', version: '1.0.0' }),
    getPath: async () => '/tmp',
    getSystemTheme: async () => 'light',
    restartApp: async () => {},
    quitApp: async () => {},
    toggleDevTools: async () => {},
    startDragging: async () => {},
    minimizeWindow: async () => {},
    maximizeWindow: async () => {},
    closeWindow: async () => {},
    setFullscreen: async () => {},
    setTitle: async () => {},
    setAppBadge: async () => {},
    setStorage: async (key: string, value: string) => {
      storage.set(key, value);
    },
    getStorage: async (key: string) => storage.get(key) ?? null,
    removeStorage: async (key: string) => {
      storage.delete(key);
    },
    clearStorage: async () => {
      storage.clear();
    },
    copy: async () => {},
    paste: async () => '',
    openExternal: async () => {},
    checkCommandExists: async () => false,
    httpRequest: async (url: string) => {
      if (url.endsWith('/json')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.endsWith('/bin')) {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    },
    isOnline: async () => true,
    notify: async () => {},
    confirm: async () => true,
    checkForUpdates: async () => null,
    installUpdate: async () => {},
    showItemInFolder: async () => {},
    selectFile: async () => [],
    selectDir: async () => null,
    readDir: async () => [],
    readFile: async (path: string) => textDecoder.decode(files.get(path) ?? new Uint8Array()),
    writeFile: async (path: string, content: string) => {
      files.set(path, textEncoder.encode(content));
    },
    saveFile: async () => null,
    readFileBinary: async (path: string) => files.get(path) ?? new Uint8Array(),
    writeFileBinary: async (path: string, content: Uint8Array) => {
      files.set(path, new Uint8Array(content));
    },
    readFileBlob: async (path: string) => {
      const bytes = files.get(path) ?? new Uint8Array();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      return new Blob([copy.buffer]);
    },
    writeFileBlob: async (path: string, content: Blob) => {
      const buffer = await content.arrayBuffer();
      files.set(path, new Uint8Array(buffer));
    },
    stat: async (path: string) => {
      const bytes = files.get(path);
      if (!bytes) {
        throw new Error('not found');
      }
      return {
        type: 'file',
        size: bytes.byteLength,
        lastModified: Date.now()
      };
    },
    convertFileSrc: (filePath: string) => filePath,
    createDir: async () => {},
    delete: async (path: string) => {
      files.delete(path);
    },
    rename: async (oldPath: string, newPath: string) => {
      const bytes = files.get(oldPath);
      if (!bytes) {
        throw new Error('not found');
      }
      files.set(newPath, bytes);
      files.delete(oldPath);
    },
    copyFile: async (source: string, destination: string) => {
      const bytes = files.get(source);
      if (!bytes) {
        throw new Error('not found');
      }
      files.set(destination, new Uint8Array(bytes));
    },
    createPty: async () => 'mock-pty',
    startPty: async () => {},
    resizePty: async () => {},
    writePty: async () => {},
    onPtyData: () => () => {},
    killPty: async () => {},
    syncPtySessions: async () => {},
    isProfessionalBrowserSupported: () => false,
    createBrowser: async () => {
      throw new Error('not supported');
    }
  };

  return api;
};

const run = async (): Promise<void> => {
  const runtime = createPlatformRuntime(createMockPlatform());
  assert(runtime.bridge.available() === false, 'bridge should be unavailable without invoke adapter');

  await runtime.storage.setJson('settings', { theme: 'dark' });
  const settings = await runtime.storage.getJson<{ theme: string }>('settings', { theme: 'light' });
  assert(settings.theme === 'dark', 'storage json roundtrip failed');

  await runtime.fileSystem.writeJson('/tmp/config.json', { app: 'magic-studio' });
  const config = await runtime.fileSystem.readJson<{ app: string }>('/tmp/config.json');
  assert(config.app === 'magic-studio', 'filesystem json roundtrip failed');
  const exists = await runtime.fileSystem.exists('/tmp/config.json');
  assert(exists, 'filesystem exists should return true for saved file');

  const payload = await runtime.network.requestJson<{ ok: boolean }>('https://example.com/json');
  assert(payload.ok === true, 'network json request failed');

  await runtime.network.downloadToFile('https://example.com/bin', '/tmp/blob.bin');
  const binary = await runtime.fileSystem.readBinary('/tmp/blob.bin');
  assert(binary.byteLength === 3, 'downloadToFile should persist binary payload');

  let hasHttpError = false;
  try {
    await runtime.network.requestJson('https://example.com/not-found');
  } catch {
    hasHttpError = true;
  }
  assert(hasHttpError, 'network request should throw on non-ok status');
};

void run();
