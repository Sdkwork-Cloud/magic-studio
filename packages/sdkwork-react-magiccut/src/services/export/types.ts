
;
import { CutProject, CutTimeline } from '../../entities/magicCut.entity'
import { NormalizedState } from '../../store/types';

export type ExportResolution = '480p' | '720p' | '1080p' | '2k' | '4k';
export type ExportFrameRate = 24 | 25 | 30 | 50 | 60;
export type ExportFormat = 'mp4' | 'webm' | 'mov' | 'txt';
export type ExportCodec = 'h264' | 'hevc' | 'vp9';
export type ExportBitrate = 'lower' | 'recommended' | 'higher';

export interface ExportConfig {
    fileName: string;
    destinationPath?: string;
    resolution: ExportResolution;
    frameRate: ExportFrameRate;
    format: ExportFormat;
    codec?: ExportCodec;
    bitrate: ExportBitrate;
    exportVideo: boolean;
    exportAudio: boolean;
    smartHdr?: boolean;
    startTime?: number;
    endTime?: number;
    duration?: number;
}

export interface ExportOptions {
    project: CutProject;
    timeline: CutTimeline;
    state: NormalizedState;
    config: ExportConfig;
    signal?: AbortSignal;
}

export type ExportProgressCallback = (progress: number) => void;

export interface IMediaEncoder {
    readonly requiresRealtime: boolean;
    initialize(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer | null, config: ExportConfig): Promise<void>;
    start(): void;
    captureFrame(timestamp: number, duration: number): Promise<void>;
    finish(): Promise<Blob>;
    dispose(): void;
}

export interface IFileSaveStrategy {
    save(blob: Blob, filename: string, destinationPath?: string): Promise<void>;
}

