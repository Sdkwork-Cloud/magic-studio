import { IStorageProvider, StorageObject, UploadResult } from '@sdkwork/react-commons';

// Stub type for StorageConfig - to be replaced with actual settings entity
interface ServerStorageConfig {
    provider: string;
    apiEndpoint: string;
    authToken?: string;
    authHeaderName?: string;
    pathPrefix?: string;
    publicDomain?: string;
    enabled?: boolean;
    name?: string;
    id?: string;
    isDefault?: boolean;
    mode?: string;
}

/**
 * Server Proxy Provider
 * Uses a backend API to handle storage operations.
 */
export class ServerProvider implements IStorageProvider {
    providerId: string;
    mode: 'server' = 'server';
    apiEndpoint: string;
    private headers: Record<string, string>;
    private publicDomain?: string;

    constructor(config: ServerStorageConfig) {
        this.providerId = config.provider;
        this.apiEndpoint = config.apiEndpoint || '';
        // Clean trailing slash
        if (this.apiEndpoint.endsWith('/')) this.apiEndpoint = this.apiEndpoint.slice(0, -1);

        this.headers = {
            'Content-Type': 'application/json'
        };
        if (config.authHeaderName && config.authToken) {
            this.headers[config.authHeaderName] = config.authToken;
        }

        this.publicDomain = config.publicDomain;
    }

    async testConnection(): Promise<boolean> {
        if (!this.apiEndpoint) return false;
        try {
            const url = `${this.apiEndpoint}/list?limit=1`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });
            return response.ok;
        } catch (error) {
            console.error('[ServerProvider] Connection test failed:', error);
            return false;
        }
    }

    async upload(path: string, file: File | Blob | Uint8Array): Promise<UploadResult> {
        const filename = path.split('/').pop() || 'file';
        const url = `${this.apiEndpoint}/upload`;

        try {
            const formData = new FormData();
            const blob = file instanceof Uint8Array ? new Blob([file.slice()]) : file;
            formData.append('file', blob, filename);
            formData.append('path', path);

            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
                body: formData
            });

            if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

            const data = await response.json();
            return {
                url: data.url || path,
                key: path
            };
        } catch (error) {
            console.error('[ServerProvider] Upload failed:', error);
            throw error;
        }
    }

    async download(path: string): Promise<Blob> {
        const url = `${this.apiEndpoint}/download?path=${encodeURIComponent(path)}`;
        const response = await fetch(url, {
            headers: this.headers
        });
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        return await response.blob();
    }

    async delete(path: string): Promise<void> {
        const url = `${this.apiEndpoint}/delete?path=${encodeURIComponent(path)}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.headers
        });
        if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
    }

    async exists(path: string): Promise<boolean> {
        try {
            const url = `${this.apiEndpoint}/exists?path=${encodeURIComponent(path)}`;
            const response = await fetch(url, {
                headers: this.headers
            });
            if (!response.ok) return false;
            const data = await response.json();
            return data.exists;
        } catch {
            return false;
        }
    }

    async list(prefix?: string, limit?: number): Promise<StorageObject[]> {
        const url = `${this.apiEndpoint}/list?prefix=${encodeURIComponent(prefix || '')}&limit=${limit || 100}`;
        const response = await fetch(url, {
            headers: this.headers
        });
        if (!response.ok) throw new Error(`List failed: ${response.status}`);
        const data = await response.json();
        return data.items || [];
    }

    getPublicUrl(path: string): string {
        if (this.publicDomain) {
            return `${this.publicDomain}/${path}`;
        }
        return '';
    }

    async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
        const url = `${this.apiEndpoint}/sign?path=${encodeURIComponent(path)}&expires=${expiresIn}`;
        const response = await fetch(url, {
            headers: this.headers
        });
        if (!response.ok) throw new Error(`Sign failed: ${response.status}`);
        const data = await response.json();
        return data.url;
    }
}
