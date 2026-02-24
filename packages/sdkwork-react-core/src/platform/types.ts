
export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface FileEntry {
  id?: string;
  uuid: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

export interface FileStat {
  type: 'file' | 'directory' | 'symlink' | 'unknown';
  size: number;
  lastModified: number;
  createdAt?: number;
  readonly?: boolean;
}

export interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}

export interface AppMetadata {
  name: string;
  version: string;
  tauriVersion?: string;
}

export type SystemPath = 'home' | 'appData' | 'desktop' | 'documents' | 'downloads' | 'temp';

export type SystemTheme = 'dark' | 'light';

export interface PlatformAPI {
  getPlatform(): 'web' | 'desktop';
  getOsType(): Promise<'linux' | 'macos' | 'windows' | 'android' | 'ios' | 'unknown'>;
  getDeviceId(): Promise<string>;
  getAppMetadata(): Promise<AppMetadata>;
  getPath(name: SystemPath): Promise<string>;
  getSystemTheme(): Promise<SystemTheme>;
  restartApp(): Promise<void>;
  quitApp(): Promise<void>;
  toggleDevTools(): Promise<void>;
  startDragging(): Promise<void>;
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  setFullscreen(fullscreen: boolean): Promise<void>;
  setTitle(title: string): Promise<void>;
  setAppBadge(count: number): Promise<void>;
  setStorage(key: string, value: string): Promise<void>;
  getStorage(key: string): Promise<string | null>;
  removeStorage(key: string): Promise<void>;
  clearStorage(): Promise<void>;
  copy(text: string): Promise<void>;
  paste(): Promise<string>;
  openExternal(url: string): Promise<void>;
  checkCommandExists(command: string): Promise<boolean>;
  httpRequest(url: string, options?: RequestInit): Promise<Response>;
  isOnline(): Promise<boolean>;
  notify(title: string, body: string): Promise<void>;
  confirm(message: string, title?: string, type?: 'info'|'warning'|'error'): Promise<boolean>;
  checkForUpdates(): Promise<UpdateInfo | null>;
  installUpdate(): Promise<void>;
  showItemInFolder(path: string): Promise<void>;
  selectFile(options?: { multiple?: boolean; extensions?: string[] }): Promise<string[]>;
  selectDir(): Promise<string | null>;
  readDir(path: string): Promise<FileEntry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  saveFile(data: string, filename: string): Promise<string | null>;
  readFileBinary(path: string): Promise<Uint8Array>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  readFileBlob(path: string): Promise<Blob>;
  writeFileBlob(path: string, content: Blob): Promise<void>;
  stat(path: string): Promise<FileStat>;
  convertFileSrc(filePath: string): string;
  createDir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  createPty(shell: string, size: TerminalSize, env?: Record<string, string>, initialCommand?: string): Promise<string>;
  startPty(pid: string): Promise<void>;
  resizePty(pid: string, size: TerminalSize): Promise<void>;
  writePty(pid: string, data: string): Promise<void>;
  onPtyData(pid: string, callback: (data: string | Uint8Array) => void): () => void;
  killPty(pid: string): Promise<void>;
  syncPtySessions(activeIds: string[]): Promise<void>;
  isProfessionalBrowserSupported(): boolean;
  createBrowser(container: HTMLElement, options: BrowserOptions): Promise<BrowserInstance>;
}

export interface BrowserOptions {
  url: string;
  onTitleChange?: (title: string) => void;
  onUrlChange?: (url: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onLinkClick?: (url: string, target: string, features: string) => 'current' | 'new-tab' | 'background-tab' | 'block';
  onContextMenu?: (data: { x: number; y: number; linkUrl?: string; srcUrl?: string }) => void;
}

export interface BrowserInstance {
  navigate(url: string): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  stop(): Promise<void>;
  executeJavaScript(code: string): Promise<void>;
  getUrl(): Promise<string>;
  getTitle(): Promise<string>;
  destroy(): Promise<void>;
}
