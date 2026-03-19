/**
 * Global type declarations for the Platform API and Upload Helper.
 *
 * These APIs are injected onto the `window` object during application startup
 * through `bootstrap.ts` and are consumed by the `sdkwork-react-commons`
 * and `sdkwork-react-fs` packages.
 */

/**
 * Platform API contract.
 */
interface PlatformAPI {
  // Window controls
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;

  // Platform metadata
  getPlatform(): 'web' | 'desktop';
  getPath(name: string): Promise<string>;
  getSystemTheme(): Promise<'light' | 'dark'>;

  // File system
  readDir(path: string): Promise<any[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readFileBinary(path: string): Promise<Uint8Array>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  readFileBlob(path: string): Promise<Blob>;
  writeFileBlob(path: string, content: Blob): Promise<void>;
  stat(path: string): Promise<any>;
  createDir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copyFile(sourcePath: string, destPath: string): Promise<void>;

  // File conversion
  convertFileSrc(path: string): string;

  // Clipboard
  copy(text: string): void;

  // Dialogs
  confirm(message: string, title?: string, type?: string): Promise<boolean>;

  // Notifications
  notify(message: string, title?: string): Promise<void>;

  // Updates
  checkForUpdates(): Promise<any>;
  installUpdate(): Promise<void>;
}

/**
 * Upload Helper contract.
 */
interface UploadHelper {
  pickFiles(multiple: boolean, accept: string, compress: boolean): Promise<any[]>;
}

declare global {
  interface Window {
    /**
     * Global Platform API instance provided by `sdkwork-react-core`
     * and injected in `bootstrap.ts`.
     */
    __sdkworkPlatform: PlatformAPI;

    /**
     * Global Upload Helper instance provided by `sdkwork-react-core`
     * and injected in `bootstrap.ts`.
     */
    __sdkworkUploadHelper: UploadHelper;
  }
}

// Export types for reuse in other files.
export type { PlatformAPI, UploadHelper };
