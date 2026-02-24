
import { IBaseService, BaseEntity, ServiceResult, Page, PageRequest, Result } from 'sdkwork-react-commons';
import { platform } from '../../platform';

/**
 * Generic LocalStorage Service (v2.1)
 * 
 * Implements:
 * 1. Template Method Pattern for CRUD operations.
 * 2. Weighted Relevance Search Algorithm for high-quality filtering.
 * 3. Robust Error Handling wrapper.
 */
export class LocalStorageService<T extends BaseEntity> implements IBaseService<T> {
    protected cache: T[] | null = null;

    constructor(protected storageKey: string) {}

    protected async ensureInitialized(): Promise<void> {
        if (this.cache !== null) return;
        try {
            const data = await platform.getStorage(this.storageKey);
            this.cache = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`[LocalStorageService] Failed to load ${this.storageKey}`, e);
            this.cache = [];
        }
    }

    protected async persist(): Promise<void> {
        if (this.cache === null) return;
        await platform.setStorage(this.storageKey, JSON.stringify(this.cache));
    }

    /**
     * Advanced Search Algorithm
     * Scores items based on keyword matching in 'name', 'title', or 'description'.
     */
    private calculateRelevance(item: T, keywords: string[]): number {
        let score = 0;
        const searchableFields = ['name', 'title', 'description', 'content', 'tags'];
        
        // Convert item to searchable string map
        const itemData: any = item;

        for (const word of keywords) {
            let wordFound = false;
            for (const field of searchableFields) {
                if (itemData[field] && typeof itemData[field] === 'string') {
                    const value = itemData[field].toLowerCase();
                    const index = value.indexOf(word);
                    
                    if (index !== -1) {
                        wordFound = true;
                        // Higher score for matches in Title/Name
                        const weight = (field === 'name' || field === 'title') ? 10 : 1;
                        // Higher score for matches at the beginning of the string
                        const positionBonus = index === 0 ? 5 : 0;
                        
                        score += weight + positionBonus;
                    }
                } else if (field === 'tags' && Array.isArray(itemData[field])) {
                     if (itemData[field].some((tag: string) => tag.toLowerCase().includes(word))) {
                         score += 5; // Good score for tag match
                         wordFound = true;
                     }
                }
            }
            if (!wordFound) return 0; // AND logic: strict match for all keywords
        }
        return score;
    }

    async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<T>>> {
        await this.ensureInitialized();
        let content = [...(this.cache || [])];

        // 1. Advanced Filtering & Scoring
        if (pageRequest?.keyword && pageRequest.keyword.trim()) {
            const terms = pageRequest.keyword.toLowerCase().split(/\s+/).filter(Boolean);
            
            // Map content to [item, score] pairs
            const scored = content.map(item => ({
                item,
                score: this.calculateRelevance(item, terms)
            })).filter(pair => pair.score > 0);

            // Sort by score descending
            scored.sort((a, b) => b.score - a.score);
            content = scored.map(s => s.item);
        } else {
            // Default Sort: UpdatedAt Descending
            content.sort((a, b) => b.updatedAt - a.updatedAt);
        }

        // 2. Pagination
        const totalElements = content.length;
        const size = pageRequest?.size || 20;
        const page = pageRequest?.page || 0;
        const totalPages = Math.ceil(totalElements / size);
        
        const start = page * size;
        const end = Math.min(start + size, totalElements);
        const pagedContent = content.slice(start, end);

        return Result.success({
            content: pagedContent,
            pageable: {
                pageNumber: page,
                pageSize: size,
                offset: start,
                paged: true,
                unpaged: false,
                sort: { sorted: true, unsorted: false, empty: false }
            },
            last: page >= totalPages - 1,
            totalPages,
            totalElements,
            size,
            number: page,
            sort: { sorted: true, unsorted: false, empty: false },
            first: page === 0,
            numberOfElements: pagedContent.length,
            empty: pagedContent.length === 0
        });
    }

    async findById(id: string): Promise<ServiceResult<T | null>> {
        await this.ensureInitialized();
        const item = this.cache?.find(i => i.id === id) || null;
        return Result.success(item);
    }

    async existsById(id: string): Promise<boolean> {
        await this.ensureInitialized();
        return this.cache?.some(i => i.id === id) || false;
    }

    async findAllById(ids: string[]): Promise<ServiceResult<T[]>> {
        await this.ensureInitialized();
        const items = this.cache?.filter(i => ids.includes(i.id)) || [];
        return Result.success(items);
    }

    async count(): Promise<number> {
        await this.ensureInitialized();
        return this.cache?.length || 0;
    }

    async save(entity: Partial<T>): Promise<ServiceResult<T>> {
        await this.ensureInitialized();
        
        if (!entity.id) {
            return Result.error("Entity ID is required for save.");
        }

        const now = Date.now();
        const existingIndex = this.cache!.findIndex(i => i.id === entity.id);
        let savedEntity: T;

        if (existingIndex >= 0) {
            // Update
            savedEntity = {
                ...this.cache![existingIndex],
                ...entity,
                updatedAt: now
            };
            this.cache![existingIndex] = savedEntity;
        } else {
            // Create
            savedEntity = {
                ...entity,
                createdAt: entity.createdAt || now,
                updatedAt: now
            } as T;
            this.cache!.unshift(savedEntity); // Add to top
        }

        await this.persist();
        return Result.success(savedEntity);
    }

    async saveAll(entities: Partial<T>[]): Promise<ServiceResult<T[]>> {
        const results: T[] = [];
        for (const e of entities) {
            const res = await this.save(e);
            if (res.data) results.push(res.data);
        }
        return Result.success(results);
    }
    
    /**
     * Replace entire cache with new list (useful for reordering)
     */
    async setAll(entities: T[]): Promise<ServiceResult<void>> {
        this.cache = entities;
        await this.persist();
        return Result.success(undefined);
    }

    async deleteById(id: string): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        const initialLen = this.cache!.length;
        this.cache = this.cache!.filter(i => i.id !== id);
        
        if (this.cache.length !== initialLen) {
            await this.persist();
        }
        return Result.success(undefined);
    }

    async delete(entity: T): Promise<ServiceResult<void>> {
        return this.deleteById(entity.id);
    }

    async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        this.cache = this.cache!.filter(i => !ids.includes(i.id));
        await this.persist();
        return Result.success(undefined);
    }
    
    async clear(): Promise<ServiceResult<void>> {
        this.cache = [];
        await this.persist();
        return Result.success(undefined);
    }
}
