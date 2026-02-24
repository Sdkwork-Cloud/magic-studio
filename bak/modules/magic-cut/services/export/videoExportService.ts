
import { ExportOptions, ExportProgressCallback, ExportResolution } from './types';
import { OfflineRenderer } from './OfflineRenderer';
import { exportRegistry } from './ExportRegistry';
import { WebCodecsEncoder } from './encoders/WebCodecsEncoder';

const RESOLUTION_MAP: Record<ExportResolution, { w: number, h: number }> = {
    '480p': { w: 854, h: 480 },
    '720p': { w: 1280, h: 720 },
    '1080p': { w: 1920, h: 1080 },
    '2k': { w: 2560, h: 1440 },
    '4k': { w: 3840, h: 2160 },
};

export interface ExtendedExportOptions extends ExportOptions {
    inPoint?: number | null;
    outPoint?: number | null;
}

class VideoExportService {
    
    public async exportVideo(
        options: ExtendedExportOptions, 
        onProgress?: ExportProgressCallback
    ): Promise<void> {
        const { timeline, state, config, signal, inPoint, outPoint } = options;

        const dimensions = RESOLUTION_MAP[config.resolution] || { w: 1920, h: 1080 };
        
        const effectiveConfig = { ...config };
        if (inPoint !== null && inPoint !== undefined) {
            effectiveConfig.startTime = inPoint;
        }
        if (outPoint !== null && outPoint !== undefined) {
            effectiveConfig.endTime = outPoint;
        }
        
        const renderer = new OfflineRenderer(dimensions.w, dimensions.h);
        
        const encoderId = await this.selectEncoder();
        
        const encoder = exportRegistry.getEncoder(encoderId);
        const saver = exportRegistry.getSaver(exportRegistry.getDefaultSaverId());

        try {
            const blob = await renderer.render(
                timeline, 
                state, 
                effectiveConfig,
                encoder,
                (progress) => {
                    if (onProgress) onProgress(progress);
                },
                signal
            );

            if (signal?.aborted) throw new Error("Export cancelled");

            let finalName = config.fileName;
            const mime = blob.type;
            let ext = config.format;

            if (mime.includes('mp4')) ext = 'mp4';
            else if (mime.includes('webm')) ext = 'webm';
            else if (mime.includes('text')) ext = 'txt';
            
            finalName = finalName.replace(/\.(mp4|mov|webm|txt)$/i, '');
            finalName += `.${ext}`;

            await saver.save(blob, finalName, config.destinationPath);

        } catch (error) {
            if ((error as Error).message !== 'Export cancelled') {
                 console.error("Export Failed:", error);
            }
            throw error;
        }
    }
    
    private async selectEncoder(): Promise<string> {
        if (WebCodecsEncoder.isSupported()) {
            const h264Supported = await WebCodecsEncoder.checkCodecSupport('avc1.64001f');
            if (h264Supported) {
                return 'webcodecs';
            }
        }
        
        return 'browser-media-recorder';
    }
    
    public async getAvailableEncoders(): Promise<{ id: string; name: string; available: boolean }[]> {
        const encoders = [
            { id: 'webcodecs', name: 'WebCodecs (H.264/MP4)', available: false },
            { id: 'browser-media-recorder', name: 'MediaRecorder (WebM/VP9)', available: true },
        ];
        
        if (WebCodecsEncoder.isSupported()) {
            const h264Supported = await WebCodecsEncoder.checkCodecSupport('avc1.64001f');
            encoders[0].available = h264Supported;
        }
        
        return encoders;
    }
    
    public async getEncoderCapabilities(encoderId: string): Promise<{
        supported: boolean;
        codecs: string[];
        maxResolution: string;
        hardwareAcceleration: boolean;
    }> {
        if (encoderId === 'webcodecs') {
            const supported = WebCodecsEncoder.isSupported();
            const codecs: string[] = [];
            
            if (supported) {
                const h264 = await WebCodecsEncoder.checkCodecSupport('avc1.64001f');
                const vp8 = await WebCodecsEncoder.checkCodecSupport('vp8');
                const vp9 = await WebCodecsEncoder.checkCodecSupport('vp09.00.10.08');
                
                if (h264) codecs.push('H.264');
                if (vp8) codecs.push('VP8');
                if (vp9) codecs.push('VP9');
            }
            
            return {
                supported,
                codecs,
                maxResolution: supported ? '4K' : 'N/A',
                hardwareAcceleration: supported,
            };
        }
        
        return {
            supported: true,
            codecs: ['VP8', 'VP9'],
            maxResolution: '1080p',
            hardwareAcceleration: false,
        };
    }
}

export const videoExportService = new VideoExportService();
