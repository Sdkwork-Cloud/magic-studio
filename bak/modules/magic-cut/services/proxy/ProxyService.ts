
export type ProxyQuality = 'original' | 'proxy_720p' | 'proxy_480p' | 'proxy_360p';

export interface ProxyConfig {
    enabled: boolean;
    autoGenerate: boolean;
    defaultQuality: ProxyQuality;
    proxyResolution: number;
    proxyBitrate: number;
    proxyFormat: 'mp4' | 'webm';
}

export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
    enabled: true,
    autoGenerate: true,
    defaultQuality: 'proxy_720p',
    proxyResolution: 720,
    proxyBitrate: 2000000,
    proxyFormat: 'mp4'
};

export interface ProxyStatus {
    resourceId: string;
    originalUrl: string;
    proxyUrl: string | null;
    quality: ProxyQuality;
    status: 'pending' | 'generating' | 'ready' | 'failed';
    progress: number;
    originalSize: number;
    proxySize: number | null;
    generatedAt: number | null;
}

export interface ProxyManifest {
    version: number;
    resources: Record<string, ProxyStatus>;
}

export class ProxyService {
    private config: ProxyConfig = DEFAULT_PROXY_CONFIG;
    private proxyStatus = new Map<string, ProxyStatus>();
    private generating = new Set<string>();
    private onProgressCallbacks = new Map<string, (progress: number) => void>();
    
    public setConfig(config: Partial<ProxyConfig>): void {
        this.config = { ...this.config, ...config };
    }
    
    public getConfig(): ProxyConfig {
        return { ...this.config };
    }
    
    public getProxyStatus(resourceId: string): ProxyStatus | undefined {
        return this.proxyStatus.get(resourceId);
    }
    
    public getAllProxyStatus(): ProxyStatus[] {
        return Array.from(this.proxyStatus.values());
    }
    
    public needsProxy(resourceId: string, originalWidth: number, originalHeight: number): boolean {
        if (!this.config.enabled) return false;
        
        const maxDimension = Math.max(originalWidth, originalHeight);
        const proxyThreshold = this.getProxyThreshold();
        
        return maxDimension > proxyThreshold;
    }
    
    private getProxyThreshold(): number {
        switch (this.config.defaultQuality) {
            case 'proxy_720p': return 720;
            case 'proxy_480p': return 480;
            case 'proxy_360p': return 360;
            default: return 1080;
        }
    }
    
    public getProxyResolution(): { width: number; height: number } {
        const height = this.config.proxyResolution;
        const aspectRatio = 16 / 9;
        return {
            width: Math.round(height * aspectRatio),
            height
        };
    }
    
    public async generateProxy(
        resourceId: string,
        originalUrl: string,
        onProgress?: (progress: number) => void
    ): Promise<string | null> {
        if (!this.config.enabled) {
            return null;
        }
        
        if (this.generating.has(resourceId)) {
            if (onProgress) {
                this.onProgressCallbacks.set(resourceId, onProgress);
            }
            return null;
        }
        
        const existing = this.proxyStatus.get(resourceId);
        if (existing && existing.status === 'ready' && existing.proxyUrl) {
            return existing.proxyUrl;
        }
        
        this.generating.add(resourceId);
        if (onProgress) {
            this.onProgressCallbacks.set(resourceId, onProgress);
        }
        
        const status: ProxyStatus = {
            resourceId,
            originalUrl,
            proxyUrl: null,
            quality: this.config.defaultQuality,
            status: 'generating',
            progress: 0,
            originalSize: 0,
            proxySize: null,
            generatedAt: null
        };
        this.proxyStatus.set(resourceId, status);
        
        try {
            const proxyUrl = await this.transcodeToProxy(resourceId, originalUrl);
            
            status.proxyUrl = proxyUrl;
            status.status = 'ready';
            status.progress = 100;
            status.generatedAt = Date.now();
            
            return proxyUrl;
        } catch (error) {
            console.error(`[ProxyService] Failed to generate proxy for ${resourceId}:`, error);
            status.status = 'failed';
            return null;
        } finally {
            this.generating.delete(resourceId);
            this.onProgressCallbacks.delete(resourceId);
        }
    }
    
    private async transcodeToProxy(resourceId: string, originalUrl: string): Promise<string> {
        const { width, height } = this.getProxyResolution();
        
        const proxyFileName = `proxy_${resourceId}_${width}x${height}.${this.config.proxyFormat}`;
        const proxyUrl = `proxy://${proxyFileName}`;
        
        await this.simulateProxyGeneration(resourceId);
        
        return proxyUrl;
    }
    
    private async simulateProxyGeneration(resourceId: string): Promise<void> {
        const totalSteps = 10;
        for (let i = 0; i <= totalSteps; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const progress = (i / totalSteps) * 100;
            const status = this.proxyStatus.get(resourceId);
            if (status) {
                status.progress = progress;
            }
            
            const callback = this.onProgressCallbacks.get(resourceId);
            if (callback) {
                callback(progress);
            }
        }
    }
    
    public resolveProxyUrl(resourceId: string): string | null {
        if (!this.config.enabled) return null;
        
        const status = this.proxyStatus.get(resourceId);
        if (status && status.status === 'ready' && status.proxyUrl) {
            return status.proxyUrl;
        }
        
        return null;
    }
    
    public getEffectiveUrl(resourceId: string, originalUrl: string, useProxy: boolean = true): string {
        if (useProxy && this.config.enabled) {
            const proxyUrl = this.resolveProxyUrl(resourceId);
            if (proxyUrl) {
                return proxyUrl;
            }
        }
        return originalUrl;
    }
    
    public async deleteProxy(resourceId: string): Promise<void> {
        const status = this.proxyStatus.get(resourceId);
        if (status && status.proxyUrl) {
            this.proxyStatus.delete(resourceId);
        }
    }
    
    public async deleteAllProxies(): Promise<void> {
        this.proxyStatus.clear();
    }
    
    public exportManifest(): ProxyManifest {
        return {
            version: 1,
            resources: Object.fromEntries(this.proxyStatus)
        };
    }
    
    public importManifest(manifest: ProxyManifest): void {
        if (manifest.version !== 1) {
            console.warn('[ProxyService] Unsupported manifest version:', manifest.version);
            return;
        }
        
        for (const [resourceId, status] of Object.entries(manifest.resources)) {
            this.proxyStatus.set(resourceId, status);
        }
    }
    
    public getProxyStats(): {
        total: number;
        ready: number;
        pending: number;
        generating: number;
        failed: number;
        totalOriginalSize: number;
        totalProxySize: number;
        savingsRatio: number;
    } {
        let total = 0;
        let ready = 0;
        let pending = 0;
        let generating = 0;
        let failed = 0;
        let totalOriginalSize = 0;
        let totalProxySize = 0;
        
        this.proxyStatus.forEach(status => {
            total++;
            totalOriginalSize += status.originalSize || 0;
            
            switch (status.status) {
                case 'ready':
                    ready++;
                    totalProxySize += status.proxySize || 0;
                    break;
                case 'pending':
                    pending++;
                    break;
                case 'generating':
                    generating++;
                    break;
                case 'failed':
                    failed++;
                    break;
            }
        });
        
        const savingsRatio = totalOriginalSize > 0 
            ? 1 - (totalProxySize / totalOriginalSize) 
            : 0;
        
        return {
            total,
            ready,
            pending,
            generating,
            failed,
            totalOriginalSize,
            totalProxySize,
            savingsRatio
        };
    }
}

export const proxyService = new ProxyService();
