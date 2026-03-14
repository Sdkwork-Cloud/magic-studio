import type {
  AppMetadata,
  BrowserInstance,
  BrowserOptions,
  FileEntry,
  FileStat,
  PlatformAPI,
  SystemPath,
  SystemTheme,
  TerminalSize,
  UpdateInfo
} from '../types';

export type PlatformRuntimeKind = ReturnType<PlatformAPI['getPlatform']>;
export type PlatformRuntimeOs = Awaited<ReturnType<PlatformAPI['getOsType']>>;

export interface PlatformSystemCapability {
  kind(): PlatformRuntimeKind;
  os(): Promise<PlatformRuntimeOs>;
  deviceId(): Promise<string>;
  metadata(): Promise<AppMetadata>;
  path(name: SystemPath): Promise<string>;
  theme(): Promise<SystemTheme>;
  isOnline(): Promise<boolean>;
  commandExists(command: string): Promise<boolean>;
}

export interface PlatformStorageCapability {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getJson<T>(key: string, fallbackValue: T): Promise<T>;
  setJson<T>(key: string, value: T): Promise<void>;
}

export interface PlatformFileSystemCapability {
  selectFile(options?: { multiple?: boolean; extensions?: string[] }): Promise<string[]>;
  selectDir(): Promise<string | null>;
  saveText(content: string, filename: string): Promise<string | null>;
  readDir(path: string): Promise<FileEntry[]>;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
  readBinary(path: string): Promise<Uint8Array>;
  writeBinary(path: string, content: Uint8Array): Promise<void>;
  readBlob(path: string): Promise<Blob>;
  writeBlob(path: string, content: Blob): Promise<void>;
  readJson<T>(path: string): Promise<T>;
  writeJson<T>(path: string, value: T, indent?: number): Promise<void>;
  stat(path: string): Promise<FileStat>;
  exists(path: string): Promise<boolean>;
  createDir(path: string): Promise<void>;
  remove(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copy(sourcePath: string, destinationPath: string): Promise<void>;
  convertFileSrc(filePath: string): string;
}

export interface PlatformNetworkCapability {
  request(url: string, options?: RequestInit): Promise<Response>;
  requestJson<T>(url: string, options?: RequestInit): Promise<T>;
  requestText(url: string, options?: RequestInit): Promise<string>;
  requestBinary(url: string, options?: RequestInit): Promise<Uint8Array>;
  downloadToFile(url: string, destinationPath: string, options?: RequestInit): Promise<void>;
}

export interface PlatformWindowCapability {
  startDragging(): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
  setFullscreen(fullscreen: boolean): Promise<void>;
  setTitle(title: string): Promise<void>;
  setAppBadge(count: number): Promise<void>;
}

export interface PlatformAppCapability {
  restart(): Promise<void>;
  quit(): Promise<void>;
  toggleDevTools(): Promise<void>;
  checkForUpdates(): Promise<UpdateInfo | null>;
  installUpdate(): Promise<void>;
}

export interface PlatformDialogCapability {
  confirm(message: string, title?: string, type?: 'info' | 'warning' | 'error'): Promise<boolean>;
  notify(title: string, body: string): Promise<void>;
}

export interface PlatformClipboardCapability {
  copy(text: string): Promise<void>;
  paste(): Promise<string>;
}

export interface PlatformShellCapability {
  openExternal(url: string): Promise<void>;
  showItemInFolder(path: string): Promise<void>;
}

export interface PlatformTerminalCapability {
  create(shell: string, size: TerminalSize, env?: Record<string, string>, initialCommand?: string): Promise<string>;
  start(pid: string): Promise<void>;
  resize(pid: string, size: TerminalSize): Promise<void>;
  write(pid: string, data: string): Promise<void>;
  onData(pid: string, callback: (data: string | Uint8Array) => void): () => void;
  kill(pid: string): Promise<void>;
  syncSessions(activeIds: string[]): Promise<void>;
}

export interface PlatformBrowserCapability {
  supported(): boolean;
  create(container: HTMLElement, options: BrowserOptions): Promise<BrowserInstance>;
}

export interface PlatformNativeBridgeCapability {
  available(): boolean;
  invoke<T = unknown>(command: string, payload?: Record<string, unknown>): Promise<T>;
  listen<T = unknown>(event: string, callback: (payload: T) => void): Promise<() => void>;
}

export interface PlatformRuntime {
  readonly raw: PlatformAPI;
  readonly bridge: PlatformNativeBridgeCapability;
  readonly system: PlatformSystemCapability;
  readonly storage: PlatformStorageCapability;
  readonly fileSystem: PlatformFileSystemCapability;
  readonly network: PlatformNetworkCapability;
  readonly app: PlatformAppCapability;
  readonly window: PlatformWindowCapability;
  readonly dialog: PlatformDialogCapability;
  readonly clipboard: PlatformClipboardCapability;
  readonly shell: PlatformShellCapability;
  readonly terminal: PlatformTerminalCapability;
  readonly browser: PlatformBrowserCapability;
}
