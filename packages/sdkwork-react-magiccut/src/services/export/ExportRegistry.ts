
import { IMediaEncoder, IFileSaveStrategy } from './types';
import { BrowserMediaEncoder } from './encoders/BrowserMediaEncoder';
import { WebCodecsEncoder } from './encoders/WebCodecsEncoder';
import { BrowserExportStrategy } from './strategies/BrowserExportStrategy';
import { DesktopExportStrategy } from './strategies/DesktopExportStrategy';
import { platform } from 'sdkwork-react-core';

// Factory types
export type EncoderFactory = () => IMediaEncoder;
export type SaverFactory = () => IFileSaveStrategy;

class ExportRegistry {
    private encoderFactories: Map<string, EncoderFactory> = new Map();
    private saverFactories: Map<string, SaverFactory> = new Map();

    constructor() {
        // Register Encoders
        this.registerEncoder('browser-media-recorder', () => new BrowserMediaEncoder());
        
        // Conditionally register WebCodecs if supported
        if (typeof window !== 'undefined' && 'VideoEncoder' in window) {
            this.registerEncoder('webcodecs', () => new WebCodecsEncoder());
        }
        
        // Register Savers
        this.registerSaver('browser-download', () => new BrowserExportStrategy());
        this.registerSaver('desktop-filesystem', () => new DesktopExportStrategy());
    }

    /**
     * Register a new Encoder Strategy (e.g. from a Plugin)
     */
    registerEncoder(id: string, factory: EncoderFactory) {
        this.encoderFactories.set(id, factory);
    }

    getEncoder(id: string): IMediaEncoder {
        const factory = this.encoderFactories.get(id);
        // Fallback to media recorder if requested is missing
        if (!factory) {
            console.warn(`Encoder '${id}' not found, falling back to browser-media-recorder`);
            return this.encoderFactories.get('browser-media-recorder')!();
        }
        return factory();
    }

    /**
     * Register a new Saver Strategy (e.g. Upload to S3)
     */
    registerSaver(id: string, factory: SaverFactory) {
        this.saverFactories.set(id, factory);
    }

    getSaver(id: string): IFileSaveStrategy {
        const factory = this.saverFactories.get(id);
        if (!factory) throw new Error(`Saver strategy '${id}' not found`);
        return factory();
    }

    /**
     * Helper to get the best available default based on platform
     */
    getDefaultSaverId(): string {
        return platform.getPlatform() === 'desktop' ? 'desktop-filesystem' : 'browser-download';
    }
}

export const exportRegistry = new ExportRegistry();

