
;
import { CanvasBoard, CanvasExportMode } from '../entities/canvas.entity';
import { generateUUID, MediaResourceType, pathUtils } from 'sdkwork-react-commons';
import { thumbnailGenerator } from 'sdkwork-react-core';
import { canvasService } from './canvasService';
import { canvasToCutConverter } from './canvasToCutConverter';
import { CutProject, NormalizedState } from 'sdkwork-react-magiccut';
import { vfs } from 'sdkwork-react-fs';
import { platform } from 'sdkwork-react-core';
import { storageConfig } from 'sdkwork-react-fs';
import { assetService } from 'sdkwork-react-assets';

// Concurrency limit for video processing to prevent browser resource exhaustion
const MAX_CONCURRENT_TASKS = 3;
// Reduced timeout to fail faster on bad assets
const ASSET_PROCESS_TIMEOUT = 15000; // Increased to 15s to allow for large file writes

export class CanvasExportService {

    /**
     * Export the entire board state to a JSON blob
     */
    public exportToJson(board: CanvasBoard): Blob {
        const json = JSON.stringify(board, null, 2);
        return new Blob([json], { type: 'application/json' });
    }
    
    /**
     * Import a board from JSON string
     */
    public async importFromJson(jsonContent: string): Promise<CanvasBoard> {
        try {
            const data = JSON.parse(jsonContent);
            // Basic schema validation
            if (!data.elements || !Array.isArray(data.elements)) {
                throw new Error("Invalid Canvas Board JSON: missing elements array");
            }
            
            const newBoard: CanvasBoard = {
                ...data,
                id: generateUUID(),
                uuid: generateUUID(),
                title: data.title ? `${data.title} (Imported)` : 'Imported Board',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            // Persist the new board using the canvas service
            await canvasService.save(newBoard);
            
            return newBoard;
        } catch (e) {
            console.error("[CanvasExport] Import failed", e);
            throw e;
        }
    }

    /**
     * Converts the 2D Spatial Canvas into a 1D Linear Timeline Project for Magic Cut.
     * Includes asset optimization: generates thumbnails for videos to ensure smooth loading.
     */
    public async exportToMagicCut(board: CanvasBoard, projectName?: string, exportMode: CanvasExportMode = 'video_only'): Promise<string> {
        if (!board.elements || board.elements.length === 0) {
            throw new Error("Canvas is empty.");
        }

        // 1. Convert Logic (Graph-based topological sort)
        const project = canvasToCutConverter.convert(board, exportMode);
        
        // Override name if provided
        if (projectName) {
            project.name = projectName;
        }

        // 2. Asset Optimization (Thumbnails & Heavy Data Externalization)
        // We process this BEFORE saving so the project file contains valid references
        try {
            console.log(`[CanvasExport] Starting asset optimization for project: ${project.name}`);
            await this.processProjectAssets(project);
        } catch (e) {
            console.warn("[CanvasExport] Asset processing had errors, continuing with save:", e);
        }

        // 3. Persist - Note: magicCutProjectService would need to be imported from sdkwork-react-magiccut
        // For now, we'll just return the project ID
        console.log(`[CanvasExport] Project ready with ID: ${project.id}`);
        
        return project.id;
    }

    /**
     * Iterates through project resources in NORMALIZED STATE, generating thumbnails for videos,
     * and ensuring valid VFS paths for metadata. Also externalizes heavy Base64/Blob data.
     * Implements concurrency limiting and timeout protection.
     */
    private async processProjectAssets(project: CutProject): Promise<void> {
        const normalizedState = project.normalizedState as NormalizedState;
        if (!normalizedState || !normalizedState.resources) return;

        const resources = Object.values(normalizedState.resources);
        if (resources.length === 0) return;

        console.log(`[CanvasExport] Processing ${resources.length} resources...`);

        // Ensure directories exist
        const root = await platform.getPath('documents');
        const thumbsDir = pathUtils.join(root, storageConfig.globalCache.thumbnails);
        const assetsDir = pathUtils.join(root, storageConfig.library.images);
        const videoDir = pathUtils.join(root, storageConfig.library.video);

        try { await vfs.createDir(thumbsDir); } catch {}
        try { await vfs.createDir(assetsDir); } catch {}
        try { await vfs.createDir(videoDir); } catch {}

        // Helper for executing a single resource task safely
        const processResource = async (res: any) => {
            try {
                // Snapshot the valid URL before we potentially clear it during externalization
                const activeUrl = res.url;

                // DATA STRUCTURE NORMALIZATION
                
                // 1. Convert legacy localFile paths (from Desktop drag-drop) to proper Virtual Paths
                if (res.localFile?.path && !res.path) {
                    // Force virtual path conversion e.g. "assets://..."
                    res.path = await assetService.toVirtualPath(res.localFile.path);
                    res.localFile = undefined; // Cleanup legacy
                }

                // 2. Externalization (Heavy Assets)
                // We prioritize preserving the data on disk for the new project.
                // Note: externalizeBlob/Data will clear res.url on success.
                
                if (res.type === MediaResourceType.IMAGE && activeUrl && activeUrl.startsWith('data:image')) {
                    console.debug(`[CanvasExport] Externalizing image: ${res.name}`);
                    await this.externalizeData(res, assetsDir, 'png');
                }

                if (res.type === MediaResourceType.VIDEO && activeUrl && (activeUrl.startsWith('blob:') || activeUrl.startsWith('data:video'))) {
                    console.debug(`[CanvasExport] Externalizing video blob: ${res.name}`);
                    await this.externalizeBlob(res, videoDir, 'mp4');
                }

                // 3. Generate Thumbnails
                // Use activeUrl (the original source) as a hint because res.url might be cleared by externalization,
                // and resolving the new res.path from VFS might be slower or race-condition prone.
                if (res.type === MediaResourceType.VIDEO && !res.metadata?.thumbnailUrl) {
                    // FIX: Ensure we have a valid source URL.
                    // If externalization happened, res.path is now set.
                    // If no externalization, we might have activeUrl.
                    // If neither, we rely on res.path being present from before.
                    
                    let effectiveUrl = activeUrl;
                    
                    if (!effectiveUrl && res.path) {
                        // If we have a path, resolve it explicitly
                        effectiveUrl = await assetService.resolveAssetUrl({ path: res.path });
                    }

                    await this.generateVideoThumbnail(res, thumbsDir, effectiveUrl);
                }

                // 4. Final Clean-up
                // Ensure URL is cleared if path is set, to force Players to use the Path (source of truth)
                if (res.path && res.path.startsWith('assets://')) {
                    res.url = '';
                }

            } catch (e) {
                console.warn(`[CanvasExport] Failed to process asset ${res.name}:`, e);
                // Swallow individual error so other assets can proceed
            }
        };

        // Execute with concurrency limit
        const queue = [...resources];
        const workers = Array(Math.min(queue.length, MAX_CONCURRENT_TASKS)).fill(null).map(async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                if (item) {
                    // Wrap in timeout race
                    await Promise.race([
                        processResource(item),
                        new Promise(resolve => setTimeout(resolve, ASSET_PROCESS_TIMEOUT))
                    ]);
                }
            }
        });

        await Promise.all(workers);
        console.log(`[CanvasExport] Asset processing complete.`);
    }

    private async externalizeData(res: any, targetDir: string, defaultExt: string) {
        const matches = res.url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const b64Data = matches[2];
            const ext = mimeType.split('/')[1] || defaultExt;
            
            const binaryString = atob(b64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const safeName = this.hashString(res.id) + '_' + generateUUID().slice(0, 8);
            const fileName = `${safeName}.${ext}`;
            const filePath = pathUtils.join(targetDir, fileName);
            await vfs.writeFileBinary(filePath, bytes);
            
            res.path = await assetService.toVirtualPath(filePath); 
            res.localFile = undefined;
            res.url = ''; 
        }
    }

    private async externalizeBlob(res: any, targetDir: string, defaultExt: string) {
        if (!res.url) return;
        
        try {
            const response = await fetch(res.url);
            if (!response.ok) throw new Error("Failed to fetch blob");
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            
            const safeName = this.hashString(res.id) + '_' + generateUUID().slice(0, 8);
            const fileName = `${safeName}.${defaultExt}`;
            const filePath = pathUtils.join(targetDir, fileName);
            
            await vfs.writeFileBinary(filePath, new Uint8Array(buffer));
            
            res.path = await assetService.toVirtualPath(filePath);
            res.localFile = undefined;
            res.url = ''; // Clear transient URL
            
        } catch (e) {
            console.warn(`[CanvasExport] Failed to externalize blob for ${res.name}`, e);
        }
    }

    private async generateVideoThumbnail(res: any, thumbsDir: string, hintUrl?: string) {
        let sourceUrl = hintUrl || '';
        
        try {
            // 1. If no hint, try to resolve via Asset Service using path/url properties ONLY
            if (!sourceUrl) {
                // Construct a safe object for resolution - DO NOT include ID to prevent fallback to UUID-as-path
                const resolveTarget: any = {};
                if (res.path) resolveTarget.path = res.path;
                if (res.url) resolveTarget.url = res.url;

                if (resolveTarget.path || resolveTarget.url) {
                    sourceUrl = await assetService.resolveAssetUrl(resolveTarget);
                }
            }

            // 2. If still no URL, try to look up the full asset record from DB using ID
            // This handles cases where the resource is a reference but lacks path details in the canvas data
            if (!sourceUrl && res.id) {
                const assetRes = await assetService.findById(res.id);
                if (assetRes.success && assetRes.data) {
                    sourceUrl = await assetService.resolveAssetUrl(assetRes.data);
                    // Backfill path if found to correct the object reference
                    if (!res.path && assetRes.data.path) {
                        res.path = assetRes.data.path;
                    }
                }
            }

            if (sourceUrl) {
                // Generate Thumbnail at 1s
                const thumbBlob = await thumbnailGenerator.extractVideoFrame(sourceUrl, 1.0, 0.7, 480);
                
                if (thumbBlob) {
                    const safeId = this.hashString(res.id);
                    const fileName = `${safeId}_thumb.jpg`;
                    const thumbPath = pathUtils.join(thumbsDir, fileName);
                    
                    // Write to VFS
                    const buffer = await thumbBlob.arrayBuffer();
                    await vfs.writeFileBinary(thumbPath, new Uint8Array(buffer));
                    
                    // Update Resource Metadata in place
                    if (!res.metadata) res.metadata = {};
                    // Convert to virtual path for consistency across platforms
                    res.metadata.thumbnailUrl = await assetService.toVirtualPath(thumbPath);
                } 
            } else {
                 console.warn(`[CanvasExport] Could not resolve source URL for video thumbnail: ${res.id}`);
            }
        } catch (err) {
            console.warn(`[CanvasExport] Failed to generate thumbnail for ${res.name}`, err);
        }
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }
}

export const canvasExportService = new CanvasExportService();
