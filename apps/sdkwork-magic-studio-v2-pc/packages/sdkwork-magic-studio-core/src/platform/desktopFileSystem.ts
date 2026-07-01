import {
  createLocalServerFileSystemApi,
  type LocalServerFileSystemApi,
} from './localServerFileSystem';

interface CreateDesktopFileSystemApiOptions {
  request(url: string, options?: RequestInit): Promise<Response>;
  convertFileSrc(filePath: string): string;
}

export type DesktopFileSystemApi = LocalServerFileSystemApi;

export const createDesktopFileSystemApi = ({
  request,
  convertFileSrc,
}: CreateDesktopFileSystemApiOptions): DesktopFileSystemApi =>
  createLocalServerFileSystemApi({
    runtimeMode: 'desktop',
    request,
    convertFileSrc,
  });
