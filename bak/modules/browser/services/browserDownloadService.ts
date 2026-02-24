
import { DownloadItem } from '../entities/browser.entity';
import { vfs } from '../../fs/vfs';
import { pathUtils } from '../../../utils/pathUtils';
import { platform } from '../../../platform';
import { settingsService } from '../../settings/services/settingsService';
import { assetService, ASSET_CATEGORIES } from '../../assets/services/assetService';
import { AssetType } from '../../assets/entities/asset.entity';
import { storageConfig } from '../../fs/storageConfig';
import { generateUUID } from '../../../utils';

class BrowserDownloadService {
    private tasks = new Map<string, DownloadItem>();
    private listeners = new Set<(items: DownloadItem[]) => void>();

    private notify() {
        const items = Array.from(this.tasks.values()).sort((a, b) => b.startTime - a.startTime);
        this.listeners.forEach(cb => cb(items));
    }

    public subscribe(callback: (items: DownloadItem[]) => void) {
        this.listeners.add(callback);
        callback(Array.from(this.tasks.values()).sort((a, b) => b.startTime - a.startTime));
        return () => { this.listeners.delete(callback); };
    }

    public async startDownload(url: string, filename?: string): Promise<void> {
        const id = generateUUID();
        const name = filename || url.split('/').pop()?.split('?')[0] || `download-${Date.now()}.bin`;
        
        const item: DownloadItem = {
            id,
            url,
            filename: name,
            receivedBytes: 0,
            status: 'pending',
            startTime: Date.now()
        };
        
        this.tasks.set(id, item);
        this.notify();

        try {
            await this.executeDownload(item);
        } catch (e: any) {
            this.tasks.set(id, { ...item, status: 'failed', error: e.message });
            this.notify();
        }
    }

    private async executeDownload(item: DownloadItem) {
        this.tasks.set(item.id, { ...item, status: 'downloading' });
        this.notify();

        // 1. Get Settings
        const settingsRes = await settingsService.getSettings();
        const settings = settingsRes.success ? settingsRes.data : null;
        const downloadDir = settings?.browser.downloadPath || storageConfig.library.downloads; // Default or configured
        
        // Ensure dir exists (relative to Documents usually, but we use absolute VFS paths here if possible)
        const docRoot = await platform.getPath('documents');
        const targetDir = pathUtils.join(docRoot, downloadDir);
        try { await vfs.createDir(targetDir); } catch {}

        const targetPath = pathUtils.join(targetDir, item.filename);

        // 2. Perform Request
        const response = await platform.httpRequest(item.url, { method: 'GET' });
        
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        
        const total = Number(response.headers.get('content-length')) || 0;
        
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while(true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            if (value) {
                chunks.push(value);
                received += value.length;
                
                // Update Progress
                this.tasks.set(item.id, {
                    ...this.tasks.get(item.id)!,
                    receivedBytes: received,
                    totalBytes: total > 0 ? total : undefined
                });
                // Throttle notifications? For now, we notify every chunk (might need throttle for large files)
                this.notify(); 
            }
        }

        // 3. Combine & Save
        const combined = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        await vfs.writeFileBinary(targetPath, combined);

        // 4. Update Status
        this.tasks.set(item.id, {
            ...this.tasks.get(item.id)!,
            status: 'completed',
            endTime: Date.now(),
            path: targetPath
        });
        this.notify();

        // 5. Auto-Import to Assets if enabled
        if (settings?.browser?.autoImportToAssets) {
            this.tryImportToAssets(targetPath, item.filename, combined);
        }
    }

    private async tryImportToAssets(path: string, filename: string, data: Uint8Array) {
        // Detect type
        const ext = pathUtils.extname(filename).toLowerCase();
        let category: AssetType | null = null;
        
        for (const cat of ASSET_CATEGORIES) {
            if (cat.accepts.includes(ext)) {
                category = cat.id as AssetType;
                break;
            }
        }

        if (category) {
            try {
                await assetService.importAsset(data, filename, category);
                console.log(`[Browser] Auto-imported ${filename} to assets`);
            } catch (e) {
                console.warn("Failed to auto-import download", e);
            }
        }
    }
    
    public clearCompleted() {
        const active = new Map<string, DownloadItem>();
        this.tasks.forEach((v, k) => {
            if (v.status === 'downloading' || v.status === 'pending') {
                active.set(k, v);
            }
        });
        this.tasks = active;
        this.notify();
    }
}

export const browserDownloadService = new BrowserDownloadService();
