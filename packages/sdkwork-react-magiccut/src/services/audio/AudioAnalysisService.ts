
// Thresholds
const SILENCE_THRESHOLD = 0.01; 
const MIN_SILENCE_DURATION = 0.5; // seconds

export interface SilenceSegment {
    start: number;
    end: number;
    duration: number;
}

export interface BeatMarker {
    time: number;
    energy: number;
}

class AudioAnalysisService {
    
    /**
     * Detect silent segments in an AudioBuffer using RMS.
     */
    detectSilence(buffer: AudioBuffer, threshold = SILENCE_THRESHOLD, minDuration = MIN_SILENCE_DURATION): SilenceSegment[] {
        const channelData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const silence: SilenceSegment[] = [];
        
        let isSilent = false;
        let silenceStart = 0;
        
        // Window size for RMS calculation (e.g. 50ms)
        const windowSize = Math.floor(sampleRate * 0.05); 
        
        for (let i = 0; i < channelData.length; i += windowSize) {
            // Calculate RMS for current window
            let sum = 0;
            const end = Math.min(i + windowSize, channelData.length);
            for (let j = i; j < end; j++) {
                sum += channelData[j] * channelData[j];
            }
            const rms = Math.sqrt(sum / (end - i));
            
            if (rms < threshold) {
                if (!isSilent) {
                    isSilent = true;
                    silenceStart = i / sampleRate;
                }
            } else {
                if (isSilent) {
                    isSilent = false;
                    const silenceEnd = i / sampleRate;
                    if (silenceEnd - silenceStart >= minDuration) {
                        silence.push({ start: silenceStart, end: silenceEnd, duration: silenceEnd - silenceStart });
                    }
                }
            }
        }
        
        // Check trailing silence
        if (isSilent) {
             const silenceEnd = channelData.length / sampleRate;
             if (silenceEnd - silenceStart >= minDuration) {
                 silence.push({ start: silenceStart, end: silenceEnd, duration: silenceEnd - silenceStart });
             }
        }
        
        return silence;
    }

    /**
     * Beat Detection using Dynamic Threshold Algorithm.
     * Computes local energy average and detects beats relative to it.
     * 
     * @param buffer AudioBuffer
     * @param sensitivity Constant C in algorithm (default 1.3). Lower = more beats.
     */
    detectBeats(buffer: AudioBuffer, sensitivity = 1.3): BeatMarker[] {
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const beats: BeatMarker[] = [];
        
        // 1. Analyze energy in small chunks (e.g. 1024 samples ~ 23ms)
        const frameSize = 1024;
        const energies: number[] = [];
        
        for (let i = 0; i < data.length; i += frameSize) {
             let sum = 0;
             const end = Math.min(i + frameSize, data.length);
             for (let j = i; j < end; j++) {
                 sum += data[j] * data[j];
             }
             energies.push(sum);
        }

        // 2. Sliding window for local average
        // History buffer size ~ 43 frames (approx 1 second history)
        const historySize = 43; 
        
        for (let i = 0; i < energies.length; i++) {
             // Calculate local average energy
             const start = Math.max(0, i - historySize);
             const window = energies.slice(start, i + 1); // Current included for adaptivity? or previous only? Usually surrounding or previous.
             // Simple version: use history
             const avgEnergy = window.reduce((a, b) => a + b, 0) / window.length;
             
             const instantEnergy = energies[i];
             
             // 3. Beat Condition: E > C * <E>
             if (instantEnergy > sensitivity * avgEnergy && instantEnergy > 0.01) { // 0.01 min threshold to avoid silence noise
                 // Store time in seconds
                 beats.push({
                     time: (i * frameSize) / sampleRate,
                     energy: instantEnergy
                 });
             }
        }
        
        // 4. Post-process: Debounce (remove beats too close to each other)
        const MIN_DISTANCE = 0.25; // 240 BPM limit
        const filteredBeats: BeatMarker[] = [];
        let lastTime = -1;
        
        for (const b of beats) {
            if (lastTime === -1 || b.time - lastTime > MIN_DISTANCE) {
                filteredBeats.push(b);
                lastTime = b.time;
            } else {
                // If this beat is stronger than the last kept beat, replace it (refine position)
                const lastBeat = filteredBeats[filteredBeats.length - 1];
                if (b.energy > lastBeat.energy) {
                    filteredBeats[filteredBeats.length - 1] = b;
                    lastTime = b.time;
                }
            }
        }
        
        return filteredBeats;
    }
}

export const audioAnalysisService = new AudioAnalysisService();

