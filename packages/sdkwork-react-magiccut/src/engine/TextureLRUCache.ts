/**
 * LRU Cache for WebGL Textures.
 * 
 * Uses JavaScript Map's insertion-order guarantee for O(1) LRU eviction.
 * On `get()`, the entry is deleted and re-inserted to move it to the "newest" end.
 * On eviction, `Map.keys().next()` returns the oldest entry in O(1).
 */
export class TextureLRUCache {
    private gl: WebGL2RenderingContext;
    // Single Map: insertion order = usage order (oldest first)
    private entries = new Map<string, { texture: WebGLTexture; size: number; width: number; height: number }>();

    // Approximate memory tracking (in bytes)
    private totalSize = 0;
    // Default limit: 512MB (increased for professional timeline stability)
    // 1920x1080 * 4 bytes ~ 8.3MB per frame. 512MB holds ~60 active FHD frames.
    private readonly MAX_SIZE = 512 * 1024 * 1024;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    public get(key: string): WebGLTexture | undefined {
        const entry = this.entries.get(key);
        if (!entry) return undefined;
        // Move to end (most recently used) by delete + re-insert (O(1))
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.texture;
    }

    public getInfo(key: string): { texture: WebGLTexture; width: number; height: number } | undefined {
        const entry = this.entries.get(key);
        if (!entry) return undefined;
        // Move to end (most recently used) by delete + re-insert
        this.entries.delete(key);
        this.entries.set(key, entry);
        return { texture: entry.texture, width: entry.width, height: entry.height };
    }

    public set(key: string, texture: WebGLTexture, width: number, height: number) {
        // If updating existing key, remove old size first
        const existing = this.entries.get(key);
        if (existing) {
            this.totalSize -= existing.size;
            this.entries.delete(key);
        }

        const size = width * height * 4; // Estimate RGBA size

        // Evict if needed
        this.ensureCapacity(size);

        this.entries.set(key, { texture, size, width, height });
        this.totalSize += size;
    }

    private ensureCapacity(newSize: number) {
        while (this.totalSize + newSize > this.MAX_SIZE && this.entries.size > 0) {
            this.evictLRU();
        }
    }

    private evictLRU() {
        // Map.keys().next() returns the oldest (first-inserted) entry in O(1)
        const oldestKey = this.entries.keys().next().value;
        if (oldestKey !== undefined) {
            this.delete(oldestKey);
        }
    }

    public delete(key: string) {
        const entry = this.entries.get(key);
        if (entry) {
            this.gl.deleteTexture(entry.texture);
            this.totalSize -= entry.size;
            this.entries.delete(key);
        }
    }

    public clear() {
        this.entries.forEach(entry => this.gl.deleteTexture(entry.texture));
        this.entries.clear();
        this.totalSize = 0;
    }

    public get count(): number { return this.entries.size; }
    public get memoryUsed(): number { return this.totalSize; }
}
