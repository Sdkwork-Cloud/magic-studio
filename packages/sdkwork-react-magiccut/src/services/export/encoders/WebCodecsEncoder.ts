
import { IMediaEncoder, ExportConfig } from '../types';

export class WebCodecsEncoder implements IMediaEncoder {
    public readonly requiresRealtime = false;

    private canvas: HTMLCanvasElement | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private config: ExportConfig | null = null;
    private startTime = 0;
    private frameCount = 0;
    
    private output: any = null;
    private videoSource: any = null;
    private audioSource: any = null;
    private mediabunny: any = null;

    async initialize(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer | null, config: ExportConfig): Promise<void> {
        this.canvas = canvas;
        this.audioBuffer = audioBuffer;
        this.config = config;
        this.startTime = performance.now();

        const initialized = await this.initializeMediabunny();
        if (!initialized) {
            console.warn('[WebCodecs] Mediabunny not available, export will produce placeholder');
        }
    }

    private async initializeMediabunny(): Promise<boolean> {
        try {
            const dynamicImport = new Function('m', 'return import(m)');
            this.mediabunny = await dynamicImport('mediabunny');
            
            const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource } = this.mediabunny;
            
            if (!Output || !CanvasSource) {
                console.warn('[WebCodecs] Mediabunny API incomplete');
                return false;
            }
            
            const output = new Output({
                format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
                target: new BufferTarget(),
            });
            
            const videoSource = new CanvasSource(this.canvas!, {
                codec: 'avc',
                width: this.width,
                height: this.height,
                bitrate: this.getBitrate(),
                framerate: this.config?.frameRate || 30,
            });
            
            output.addVideoTrack(videoSource, {
                frameRate: this.config?.frameRate || 30,
            });
            
            if (this.audioBuffer && AudioBufferSource) {
                const audioSource = new AudioBufferSource({
                    codec: 'aac',
                    sampleRate: this.audioBuffer.sampleRate,
                    numberOfChannels: this.audioBuffer.numberOfChannels,
                    bitrate: 128000,
                });
                output.addAudioTrack(audioSource);
                this.audioSource = audioSource;
            }
            
            await output.start();
            
            this.output = output;
            this.videoSource = videoSource;
            
            return true;
        } catch (e) {
            console.warn('[WebCodecs] Mediabunny not available:', e);
            return false;
        }
    }

    private get width(): number {
        return this.canvas?.width || 1920;
    }

    private get height(): number {
        return this.canvas?.height || 1080;
    }

    start(): void {
        this.frameCount = 0;
    }

    async captureFrame(timestamp: number, duration: number): Promise<void> {
        if (!this.canvas) return;

        if (this.videoSource) {
            await this.videoSource.add(timestamp, duration);
        }

        this.frameCount++;
    }

    async finish(): Promise<Blob> {
        const elapsed = ((performance.now() - this.startTime) / 1000).toFixed(2);

        if (this.output && this.videoSource) {
            if (this.audioSource && this.audioBuffer) {
                await this.audioSource.add(this.audioBuffer);
            }
            
            this.videoSource?.close?.();
            this.audioSource?.close?.();
            
            await this.output.finalize();
            
            const buffer = this.output.target.getSlice(0, this.output.target.getPos());
            
            return new Blob([buffer], { type: 'video/mp4' });
        }

        const message = `WebCodecs Export (No Muxer Available)

Total Frames: ${this.frameCount}
Duration: ${elapsed}s
Resolution: ${this.width}x${this.height}

To generate MP4 files, install Mediabunny:
  npm install mediabunny

Mediabunny is a modern, zero-dependency media toolkit for the browser.
It supports MP4, WebM, and many other formats with hardware-accelerated encoding.

Learn more: https://www.npmjs.com/package/mediabunny`;
        
        return new Blob([message], { type: 'text/plain' });
    }

    dispose(): void {
        this.videoSource?.close?.();
        this.audioSource?.close?.();
        
        this.output = null;
        this.videoSource = null;
        this.audioSource = null;
        this.mediabunny = null;
        this.canvas = null;
        this.audioBuffer = null;
    }

    private getBitrate(): number {
        const config = this.config;
        if (!config) return 8_000_000;

        const { QUALITY_HIGH, QUALITY_MEDIUM, QUALITY_LOW } = this.mediabunny || {};
        
        if (config.bitrate === 'higher' && QUALITY_HIGH) return QUALITY_HIGH;
        if (config.bitrate === 'lower' && QUALITY_LOW) return QUALITY_LOW;
        if (QUALITY_MEDIUM) return QUALITY_MEDIUM;

        let base = 8_000_000;
        
        switch (config.resolution) {
            case '4k': base = 45_000_000; break;
            case '2k': base = 20_000_000; break;
            case '1080p': base = 10_000_000; break;
            case '720p': base = 5_000_000; break;
            case '480p': base = 2_500_000; break;
        }

        switch (config.bitrate) {
            case 'lower': base = Math.round(base * 0.6); break;
            case 'higher': base = Math.round(base * 1.5); break;
        }

        return base;
    }

    static isSupported(): boolean {
        return typeof VideoEncoder !== 'undefined';
    }

    static async checkCodecSupport(codec: string = 'avc1.64001f'): Promise<boolean> {
        if (!('VideoEncoder' in window)) return false;
        
        try {
            const support = await VideoEncoder.isConfigSupported({
                codec,
                width: 1920,
                height: 1080,
                bitrate: 8000000,
                framerate: 30,
            });
            return support.supported ?? false;
        } catch {
            return false;
        }
    }
}

