// Common/Base type definitions
// Fundamental types used across all packages

import type { EntityIdentityLike } from './base.types.ts';
import { ThemeMode as ThemeModeValue } from './theme-mode.ts';

export const ThemeMode = ThemeModeValue;
export type ThemeMode = (typeof ThemeModeValue)[keyof typeof ThemeModeValue];

export * from './vocabulary.types.ts';
export * from './catalog.types.ts';
export * from './content.types.ts';
export * from './auth.types.ts';
export * from './user.types.ts';

// ============================================================================
// Service Result Pattern
// ============================================================================

export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    code?: number;
    message?: string;
    timestamp: string;
}

const formatDateTime = (date: Date = new Date()): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const Result = {
    success: <T>(data: T): ServiceResult<T> => ({
        success: true,
        data,
        code: 200,
        timestamp: formatDateTime()
    }),
    error: <T>(message: string, code: number = 500): ServiceResult<T> => ({
        success: false,
        message,
        code,
        timestamp: formatDateTime()
    })
};

// ============================================================================
// Pagination Types
// ============================================================================

export interface Sort {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
}

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    offset?: number;
    paged?: boolean;
    unpaged?: boolean;
    sort?: Sort;
}

export interface PageRequest {
    page: number;
    size: number;
    sort?: string[];
    keyword?: string;
}

export interface Page<T> {
    content: T[];
    pageable?: Pageable;
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort?: Sort;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageObject {
    key: string;
    size: number;
    lastModified: Date;
    eTag?: string;
}

export interface UploadResult {
    url: string;
    key: string;
    eTag?: string;
}

export interface IStorageProvider {
    upload(path: string, file: Uint8Array | Blob | File, mimeType?: string): Promise<UploadResult>;
    download?(path: string): Promise<Blob>;
    delete(path: string): Promise<void>;
    list(prefix: string): Promise<StorageObject[]>;
    exists?(path: string): Promise<boolean>;
}

// ============================================================================
// Base Service Interface
// ============================================================================

export interface IBaseService<T extends EntityIdentityLike, ID = string> {
    save(entity: Partial<T>): Promise<ServiceResult<T>>;
    saveAll(entities: Partial<T>[]): Promise<ServiceResult<T[]>>;

    findById(id: ID): Promise<ServiceResult<T | null>>;
    existsById(id: ID): Promise<boolean>;

    findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<T>>>;
    findAllById(ids: ID[]): Promise<ServiceResult<T[]>>;

    count(): Promise<number>;

    deleteById(id: ID): Promise<ServiceResult<void>>;
    delete(entity: T): Promise<ServiceResult<void>>;
    deleteAll(ids: ID[]): Promise<ServiceResult<void>>;
}
