
/**
 * Waveform Generation Worker
 * Handles heavy array processing off the main thread.
 */

self.onmessage = (e: MessageEvent) => {
    const { id, channelData, sampleRate, peaksPerSec } = e.data;

    try {
        // channelData is a Float32Array passed via transfer (or copy)
        const duration = channelData.length / sampleRate;
        const totalPeaks = Math.ceil(duration * peaksPerSec);
        const blockSize = Math.floor(sampleRate / peaksPerSec);
        
        const peaks = new Float32Array(totalPeaks);
        
        for (let i = 0; i < totalPeaks; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, channelData.length);
            
            let sum = 0;
            let count = 0;
            // Optimization: Step 4 for speed (still accurate enough for visuals)
            for (let j = start; j < end; j += 4) {
                const val = channelData[j];
                sum += val * val;
                count++;
            }
            // RMS (Root Mean Square) for better loudness visualization
            const rms = count > 0 ? Math.sqrt(sum / count) : 0;
            
            // Normalize and boost quieter parts slightly for visibility
            peaks[i] = Math.min(1.0, rms * 3.0); 
        }

        // Send back the result, transferring the buffer ownership
        self.postMessage({ id, peaks }, { transfer: [peaks.buffer] });

    } catch (err) {
        // Log to console for debugging even in worker
        console.error("Worker Error:", err);
        self.postMessage({ id, error: String(err) });
    }
};

// Ensure this file is treated as a module
export {};
