
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageProvider, StorageObject, StorageProviderConfig, UploadResult } from '../types';

/**
 * Client-Side S3 Provider
 * Directly connects to S3-compatible services using Access Keys.
 */
export class S3Provider implements IStorageProvider {
    readonly providerId: string;
    private client: S3Client;
    private bucket: string;
    private publicDomain?: string;
    private pathPrefix: string;

    constructor(config: StorageProviderConfig) {
        this.providerId = config.provider;
        this.bucket = config.bucket || '';
        this.publicDomain = config.publicDomain;
        this.pathPrefix = this.normalizePathPrefix(config.pathPrefix);

        this.client = new S3Client({
            region: config.region || 'us-east-1',
            endpoint: config.endpoint ? (config.endpoint.startsWith('http') ? config.endpoint : `https://${config.endpoint}`) : undefined,
            credentials: {
                accessKeyId: config.accessKeyId || '',
                secretAccessKey: config.secretAccessKey || '',
            },
            forcePathStyle: config.forcePathStyle,
        });
    }

    private normalizePathPrefix(pathPrefix?: string): string {
        const normalized = String(pathPrefix || '')
            .trim()
            .replace(/\\/g, '/')
            .replace(/\/{2,}/g, '/')
            .replace(/^\/+|\/+$/g, '');
        return normalized ? `${normalized}/` : '';
    }

    private normalizePath(path: string): string {
        return String(path || '')
            .trim()
            .replace(/\\/g, '/')
            .replace(/\/{2,}/g, '/')
            .replace(/^\/+/g, '');
    }

    private getFullKey(path: string): string {
        const normalizedPath = this.normalizePath(path);
        if (this.pathPrefix && normalizedPath.startsWith(this.pathPrefix)) return normalizedPath;
        return `${this.pathPrefix}${normalizedPath}`;
    }

    async testConnection(): Promise<boolean> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                MaxKeys: 1
            });
            await this.client.send(command);
            return true;
        } catch (error) {
            console.error('[S3Provider] Connection test failed:', error);
            return false;
        }
    }

    async upload(path: string, file: File | Blob | Uint8Array, mimeType?: string): Promise<UploadResult> {
        const key = this.getFullKey(path);
        const contentType = mimeType || (file instanceof File ? file.type : 'application/octet-stream');
        
        let body: Uint8Array | Blob = file;
        if (file instanceof Blob) {
             body = file;
        }

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body as any,
            ContentType: contentType
        });

        const response = await this.client.send(command);

        return {
            key,
            url: this.getPublicUrl(key),
            eTag: response.ETag
        };
    }

    async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
        const key = this.getFullKey(path);
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        return await getSignedUrl(this.client, command, { expiresIn });
    }

    getPublicUrl(path: string): string {
        const key = this.getFullKey(path);
        if (this.publicDomain) {
            const domain = this.publicDomain.endsWith('/') ? this.publicDomain.slice(0, -1) : this.publicDomain;
            const safeKey = key.startsWith('/') ? key : `/${key}`;
            return `${domain}${safeKey}`;
        }
        return ''; 
    }

    async delete(path: string): Promise<void> {
        const key = this.getFullKey(path);
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        await this.client.send(command);
    }

    async list(prefix?: string, limit?: number): Promise<StorageObject[]> {
        const effectivePrefix = this.getFullKey(prefix || '');
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: effectivePrefix,
            MaxKeys: limit
        });

        const response = await this.client.send(command);
        if (!response.Contents) return [];

        return response.Contents.map(obj => ({
            key: obj.Key || '',
            lastModified: obj.LastModified || new Date(),
            size: obj.Size || 0,
            eTag: obj.ETag
        }));
    }
}
