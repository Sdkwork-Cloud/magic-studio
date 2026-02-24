/**
 * 全局 Platform API 和 Upload Helper 的类型声明
 * 
 * 这些 API 在应用启动时通过 bootstrap.ts 注入到 window 对象
 * 供 sdkwork-react-commons 和 sdkwork-react-fs 包使用
 */

/**
 * Platform API 接口定义
 */
interface PlatformAPI {
  // 窗口管理
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;
  
  // 平台信息
  getPlatform(): 'web' | 'desktop';
  getPath(name: string): Promise<string>;
  getSystemTheme(): Promise<'light' | 'dark'>;
  
  // 文件系统
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
  
  // 文件转换
  convertFileSrc(path: string): string;
  
  // 剪贴板
  copy(text: string): void;
  
  // 对话框
  confirm(message: string, title?: string, type?: string): Promise<boolean>;
  
  // 通知
  notify(message: string, title?: string): Promise<void>;
  
  // 更新
  checkForUpdates(): Promise<any>;
  installUpdate(): Promise<void>;
}

/**
 * Upload Helper 接口定义
 */
interface UploadHelper {
  pickFiles(multiple: boolean, accept: string, compress: boolean): Promise<any[]>;
}

declare global {
  interface Window {
    /**
     * 全局 Platform API 实例
     * 由 sdkwork-react-core 提供，在 bootstrap.ts 中注入
     */
    __sdkworkPlatform: PlatformAPI;
    
    /**
     * 全局 Upload Helper 实例
     * 由 sdkwork-react-core 提供，在 bootstrap.ts 中注入
     */
    __sdkworkUploadHelper: UploadHelper;
  }
}

// 导出类型以便其他文件使用
export type { PlatformAPI, UploadHelper };
