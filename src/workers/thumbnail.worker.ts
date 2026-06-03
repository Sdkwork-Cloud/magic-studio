
/**
 * Thumbnail Generation Web Worker
 * Offloads video frame extraction from main thread to prevent UI blocking
 */

interface WorkerRequest {
    id: string;
    type: 'extract';
    videoData: ArrayBuffer;
    time: number;
    quality: number;
    targetWidth: number;
}

interface WorkerResponse {
    id: string;
    type: 'success' | 'error';
    blob?: Blob;
    error?: string;
}

// Video decoding using browser-native worker-safe capabilities or a neutral fallback message
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    const { id, type } = e.data;

    if (type !== 'extract') {
        self.postMessage({ id, type: 'error', error: 'Unknown request type' } as WorkerResponse);
        return;
    }

    try {
        // Note: Web Workers cannot access DOM (video elements, canvas)
        // We use OffscreenCanvas for image processing
        // Video decoding would require browser video decode support or a worker-safe native media runtime

        // For now, this worker serves as a placeholder for future worker-safe video decode integration
        // Current implementation still needs main thread for video element access

        self.postMessage({
            id,
            type: 'error',
            error:
                'Worker-based thumbnail generation requires browser video decode support or a native media runtime',
        } as WorkerResponse);

    } catch (err) {
        self.postMessage({
            id,
            type: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
        } as WorkerResponse);
    }
};

export {};
