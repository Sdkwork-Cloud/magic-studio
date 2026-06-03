import type { StorageObject, UploadResult } from '@sdkwork/magic-studio-types/storage';

export type { StorageObject, UploadResult } from '@sdkwork/magic-studio-types/storage';

export type StorageProviderType =
    | 'aws'
    | 'aliyun'
    | 'tencent'
    | 'volcengine'
    | 'google'
    | 'azure'
    | 'cloudflare'
    | 'minio'
    | 'custom';

/**
 * Canonical object-storage provider configuration.
 * Product code must not add proxy-backend-only fields here.
 */
export interface StorageProviderConfig {
    id?: string;
    name?: string;
    provider: StorageProviderType;
    enabled?: boolean;
    isDefault?: boolean;
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    pathPrefix?: string;
    publicDomain?: string;
}

export interface IStorageProvider {
    readonly providerId: string;

    testConnection(): Promise<boolean>;
    upload(path: string, file: File | Blob | Uint8Array, mimeType?: string): Promise<UploadResult>;
    getSignedUrl(path: string, expiresIn?: number): Promise<string>;
    getPublicUrl(path: string): string;
    delete(path: string): Promise<void>;
    list(prefix?: string, limit?: number): Promise<StorageObject[]>;
    exists?(path: string): Promise<boolean>;
    download?(path: string): Promise<Blob>;
}
