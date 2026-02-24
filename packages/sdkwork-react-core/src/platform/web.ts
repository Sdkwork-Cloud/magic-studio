import { PlatformAPI, FileEntry, FileStat, SystemPath, BrowserInstance } from './types';
import { pathUtils } from 'sdkwork-react-commons';

class WebFileSystem {
    private dbName = 'OpenStudio_VFS';
    private storeName = 'files';
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.initDB();
        this.seedDefaults();
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'path' });
                }
            };
        });
    }

    private async seedDefaults() {
        const exists = await this.exists('/home/web_user/hello.txt');
        if (!exists) {
            await this.writeFile('/home/web_user/hello.txt', 'Welcome to Magic Studio Web! Persisted in IndexedDB.');
            await this.createDir('/home/web_user/projects');
            await this.createDir('/home/web_user/Downloads');
        }
    }

    private async getFileRecord(path: string): Promise<any> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(path);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    private async putFileRecord(record: any): Promise<void> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async exists(path: string): Promise<boolean> {
        const record = await this.getFileRecord(path);
        return !!record;
    }

    async stat(path: string): Promise<FileStat> {
        const record = await this.getFileRecord(path);
        if (!record) throw new Error(`File not found: ${path}`);
        
        let size = 0;
        if (record.content) {
             if (record.content instanceof Blob) size = record.content.size;
             else if (record.content.byteLength) size = record.content.byteLength;
             else size = record.content.length;
        }

        return {
            type: record.isDirectory ? 'directory' : 'file',
            size: size,
            lastModified: record.lastModified,
            createdAt: record.createdAt
        };
    }

    async readDir(path: string): Promise<FileEntry[]> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allFiles = request.result || [];
                const entries: FileEntry[] = [];
                const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

                for (const file of allFiles) {
                    const parent = pathUtils.dirname(file.path);
                    if (parent === normalizedPath && file.path !== normalizedPath) {
                        entries.push({
                            uuid: file.path,
                            name: pathUtils.basename(file.path),
                            path: file.path,
                            isDirectory: !!file.isDirectory,
                            children: []
                        });
                    }
                }
                resolve(entries);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async readFile(path: string): Promise<string> {
        const record = await this.getFileRecord(path);
        if (!record) throw new Error(`File not found: ${path}`);
        if (record.isDirectory) throw new Error(`Path is a directory: ${path}`);
        
        if (record.content instanceof Blob) {
            return await record.content.text();
        }
        if (record.content instanceof Uint8Array || record.content instanceof ArrayBuffer) {
            return new TextDecoder().decode(record.content);
        }
        return record.content || '';
    }

    async readFileBinary(path: string): Promise<Uint8Array> {
        const record = await this.getFileRecord(path);
        if (!record) throw new Error(`File not found: ${path}`);
        if (record.isDirectory) throw new Error(`Path is a directory: ${path}`);
        
        if (typeof record.content === 'string') {
            return new TextEncoder().encode(record.content);
        }
        if (record.content instanceof Blob) {
            const buf = await record.content.arrayBuffer();
            return new Uint8Array(buf);
        }
        return new Uint8Array(record.content);
    }
    
    async readFileBlob(path: string): Promise<Blob> {
        const record = await this.getFileRecord(path);
        if (!record) throw new Error(`File not found: ${path}`);
        if (record.isDirectory) throw new Error(`Path is a directory: ${path}`);
        
        if (record.content instanceof Blob) {
            return record.content;
        }
        if (typeof record.content === 'string') {
             return new Blob([record.content], { type: 'text/plain' });
        }
        return new Blob([record.content]);
    }

    async writeFile(path: string, content: string | Uint8Array | Blob): Promise<void> {
        const now = Date.now();
        const record = {
            path,
            content,
            isDirectory: false,
            lastModified: now,
            createdAt: now
        };
        await this.putFileRecord(record);
    }
    
    async createDir(path: string): Promise<void> {
        const now = Date.now();
        const record = {
            path,
            isDirectory: true,
            lastModified: now,
            createdAt: now
        };
        await this.putFileRecord(record);
    }

    async delete(path: string): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        
        const allKeysReq = store.getAllKeys();
        
        return new Promise((resolve, reject) => {
            allKeysReq.onsuccess = () => {
                const keys = allKeysReq.result;
                const pathsToDelete = keys.filter(k => k.toString() === path || k.toString().startsWith(path + '/'));
                pathsToDelete.forEach(k => store.delete(k));
                tx.oncomplete = () => resolve();
            };
            allKeysReq.onerror = () => reject(allKeysReq.error);
        });
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        const record = await this.getFileRecord(oldPath);
        if (!record) throw new Error(`Path not found: ${oldPath}`);
        
        await this.delete(oldPath);
        
        record.path = newPath;
        await this.putFileRecord(record);
    }
}

const fs = new WebFileSystem();

interface MockSession {
    pid: string;
    buffer: string;
    callback: (data: string) => void;
}
const mockSessions = new Map<string, MockSession>();

export const webPlatform: PlatformAPI = {
  getPlatform: () => 'web',
  getOsType: async () => 'unknown',
  getDeviceId: async () => 'web-device-id',
  getAppMetadata: async () => ({
    name: 'Magic Studio Web',
    version: '2.4.0'
  }),

  getPath: async (name: SystemPath) => {
    switch (name) {
      case 'home': return '/home/web_user';
      case 'appData': return '/home/web_user/.config';
      case 'desktop': return '/home/web_user/Desktop';
      case 'documents': return '/home/web_user/Documents';
      case 'downloads': return '/home/web_user/Downloads';
      case 'temp': return '/tmp';
      default: return '/';
    }
  },

  getSystemTheme: async () => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  restartApp: async () => window.location.reload(),
  quitApp: async () => alert('Quit application requested.'),
  toggleDevTools: async () => console.log('Use F12 for DevTools'),

  startDragging: async () => {},
  minimizeWindow: async () => {},
  maximizeWindow: async () => {},
  closeWindow: async () => {},
  setFullscreen: async (_fullscreen: boolean) => {},
  setTitle: async (title: string) => { document.title = title; },
  setAppBadge: async () => {},

  setStorage: async (key: string, value: string) => { localStorage.setItem(key, value); },
  getStorage: async (key: string) => { return localStorage.getItem(key); },
  removeStorage: async (key: string) => { localStorage.removeItem(key); },
  clearStorage: async () => { localStorage.clear(); },

  copy: async (text: string) => { await navigator.clipboard.writeText(text); },
  paste: async () => { return await navigator.clipboard.readText(); },
  openExternal: async (url: string) => { window.open(url, '_blank'); },
  checkCommandExists: async (_command: string) => true,

  httpRequest: async (url: string, options?: RequestInit) => { return fetch(url, options); },
  isOnline: async () => navigator.onLine,

  notify: async (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
          if(p === 'granted') new Notification(title, { body });
      });
    }
  },
  confirm: async (message: string) => window.confirm(message),

  checkForUpdates: async () => null,
  installUpdate: async () => {},

  showItemInFolder: async (path: string) => { console.log(`[Web] Show item: ${path}`); },

  selectFile: async (options?: { multiple?: boolean; extensions?: string[] }) => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options?.multiple || false;
        input.accept = options?.extensions ? options.extensions.map(e => '.'+e).join(',') : '';
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const paths = [];
                for(let i=0; i<files.length; i++) {
                    const f = files[i];
                    const vPath = `/imported/${f.name}`;
                    await fs.writeFile(vPath, f);
                    paths.push(vPath);
                }
                resolve(paths);
            } else {
                resolve([]);
            }
        };
        input.oncancel = () => resolve([]);
        input.click();
    });
  },
  
  selectDir: async () => '/home/web_user/projects',

  readDir: (path: string) => fs.readDir(path),
  readFile: (path: string) => fs.readFile(path),
  writeFile: (path: string, content: string) => fs.writeFile(path, content),
  
  readFileBinary: (path: string) => fs.readFileBinary(path),
  writeFileBinary: (path: string, content: Uint8Array) => fs.writeFile(path, content),

  readFileBlob: (path: string) => fs.readFileBlob(path),
  writeFileBlob: (path: string, content: Blob) => fs.writeFile(path, content),
  
  stat: (path: string) => fs.stat(path),
  createDir: (path: string) => fs.createDir(path),
  delete: (path: string) => fs.delete(path),
  rename: (oldPath: string, newPath: string) => fs.rename(oldPath, newPath),
  
  copyFile: async (src: string, dst: string) => {
      const blob = await fs.readFileBlob(src);
      await fs.writeFile(dst, blob);
  },
  
  saveFile: async (data: string, filename: string) => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return `/home/web_user/Downloads/${filename}`;
  },

  convertFileSrc: (filePath: string) => {
      return filePath;
  },

  createPty: async (_shell: string, _size: { cols: number; rows: number }, _env?: Record<string, string>, _initialCommand?: string) => {
      const pid = 'web-pty-' + Math.random().toString(36).substr(2, 6);
      mockSessions.set(pid, { pid, buffer: '', callback: () => {} });
      return pid;
  },
  startPty: async (pid: string) => {
      const s = mockSessions.get(pid);
      if(s) {
          setTimeout(() => {
             s.callback('\x1b[1;32mMagic Studio Web Terminal (IndexedDB)\x1b[0m\r\n\r\n$ ');
          }, 100);
      }
  },
  resizePty: async (_pid: string, _size: { cols: number; rows: number }) => {},
  writePty: async (pid: string, data: string) => {
      const s = mockSessions.get(pid);
      if(s) {
          if (data === '\r') {
              s.callback('\r\n$ ');
          } else {
              s.callback(data);
          }
      }
  },
  onPtyData: (pid: string, callback: (data: string | Uint8Array) => void) => {
      const s = mockSessions.get(pid);
      if(s) s.callback = callback;
      return () => {};
  },
  killPty: async (pid: string) => { mockSessions.delete(pid); },
  syncPtySessions: async (_ids: string[]) => {},

  isProfessionalBrowserSupported: () => false,
  createBrowser: async (): Promise<BrowserInstance> => { throw new Error("Not supported"); }
};
