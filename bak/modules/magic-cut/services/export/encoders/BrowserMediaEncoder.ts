
import { IMediaEncoder, ExportConfig } from '../types';

export class BrowserMediaEncoder implements IMediaEncoder {
    // MediaRecorder relies on real-time stream capture
    public readonly requiresRealtime = true;

    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private chunks: Blob[] = [];
    private audioCtx: AudioContext | null = null;
    private audioDest: MediaStreamAudioDestinationNode | null = null;
    private audioSource: AudioBufferSourceNode | null = null;
    private videoTrack: CanvasCaptureMediaStreamTrack | null = null;
    private config: ExportConfig | null = null;
    private audioBuffer: AudioBuffer | null = null;
    
    async initialize(canvas: HTMLCanvasElement, audioBuffer: AudioBuffer | null, config: ExportConfig): Promise<void> {
        this.config = config;
        this.audioBuffer = audioBuffer;

        // 1. Capture Stream from Canvas (0 fps = manual capture request)
        this.stream = canvas.captureStream(0);

        // 2. Setup Audio Context (but don't start yet)
        if (config.exportAudio && audioBuffer) {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                this.audioCtx = new AudioContextClass();
                this.audioDest = this.audioCtx.createMediaStreamDestination();
                
                // Add audio track to stream
                const audioTrack = this.audioDest.stream.getAudioTracks()[0];
                if (audioTrack) this.stream.addTrack(audioTrack);
            } catch (e) {
                console.warn("[BrowserMediaEncoder] Audio setup failed", e);
            }
        }

        // 3. Determine Format/MIME
        const mimeType = this.getSupportedMimeType(config.format);
        if (!mimeType) {
            throw new Error(`Format ${config.format} is not supported by this browser.`);
        }

        // 4. Initialize Recorder
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType,
            videoBitsPerSecond: this.calculateBitrate(config),
        });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.videoTrack = this.stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    }

    start(): void {
        if (!this.mediaRecorder) return;
        
        // Start Recorder
        this.mediaRecorder.start();

        // Start Audio Playback if configured
        if (this.config?.exportAudio && this.audioBuffer && this.audioCtx && this.audioDest) {
             // Create source node fresh here to ensure it starts exactly now
             this.audioSource = this.audioCtx.createBufferSource();
             this.audioSource.buffer = this.audioBuffer;
             this.audioSource.connect(this.audioDest);
             
             if (this.audioCtx.state === 'suspended') {
                 this.audioCtx.resume().catch(() => {});
             }
             this.audioSource.start(0);
        }
    }

    async captureFrame(timestamp: number, duration: number): Promise<void> {
        if (this.videoTrack && this.videoTrack.requestFrame) {
            this.videoTrack.requestFrame();
        }
    }

    async finish(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error("Recorder not initialized"));
                return;
            }

            this.mediaRecorder.onstop = () => {
                // Determine blob type from recorder or default
                const type = this.mediaRecorder?.mimeType || 'video/webm';
                const blob = new Blob(this.chunks, { type });
                this.dispose();
                resolve(blob);
            };

            this.mediaRecorder.onerror = (e) => {
                this.dispose();
                reject(e);
            };

            // Stop audio first
            if (this.audioSource) {
                try { this.audioSource.stop(); } catch {}
            }

            // Stop recorder
            if (this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            } else {
                // If already stopped (rare), resolve immediately
                const type = this.mediaRecorder?.mimeType || 'video/webm';
                const blob = new Blob(this.chunks, { type });
                this.dispose();
                resolve(blob);
            }
        });
    }

    dispose() {
        if (this.audioCtx) {
            try { this.audioCtx.close(); } catch {}
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
        }
        this.chunks = [];
        this.mediaRecorder = null;
        this.audioCtx = null;
        this.audioDest = null;
        this.audioSource = null;
        this.videoTrack = null;
    }

    private getSupportedMimeType(format: string): string {
        const codecs = [
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];

        // Prefer exact match if possible
        if (format === 'mp4') {
            const mp4 = codecs.find(c => c.includes('mp4') && MediaRecorder.isTypeSupported(c));
            if (mp4) return mp4;
        }

        // Fallback to whatever works
        return codecs.find(c => MediaRecorder.isTypeSupported(c)) || '';
    }

    private calculateBitrate(config: ExportConfig): number {
        // Simple mapping based on config
        let base = 8000000; // 8 Mbps
        if (config.resolution === '4k') base = 40000000;
        else if (config.resolution === '2k') base = 16000000;
        else if (config.resolution === '720p') base = 4000000;

        if (config.bitrate === 'lower') base *= 0.6;
        if (config.bitrate === 'higher') base *= 1.5;

        return base;
    }
}
