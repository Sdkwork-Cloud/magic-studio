import {
  createMagicStudioServerClient,
  resolveMagicStudioServerHostDescriptor,
  type MagicStudioHostMode,
} from '@sdkwork/magic-studio-server';

import type { FileEntry, FileStat } from './types';

const toRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

type BufferLike = {
  from(
    value: Uint8Array | string,
    encoding?: string,
  ): {
    toString(encoding: string): string;
    readonly length: number;
    [index: number]: number;
  };
};

const readGlobalBuffer = (): BufferLike | null => {
  const target = globalThis as typeof globalThis & { Buffer?: BufferLike };
  return target.Buffer ?? null;
};

const encodeBytesToBase64 = (content: Uint8Array): string => {
  let output = '';

  for (const value of content) {
    output += String.fromCharCode(value);
  }

  if (typeof btoa === 'function') {
    return btoa(output);
  }

  const buffer = readGlobalBuffer();
  if (buffer) {
    return buffer.from(content).toString('base64');
  }

  throw new Error('[Platform] Base64 encoding is unavailable in the current runtime');
};

const decodeBase64ToBytes = (value: string): Uint8Array => {
  if (!value) {
    return new Uint8Array();
  }

  if (typeof atob === 'function') {
    const decoded = atob(value);
    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  }

  const buffer = readGlobalBuffer();
  if (buffer) {
    return Uint8Array.from(buffer.from(value, 'base64'));
  }

  throw new Error('[Platform] Base64 decoding is unavailable in the current runtime');
};

interface CreateLocalServerFileSystemApiOptions {
  runtimeMode: MagicStudioHostMode;
  request(url: string, options?: RequestInit): Promise<Response>;
  convertFileSrc(filePath: string): string;
  preferSameOrigin?: boolean;
  locationOrigin?: string;
}

export interface LocalServerFileSystemApi {
  readDir(path: string): Promise<FileEntry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readFileBinary(path: string): Promise<Uint8Array>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  readFileBlob(path: string): Promise<Blob>;
  writeFileBlob(path: string, content: Blob): Promise<void>;
  stat(path: string): Promise<FileStat>;
  createDir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copyFile(sourcePath: string, destinationPath: string): Promise<void>;
  convertFileSrc(filePath: string): string;
}

export const createLocalServerFileSystemApi = ({
  runtimeMode,
  request,
  convertFileSrc,
  preferSameOrigin = false,
  locationOrigin,
}: CreateLocalServerFileSystemApiOptions): LocalServerFileSystemApi => {
  const host = resolveMagicStudioServerHostDescriptor({
    runtimeMode,
    preferSameOrigin,
    locationOrigin,
  });
  const serverClient = createMagicStudioServerClient({
    host,
    fetch: async (input, init) => request(toRequestUrl(input), init),
  });

  return {
    readDir: async (path: string): Promise<FileEntry[]> => {
      const response = await serverClient.readFileSystemDirectory({ path });

      return response.items.map((entry) => ({
        uuid: entry.path,
        name: entry.name,
        path: entry.path,
        isDirectory: entry.isDirectory,
        children: [],
      }));
    },
    readFile: async (path: string): Promise<string> =>
      (await serverClient.readFileSystemText({ path })).data.text,
    writeFile: async (path: string, content: string): Promise<void> => {
      await serverClient.writeFileSystemText({ path, text: content });
    },
    readFileBinary: async (path: string): Promise<Uint8Array> => {
      const response = await serverClient.readFileSystemBytes({ path });
      return decodeBase64ToBytes(response.data.bytesBase64);
    },
    writeFileBinary: async (path: string, content: Uint8Array): Promise<void> => {
      await serverClient.writeFileSystemBytes({
        path,
        bytesBase64: encodeBytesToBase64(content),
      });
    },
    readFileBlob: async (path: string): Promise<Blob> => {
      const bytes = await serverClient.readFileSystemBytes({ path });
      const decodedBytes = decodeBase64ToBytes(bytes.data.bytesBase64);
      const copiedBytes = new Uint8Array(decodedBytes.byteLength);
      copiedBytes.set(decodedBytes);
      return new Blob([copiedBytes.buffer]);
    },
    writeFileBlob: async (path: string, content: Blob): Promise<void> => {
      const buffer = await content.arrayBuffer();
      await serverClient.writeFileSystemBytes({
        path,
        bytesBase64: encodeBytesToBase64(new Uint8Array(buffer)),
      });
    },
    stat: async (path: string): Promise<FileStat> => {
      const stat = (await serverClient.statFileSystemPath({ path })).data;
      return {
        type: stat.kind,
        size: stat.size,
        lastModified: stat.lastModified ?? Date.now(),
        createdAt: stat.createdAt ?? undefined,
        readonly: stat.readonly,
      };
    },
    createDir: async (path: string): Promise<void> => {
      await serverClient.ensureFileSystemDirectory({ path });
    },
    delete: async (path: string): Promise<void> => {
      await serverClient.removeFileSystemPath({ path });
    },
    rename: async (oldPath: string, newPath: string): Promise<void> => {
      await serverClient.renameFileSystemPath({ oldPath, newPath });
    },
    copyFile: async (sourcePath: string, destinationPath: string): Promise<void> => {
      await serverClient.copyFileSystemFile({ sourcePath, destinationPath });
    },
    convertFileSrc,
  };
};
