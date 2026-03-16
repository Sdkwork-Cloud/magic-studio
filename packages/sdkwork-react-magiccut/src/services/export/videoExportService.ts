
import { ExportOptions, ExportProgressCallback, ExportResolution } from './types';
import { OfflineRenderer } from './OfflineRenderer';
import { exportRegistry } from './ExportRegistry';
import { resolveAvailableExportEncoders, resolvePreferredExportEncoder } from '../../domain/export/exportCapabilities';
import { BrowserMediaEncoder } from './encoders/BrowserMediaEncoder';
import { WebCodecsEncoder } from './encoders/WebCodecsEncoder';
import { audioEngine } from '../../engine/AudioEngine';

const RESOLUTION_MAP: Record<ExportResolution, { w: number, h: number }> = {
    '480p': { w: 854, h: 480 },
    '720p': { w: 1280, h: 720 },
    '1080p': { w: 1920, h: 1080 },
    '2k': { w: 2560, h: 1440 },
    '4k': { w: 3840, h: 2160 },
};

type VideoContainerFormat = Exclude<ExtendedExportOptions['config']['format'], 'wav'>;

export interface ExtendedExportOptions extends ExportOptions {
    inPoint?: number | null;
    outPoint?: number | null;
}

class VideoExportService {
    private getContentDuration(timeline: ExtendedExportOptions['timeline'], state: ExtendedExportOptions['state']): number {
        let maxDuration = 0;
        if (!timeline.tracks) return 0;
        for (const trackRef of timeline.tracks) {
            const track = state.tracks[trackRef.id];
            if (!track || track.visible === false) continue;
            for (const clipRef of track.clips) {
                const clip = state.clips[clipRef.id];
                if (clip) {
                    maxDuration = Math.max(maxDuration, clip.start + clip.duration);
                }
            }
        }
        return maxDuration;
    }

    private sliceAudioBuffer(buffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer {
        const sampleRate = buffer.sampleRate;
        const startSample = Math.max(0, Math.floor(startTime * sampleRate));
        const endSample = Math.min(buffer.length, Math.ceil(endTime * sampleRate));
        const outLength = Math.max(1, endSample - startSample);

        const trimmed = new AudioBuffer({
            length: outLength,
            sampleRate,
            numberOfChannels: buffer.numberOfChannels,
        });

        for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
            trimmed
                .getChannelData(channelIndex)
                .set(buffer.getChannelData(channelIndex).subarray(startSample, endSample));
        }

        return trimmed;
    }

    private resolveRange(
        timeline: ExtendedExportOptions['timeline'],
        state: ExtendedExportOptions['state'],
        config: ExtendedExportOptions['config']
    ) {
        const contentDuration = this.getContentDuration(timeline, state);
        const fullDuration = contentDuration > 0 ? contentDuration : (timeline.duration || 10);
        const rangeStartTime = Math.max(0, Math.min(config.startTime ?? 0, fullDuration));
        const requestedEndTime = config.endTime ?? fullDuration;
        const rangeEndTime = Math.max(rangeStartTime, Math.min(requestedEndTime, fullDuration));
        const duration = Math.max(0, rangeEndTime - rangeStartTime);

        return {
            fullDuration,
            rangeStartTime,
            rangeEndTime,
            duration,
        };
    }

    private resolveFinalFileName(fileName: string, format: ExtendedExportOptions['config']['format'], mime?: string): string {
        let resolvedExt = format;

        if (mime?.includes('mp4')) resolvedExt = 'mp4';
        else if (mime?.includes('webm')) resolvedExt = 'webm';
        else if (mime?.includes('wav')) resolvedExt = 'wav';
        else if (mime?.includes('text')) resolvedExt = 'txt';

        const baseName = fileName.replace(/\.(mp4|mov|webm|wav|txt)$/i, '');
        return `${baseName}.${resolvedExt}`;
    }

    private async exportAudioOnly(
        options: ExtendedExportOptions,
        saver: ReturnType<typeof exportRegistry.getSaver>,
        onProgress?: ExportProgressCallback
    ): Promise<void> {
        const { timeline, state, config, signal } = options;
        const range = this.resolveRange(timeline, state, config);

        if (range.duration <= 0) {
            throw new Error('Invalid export range. Please check In/Out points.');
        }

        onProgress?.(8);

        let audioBuffer = await audioEngine.renderTimelineOffline(
            timeline,
            state.resources,
            state.tracks,
            state.clips
        );

        if (signal?.aborted) throw new Error('Export cancelled');

        if (range.rangeStartTime > 0 || range.rangeEndTime < range.fullDuration) {
            audioBuffer = this.sliceAudioBuffer(audioBuffer, range.rangeStartTime, range.rangeEndTime);
        }

        onProgress?.(82);

        const { encodeAudioBufferToWav } = await import('../../domain/export/wavEncoding');
        const blob = encodeAudioBufferToWav(audioBuffer);

        if (signal?.aborted) throw new Error('Export cancelled');

        onProgress?.(96);
        await saver.save(blob, this.resolveFinalFileName(config.fileName, 'wav', blob.type), config.destinationPath);
        onProgress?.(100);
    }
    
    public async exportTimeline(
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
        
        const saver = exportRegistry.getSaver(exportRegistry.getDefaultSaverId());

        if (!config.exportVideo && config.exportAudio) {
            await this.exportAudioOnly({ ...options, config: effectiveConfig }, saver, onProgress);
            return;
        }

        const renderer = new OfflineRenderer(dimensions.w, dimensions.h);
        const encoderId = await this.selectEncoder(config.format as VideoContainerFormat);
        const encoder = exportRegistry.getEncoder(encoderId);

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
            await saver.save(blob, this.resolveFinalFileName(config.fileName, config.format, blob.type), config.destinationPath);

        } catch (error) {
            if ((error as Error).message !== 'Export cancelled') {
                 console.error("Export Failed:", error);
            }
            throw error;
        }
    }

    public async exportVideo(
        options: ExtendedExportOptions,
        onProgress?: ExportProgressCallback
    ): Promise<void> {
        return this.exportTimeline(options, onProgress);
    }
    
    private async probeRuntimeCapabilities() {
        const webCodecsSupported = WebCodecsEncoder.isSupported();
        const mediaRecorderSupported = BrowserMediaEncoder.isSupported();

        const [h264Supported, vp8Supported, vp9Supported, webCodecsMuxerAvailable] = webCodecsSupported
            ? await Promise.all([
                WebCodecsEncoder.checkCodecSupport('avc1.64001f'),
                WebCodecsEncoder.checkCodecSupport('vp8'),
                WebCodecsEncoder.checkCodecSupport('vp09.00.10.08'),
                WebCodecsEncoder.checkMuxerSupport(),
            ])
            : [false, false, false, false];

        return {
            webCodecsSupported,
            h264Supported,
            vp8Supported,
            vp9Supported,
            webCodecsMuxerAvailable,
            mediaRecorderSupported,
        };
    }

    public async getRuntimeExportSupport() {
        const capabilities = await this.probeRuntimeCapabilities();

        return {
            webCodecsMp4Available:
                capabilities.webCodecsSupported &&
                capabilities.h264Supported &&
                capabilities.webCodecsMuxerAvailable,
            mediaRecorderMp4Available: BrowserMediaEncoder.supportsFormat('mp4'),
            mediaRecorderWebmAvailable: BrowserMediaEncoder.supportsFormat('webm'),
        };
    }

    private async selectEncoder(format: VideoContainerFormat): Promise<string> {
        const capabilities = await this.probeRuntimeCapabilities();
        const mediaRecorderSupportsRequestedFormat =
            format === 'mov' || format === 'txt'
                ? false
                : BrowserMediaEncoder.supportsFormat(format);
        const resolvedEncoderId = resolvePreferredExportEncoder(
            { ...capabilities, mediaRecorderSupported: mediaRecorderSupportsRequestedFormat },
            format
        );
        if (!resolvedEncoderId) {
            throw new Error(`No supported encoder is available for ${format.toUpperCase()} export in this runtime.`);
        }
        return resolvedEncoderId;
    }
    
    public async getAvailableEncoders(): Promise<{ id: string; name: string; available: boolean }[]> {
        return [...resolveAvailableExportEncoders(await this.probeRuntimeCapabilities())];
    }
    
    public async getEncoderCapabilities(encoderId: string): Promise<{
        supported: boolean;
        codecs: string[];
        maxResolution: string;
        hardwareAcceleration: boolean;
    }> {
        if (encoderId === 'webcodecs') {
            const capabilities = await this.probeRuntimeCapabilities();
            const supported = capabilities.webCodecsSupported && capabilities.h264Supported && capabilities.webCodecsMuxerAvailable;
            const codecs: string[] = [];
            
            if (capabilities.h264Supported) codecs.push('H.264');
            if (capabilities.vp8Supported) codecs.push('VP8');
            if (capabilities.vp9Supported) codecs.push('VP9');
            
            return {
                supported,
                codecs,
                maxResolution: supported ? '4K' : 'N/A',
                hardwareAcceleration: supported,
            };
        }
        
        return {
            supported: BrowserMediaEncoder.isSupported(),
            codecs: ['VP8', 'VP9'],
            maxResolution: BrowserMediaEncoder.isSupported() ? '1080p' : 'N/A',
            hardwareAcceleration: false,
        };
    }
}

export const videoExportService = new VideoExportService();

