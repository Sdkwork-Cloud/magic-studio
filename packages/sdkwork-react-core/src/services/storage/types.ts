
export interface UploadResult {
    key: string;       
    url: string;       
    eTag?: string;
}

export interface StorageObject {
    key: string;
    lastModified: Date;
    size: number;
    eTag?: string;
    url?: string;
}

/**
 * Protocol Definition for Server Mode.
 * Backend endpoints must implement this structure.
 */
export interface ServerStorageProtocol {
    // GET /upload-url?filename=xxx&contentType=xxx
    uploadIntent: {
        uploadUrl: string; // The S3 Presigned PUT URL
        key: string;       // The final object key
        headers?: Record<string, string>; // Headers to include in PUT
    };

    // GET /access-url?key=xxx
    access: {
        url: string; // Signed or Public URL
    };
}

export interface IStorageProvider {
    readonly providerId: string;
    readonly mode: 'client' | 'server';

    testConnection(): Promise<boolean>;

    /**
     * Upload a file.
     * In Client mode: Uses S3 SDK PutObject.
     * In Server mode: Fetches upload URL from API, then PUTs data.
     */
    upload(path: string, file: File | Blob | Uint8Array, mimeType?: string): Promise<UploadResult>;

    /**
     * Get a URL for the object.
     * In Client mode: Generates Signed URL locally.
     * In Server mode: Requests access URL from API.
     */
    getSignedUrl(path: string, expiresIn?: number): Promise<string>;

    getPublicUrl(path: string): string;

    delete(path: string): Promise<void>;

    list(prefix?: string): Promise<StorageObject[]>;
}
