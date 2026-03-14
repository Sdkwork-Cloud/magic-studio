import type { PlatformAPI } from '../types';
import type { PlatformRuntime } from './types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const ensureOkResponse = async (response: Response, url: string): Promise<Response> => {
  if (response.ok) {
    return response;
  }
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  const suffix = body ? `: ${body}` : '';
  throw new Error(`[PlatformRuntime] HTTP ${response.status} for ${url}${suffix}`);
};

const parseJsonOrFallback = <T>(raw: string | null, fallbackValue: T): T => {
  if (!raw) {
    return fallbackValue;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallbackValue;
  }
};

const parseJsonOrThrow = <T>(raw: string, context: string): T => {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[PlatformRuntime] Invalid JSON in ${context}: ${message}`);
  }
};

export const createPlatformRuntime = (api: PlatformAPI): PlatformRuntime => {
  const runtime: PlatformRuntime = {
    raw: api,
    bridge: {
      available: (): boolean => typeof api.invoke === 'function',
      invoke: async <T = unknown>(command: string, payload?: Record<string, unknown>): Promise<T> => {
        if (typeof api.invoke !== 'function') {
          throw new Error('[PlatformRuntime] Native invoke is not available on this platform');
        }
        return api.invoke<T>(command, payload);
      },
      listen: async <T = unknown>(
        event: string,
        callback: (payload: T) => void
      ): Promise<() => void> => {
        if (typeof api.listen === 'function') {
          return api.listen<T>(event, callback);
        }
        return () => {};
      }
    },
    system: {
      kind: (): ReturnType<PlatformAPI['getPlatform']> => api.getPlatform(),
      os: async (): Promise<Awaited<ReturnType<PlatformAPI['getOsType']>>> => api.getOsType(),
      deviceId: async (): Promise<string> => api.getDeviceId(),
      metadata: async (): Promise<Awaited<ReturnType<PlatformAPI['getAppMetadata']>>> => api.getAppMetadata(),
      path: async (name): Promise<string> => api.getPath(name),
      theme: async (): Promise<Awaited<ReturnType<PlatformAPI['getSystemTheme']>>> => api.getSystemTheme(),
      isOnline: async (): Promise<boolean> => api.isOnline(),
      commandExists: async (command: string): Promise<boolean> => api.checkCommandExists(command)
    },
    storage: {
      get: async (key: string): Promise<string | null> => api.getStorage(key),
      set: async (key: string, value: string): Promise<void> => {
        await api.setStorage(key, value);
      },
      remove: async (key: string): Promise<void> => {
        await api.removeStorage(key);
      },
      clear: async (): Promise<void> => {
        await api.clearStorage();
      },
      getJson: async <T>(key: string, fallbackValue: T): Promise<T> => {
        const rawValue = await api.getStorage(key);
        return parseJsonOrFallback(rawValue, fallbackValue);
      },
      setJson: async <T>(key: string, value: T): Promise<void> => {
        await api.setStorage(key, JSON.stringify(value));
      }
    },
    fileSystem: {
      selectFile: async (options): Promise<string[]> => api.selectFile(options),
      selectDir: async (): Promise<string | null> => api.selectDir(),
      saveText: async (content: string, filename: string): Promise<string | null> =>
        api.saveFile(content, filename),
      readDir: async (path: string): Promise<Awaited<ReturnType<PlatformAPI['readDir']>>> => api.readDir(path),
      readText: async (path: string): Promise<string> => api.readFile(path),
      writeText: async (path: string, content: string): Promise<void> => {
        await api.writeFile(path, content);
      },
      readBinary: async (path: string): Promise<Uint8Array> => {
        const bytes = await api.readFileBinary(path);
        return new Uint8Array(bytes);
      },
      writeBinary: async (path: string, content: Uint8Array): Promise<void> => {
        const copy = new Uint8Array(content.byteLength);
        copy.set(content);
        await api.writeFileBinary(path, copy);
      },
      readBlob: async (path: string): Promise<Blob> => api.readFileBlob(path),
      writeBlob: async (path: string, content: Blob): Promise<void> => {
        await api.writeFileBlob(path, content);
      },
      readJson: async <T>(path: string): Promise<T> => {
        const rawValue = await api.readFile(path);
        return parseJsonOrThrow<T>(rawValue, `file "${path}"`);
      },
      writeJson: async <T>(path: string, value: T, indent = 2): Promise<void> => {
        await api.writeFile(path, JSON.stringify(value, null, indent));
      },
      stat: async (path: string): Promise<Awaited<ReturnType<PlatformAPI['stat']>>> => api.stat(path),
      exists: async (path: string): Promise<boolean> => {
        try {
          await api.stat(path);
          return true;
        } catch {
          return false;
        }
      },
      createDir: async (path: string): Promise<void> => {
        await api.createDir(path);
      },
      remove: async (path: string): Promise<void> => {
        await api.delete(path);
      },
      rename: async (oldPath: string, newPath: string): Promise<void> => {
        await api.rename(oldPath, newPath);
      },
      copy: async (sourcePath: string, destinationPath: string): Promise<void> => {
        await api.copyFile(sourcePath, destinationPath);
      },
      convertFileSrc: (filePath: string): string => api.convertFileSrc(filePath)
    },
    network: {
      request: async (url: string, options?: RequestInit): Promise<Response> => api.httpRequest(url, options),
      requestJson: async <T>(url: string, options?: RequestInit): Promise<T> => {
        const response = await ensureOkResponse(await api.httpRequest(url, options), url);
        const rawText = await response.text();
        return parseJsonOrThrow<T>(rawText, `response "${url}"`);
      },
      requestText: async (url: string, options?: RequestInit): Promise<string> => {
        const response = await ensureOkResponse(await api.httpRequest(url, options), url);
        return response.text();
      },
      requestBinary: async (url: string, options?: RequestInit): Promise<Uint8Array> => {
        const response = await ensureOkResponse(await api.httpRequest(url, options), url);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      },
      downloadToFile: async (url: string, destinationPath: string, options?: RequestInit): Promise<void> => {
        const bytes = await runtime.network.requestBinary(url, options);
        await api.writeFileBinary(destinationPath, bytes);
      }
    },
    app: {
      restart: async (): Promise<void> => api.restartApp(),
      quit: async (): Promise<void> => api.quitApp(),
      toggleDevTools: async (): Promise<void> => api.toggleDevTools(),
      checkForUpdates: async (): Promise<Awaited<ReturnType<PlatformAPI['checkForUpdates']>>> =>
        api.checkForUpdates(),
      installUpdate: async (): Promise<void> => api.installUpdate()
    },
    window: {
      startDragging: async (): Promise<void> => api.startDragging(),
      minimize: async (): Promise<void> => api.minimizeWindow(),
      maximize: async (): Promise<void> => api.maximizeWindow(),
      close: async (): Promise<void> => api.closeWindow(),
      setFullscreen: async (fullscreen: boolean): Promise<void> => api.setFullscreen(fullscreen),
      setTitle: async (title: string): Promise<void> => api.setTitle(title),
      setAppBadge: async (count: number): Promise<void> => api.setAppBadge(count)
    },
    dialog: {
      confirm: async (
        message: string,
        title?: string,
        type: 'info' | 'warning' | 'error' = 'info'
      ): Promise<boolean> => api.confirm(message, title, type),
      notify: async (title: string, body: string): Promise<void> => api.notify(title, body)
    },
    clipboard: {
      copy: async (text: string): Promise<void> => api.copy(text),
      paste: async (): Promise<string> => api.paste()
    },
    shell: {
      openExternal: async (url: string): Promise<void> => api.openExternal(url),
      showItemInFolder: async (path: string): Promise<void> => api.showItemInFolder(path)
    },
    terminal: {
      create: async (
        shell: string,
        size,
        env?: Record<string, string>,
        initialCommand?: string
      ): Promise<string> => api.createPty(shell, size, env, initialCommand),
      start: async (pid: string): Promise<void> => api.startPty(pid),
      resize: async (pid: string, size): Promise<void> => api.resizePty(pid, size),
      write: async (pid: string, data: string): Promise<void> => api.writePty(pid, data),
      onData: (pid: string, callback: (data: string | Uint8Array) => void): (() => void) =>
        api.onPtyData(pid, callback),
      kill: async (pid: string): Promise<void> => api.killPty(pid),
      syncSessions: async (activeIds: string[]): Promise<void> => api.syncPtySessions(activeIds)
    },
    browser: {
      supported: (): boolean => api.isProfessionalBrowserSupported(),
      create: async (container, options): Promise<Awaited<ReturnType<PlatformAPI['createBrowser']>>> =>
        api.createBrowser(container, options)
    }
  };

  return runtime;
};

export const encodeTextToBytes = (content: string): Uint8Array => textEncoder.encode(content);
export const decodeBytesToText = (content: Uint8Array): string => textDecoder.decode(content);
