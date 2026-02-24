

// Concurrency Control
const MAX_CONCURRENT_TASKS = 2;
const taskQueue: (() => Promise<void>)[] = [];
let activeTasks = 0;

const processQueue = () => {
    if (activeTasks >= MAX_CONCURRENT_TASKS || taskQueue.length === 0) return;
    const task = taskQueue.shift();
    if (task) {
        activeTasks++;
        task().finally(() => {
            activeTasks--;
            processQueue();
        });
    }
};

const enqueueTask = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        taskQueue.push(async () => {
            try {
                const result = await fn();
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
        processQueue();
    });
};

export const thumbnailGenerator = {
    /**
     * Extracts a frame using Heuristic Content Search.
     * If the target frame is black/empty, it intelligently seeks forward to find content.
     */
    extractVideoFrame: async (videoUrl: string, time: number, quality: number = 0.7, targetWidth: number = 480): Promise<Blob | null> => {
        return enqueueTask(() => thumbnailGenerator._extractInternal(videoUrl, time, quality, targetWidth));
    },

    _extractInternal: async (videoUrl: string, targetTime: number, quality: number, targetWidth: number): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            
            // Setup for maximum compatibility and off-screen rendering
            video.crossOrigin = "anonymous";
            video.muted = true;
            video.autoplay = false;
            video.playsInline = true;
            video.preload = 'auto';
            
            // Hide it but keep it in DOM for event loop stability
            Object.assign(video.style, {
                position: 'fixed', top: '-9999px', left: '-9999px',
                width: '1px', height: '1px', opacity: '0.001', pointerEvents: 'none', zIndex: '-9999'
            });
            document.body.appendChild(video);

            let completed = false;
            
            // Search Strategy: [current, +0.1s, +0.5s, +1.0s, +10% duration]
            // Only applied if we are asking for the start of the video (cover mode) OR if frame is unexpectedly black
            // We broaden the "Cover Search" definition to < 1.0s to catch long fade-ins
            const isScanningForCover = targetTime < 1.0;
            
            let currentSeekIndex = 0;
            // Offsets relative to targetTime
            const seekOffsets = [0, 0.1, 0.5, 1.0, 2.0]; 
            
            // Safety timeout
            const timeoutId = setTimeout(() => finish(null), 15000);

            const cleanup = () => {
                clearTimeout(timeoutId);
                if (document.body.contains(video)) {
                    document.body.removeChild(video);
                }
                video.removeAttribute('src');
                video.load();
            };

            const finish = (blob: Blob | null) => {
                if (completed) return;
                completed = true;
                cleanup();
                resolve(blob);
            };

            // ALGORITHM: Visual Entropy Check
            // Returns true if the frame has significant content
            const isFrameValid = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
                try {
                    // Check center area (avoid letterboxing bars)
                    const checkW = Math.floor(width * 0.5);
                    const checkH = Math.floor(height * 0.5);
                    const startX = Math.floor((width - checkW) / 2);
                    const startY = Math.floor((height - checkH) / 2);

                    const frameData = ctx.getImageData(startX, startY, checkW, checkH);
                    const data = frameData.data;
                    
                    let totalLuma = 0;
                    let totalAlpha = 0;
                    
                    // Stride = 16 (Check every 4th pixel for speed)
                    for(let i = 0; i < data.length; i += 16) {
                        const r = data[i];
                        const g = data[i+1];
                        const b = data[i+2];
                        const a = data[i+3];
                        
                        // Perceived Luminance
                        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                        
                        totalLuma += luma;
                        totalAlpha += a;
                    }
                    
                    const count = data.length / 16;
                    const avgLuma = totalLuma / count;
                    const avgAlpha = totalAlpha / count;

                    // Thresholds:
                    // Alpha < 10: Transparent frame (loading/empty)
                    // Luma < 10: Almost pure black (compression artifacts allow some noise, raised from 5)
                    if (avgAlpha < 10) return false;
                    if (avgLuma < 10) return false; 
                    
                    return true;
                } catch (e) {
                    // CORS Tainted: Cannot check pixels.
                    // Must assume valid to avoid infinite loop / error.
                    return true;
                }
            };

            const processFrame = async () => {
                try {
                    if (!video.videoWidth || !video.videoHeight) {
                        throw new Error("Dimensions not ready");
                    }

                    // --- STEP 1: FORCE GPU DECODE ---
                    // createImageBitmap forces the browser to fully decode the frame from the video element
                    let bitmap: ImageBitmap | null = null;
                    try {
                        bitmap = await createImageBitmap(video);
                    } catch (err) {
                        // Fallback if bitmap fails (rare but possible on some envs)
                    }
                    
                    const canvas = document.createElement('canvas');
                    // Ensure dimensions are even to avoid some encoder artifacts
                    const scale = targetWidth / video.videoWidth;
                    const w = Math.floor(targetWidth / 2) * 2;
                    const h = Math.floor((video.videoHeight * scale) / 2) * 2;
                    
                    canvas.width = w;
                    canvas.height = h;
                    
                    const ctx = canvas.getContext('2d', { 
                        alpha: false, // Force opaque
                        willReadFrequently: true 
                    });
                    
                    if (!ctx) {
                        bitmap?.close();
                        throw new Error("Context creation failed");
                    }

                    if (bitmap) {
                        // Draw the bitmap (high performance)
                        ctx.drawImage(bitmap, 0, 0, w, h);
                        bitmap.close();
                    } else {
                        // Fallback
                        ctx.drawImage(video, 0, 0, w, h);
                    }

                    // --- STEP 2: VALIDITY CHECK ---
                    if (isScanningForCover) {
                        const isValid = isFrameValid(ctx, w, h);
                        
                        if (!isValid) {
                            // Frame is black. Can we retry?
                            currentSeekIndex++;
                            
                            // Calculate next time
                            let nextTime = 0;
                            
                            if (currentSeekIndex < seekOffsets.length) {
                                // Use predefined short hops
                                nextTime = targetTime + seekOffsets[currentSeekIndex];
                            } else if (currentSeekIndex === seekOffsets.length) {
                                // Last ditch effort: Try 10% into the video
                                nextTime = video.duration * 0.1;
                            } else {
                                // Give up, return the black frame (better than nothing)
                                canvas.toBlob(b => finish(b), 'image/jpeg', quality);
                                return;
                            }

                            // Sanity check: Don't seek past end
                            if (nextTime >= video.duration) {
                                // If we are at end and still black, just return it
                                canvas.toBlob(b => finish(b), 'image/jpeg', quality);
                                return;
                            }

                            // console.log(`[Thumbnail] Frame at ${video.currentTime}s is black. Re-seeking to ${nextTime}s`);
                            performSeek(nextTime);
                            return;
                        }
                    }

                    // Valid frame found!
                    canvas.toBlob(b => finish(b), 'image/jpeg', quality);

                } catch (e) {
                    console.warn('[Thumbnail] Processing error', e);
                    finish(null);
                }
            };

            const performSeek = (t: number) => {
                video.currentTime = t;
            };

            const onSeeked = () => {
                // Robustness Fix: Use Double RAF instead of rVFC for static element extraction.
                // rVFC can sometimes hang on paused videos in background tabs or specific drivers
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        processFrame();
                    });
                });
            };

            video.onseeked = onSeeked;
            
            video.onerror = () => {
                console.error('[Thumbnail] Video error', video.error);
                finish(null);
            };

            // Kickoff
            video.onloadedmetadata = () => {
                // Determine initial seek target
                let t = targetTime;
                
                // If asking for absolute 0, nudge it to 0.1s immediately
                // Most compressed videos have empty/black data at absolute 0 timestamp due to container headers
                if (isScanningForCover && t < 0.1) {
                     t = 0.1; 
                }
                
                performSeek(t);
            };

            video.src = videoUrl;
        });
    }
};
