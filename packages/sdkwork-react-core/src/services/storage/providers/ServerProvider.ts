import { IStorageProvider, StorageObject, UploadResult } from '@sdkwork/react-commons';
import { uploadViaPresignedUrl } from '../../../sdk/uploadViaPresignedUrl';

// Stub type for StorageConfig - to be replaced with actual settings entity
interface ServerStorageConfig {
  provider: string;
  apiEndpoint: string;
  authToken?: string;
  authHeaderName?: string;
  pathPrefix?: string;
  publicDomain?: string;
  uploadIntentPath?: string;
  enabled?: boolean;
  name?: string;
  id?: string;
  isDefault?: boolean;
  mode?: string;
}

interface UploadIntentResponse {
  uploadUrl?: string;
  url?: string;
  key?: string;
  objectKey?: string;
  headers?: Record<string, string>;
}

interface AccessUrlResponse {
  url?: string;
}

interface ApiEnvelope<T> {
  data?: T;
}

/**
 * Server Proxy Provider
 * Uses a backend API to handle storage operations.
 */
export class ServerProvider implements IStorageProvider {
  providerId: string;
  mode = 'server' as const;
  apiEndpoint: string;
  private headers: Record<string, string>;
  private publicDomain?: string;
  private pathPrefix: string;
  private uploadIntentPath: string;

  constructor(config: ServerStorageConfig) {
    this.providerId = config.provider;
    this.apiEndpoint = config.apiEndpoint || '';
    // Clean trailing slash
    if (this.apiEndpoint.endsWith('/')) this.apiEndpoint = this.apiEndpoint.slice(0, -1);

    this.headers = {};
    if (config.authHeaderName && config.authToken) {
      this.headers[config.authHeaderName] = config.authToken;
    }

    this.publicDomain = config.publicDomain;
    this.pathPrefix = this.normalizePathPrefix(config.pathPrefix);
    this.uploadIntentPath = this.normalizeEndpointSegment(config.uploadIntentPath || 'upload-url');
  }

  private normalizePathPrefix(pathPrefix?: string): string {
    const normalized = String(pathPrefix || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/{2,}/g, '/')
      .replace(/^\/+|\/+$/g, '');
    return normalized;
  }

  private normalizePath(path: string): string {
    const normalized = String(path || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/{2,}/g, '/')
      .replace(/^\/+|\/+$/g, '');
    return normalized;
  }

  private normalizeEndpointSegment(path: string): string {
    return String(path || '')
      .trim()
      .replace(/^\/+|\/+$/g, '');
  }

  private resolveObjectPath(path: string): string {
    const normalizedPath = this.normalizePath(path);
    if (!this.pathPrefix) {
      return normalizedPath;
    }
    if (!normalizedPath) {
      return this.pathPrefix;
    }
    if (normalizedPath === this.pathPrefix || normalizedPath.startsWith(`${this.pathPrefix}/`)) {
      return normalizedPath;
    }
    return `${this.pathPrefix}/${normalizedPath}`;
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text.trim()) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  private unwrapEnvelope<T>(payload: T | ApiEnvelope<T>): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return ((payload as ApiEnvelope<T>).data || {}) as T;
    }
    return payload as T;
  }

  private async requestUploadIntent(
    path: string,
    filename: string,
    contentType: string
  ): Promise<UploadIntentResponse> {
    const query = new URLSearchParams({
      path,
      filename,
      contentType,
    });
    const response = await fetch(
      `${this.apiEndpoint}/${this.uploadIntentPath}?${query.toString()}`,
      {
        method: 'GET',
        headers: this.headers,
      }
    );
    if (!response.ok) {
      throw new Error(`Upload intent failed: ${response.status}`);
    }
    const payload = await this.readJson<UploadIntentResponse | ApiEnvelope<UploadIntentResponse>>(
      response
    );
    return this.unwrapEnvelope(payload);
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiEndpoint) return false;
    try {
      const url = `${this.apiEndpoint}/list?limit=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });
      return response.ok;
    } catch (error) {
      console.error('[ServerProvider] Connection test failed:', error);
      return false;
    }
  }

  async upload(path: string, file: File | Blob | Uint8Array): Promise<UploadResult> {
    const fullPath = this.resolveObjectPath(path);
    const filename = fullPath.split('/').pop() || 'file';
    const contentType =
      file instanceof Blob ? file.type || 'application/octet-stream' : 'application/octet-stream';

    try {
      let uploadIntent: UploadIntentResponse | null = null;
      const uploadResult = await uploadViaPresignedUrl(
        {
          upload: {
            getPresignedUrl: async () => {
              uploadIntent = await this.requestUploadIntent(fullPath, filename, contentType);
              const uploadUrl = String(uploadIntent.uploadUrl || uploadIntent.url || '').trim();
              if (!uploadUrl) {
                throw new Error('Upload intent response does not contain an upload URL');
              }

              return {
                code: '2000',
                data: {
                  url: uploadUrl,
                  objectKey:
                    String(uploadIntent.key || uploadIntent.objectKey || fullPath).trim() ||
                    fullPath,
                  headers: uploadIntent.headers,
                },
              };
            },
            registerPresigned: async () => ({
              // Keep the closure payload fully typed for package-level typecheck.
              ...(() => {
                const currentIntent: UploadIntentResponse = uploadIntent ?? {};
                return {
                  code: '2000',
                  data: {
                    key:
                      String(currentIntent.key || currentIntent.objectKey || fullPath).trim() ||
                      fullPath,
                    url: String(currentIntent.url || '').trim(),
                  },
                };
              })(),
            }),
          },
        } as unknown as Parameters<typeof uploadViaPresignedUrl>[0],
        {
          file,
          fileName: filename,
          contentType,
          path: fullPath,
          provider: this.providerId,
        }
      );

      const registered = this.unwrapEnvelope<{ key?: string; url?: string }>(
        uploadResult.registerResult as ApiEnvelope<{ key?: string; url?: string }>
      );
      const currentIntent: UploadIntentResponse = uploadIntent ?? {};
      const objectKey =
        String(
          registered.key || currentIntent.key || currentIntent.objectKey || uploadResult.objectKey
        ).trim() || fullPath;
      const url =
        String(
          registered.url ||
            currentIntent.url ||
            this.getPublicUrl(objectKey) ||
            uploadResult.uploadUrl
        ).trim() || objectKey;

      return {
        url,
        key: objectKey,
      };
    } catch (error) {
      console.error('[ServerProvider] Upload failed:', error);
      throw error;
    }
  }

  async download(path: string): Promise<Blob> {
    const fullPath = this.resolveObjectPath(path);
    const url = `${this.apiEndpoint}/download?path=${encodeURIComponent(fullPath)}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    return await response.blob();
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.resolveObjectPath(path);
    const url = `${this.apiEndpoint}/delete?path=${encodeURIComponent(fullPath)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
  }

  async exists(path: string): Promise<boolean> {
    try {
      const fullPath = this.resolveObjectPath(path);
      const url = `${this.apiEndpoint}/exists?path=${encodeURIComponent(fullPath)}`;
      const response = await fetch(url, {
        headers: this.headers,
      });
      if (!response.ok) return false;
      const data = await this.readJson<{ exists?: boolean }>(response);
      return Boolean(data.exists);
    } catch {
      return false;
    }
  }

  async list(prefix?: string, limit?: number): Promise<StorageObject[]> {
    const fullPrefix = this.resolveObjectPath(prefix || '');
    const url = `${this.apiEndpoint}/list?prefix=${encodeURIComponent(fullPrefix)}&limit=${limit || 100}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`List failed: ${response.status}`);
    const data = await this.readJson<{ items?: StorageObject[] }>(response);
    return data.items || [];
  }

  getPublicUrl(path: string): string {
    const fullPath = this.resolveObjectPath(path);
    if (this.publicDomain) {
      const domain = this.publicDomain.endsWith('/')
        ? this.publicDomain.slice(0, -1)
        : this.publicDomain;
      return `${domain}/${fullPath}`;
    }
    return '';
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const fullPath = this.resolveObjectPath(path);
    const url = `${this.apiEndpoint}/sign?path=${encodeURIComponent(fullPath)}&expires=${expiresIn}`;
    const response = await fetch(url, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`Sign failed: ${response.status}`);
    const payload = await this.readJson<AccessUrlResponse | ApiEnvelope<AccessUrlResponse>>(
      response
    );
    const data = this.unwrapEnvelope(payload);
    const signedUrl = String(data.url || this.getPublicUrl(fullPath)).trim();
    if (!signedUrl) {
      throw new Error('Sign response does not contain a URL');
    }
    return signedUrl;
  }
}
