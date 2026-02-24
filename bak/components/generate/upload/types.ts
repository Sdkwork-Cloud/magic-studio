
export interface ImportData {
    id: string;
    fileUrl: string; // Base64 or Blob URL
    type: 'image' | 'video' | 'music';
    createdAt: number;
    
    // Common Metadata
    prompt: string;
    model: string;
    coverUrl?: string; // Added for Video/Music covers

    // Image Specific
    aspectRatio?: string;
    negativePrompt?: string;
    style?: string;

    // Video Specific
    duration?: number; // seconds
    resolution?: string;
    fps?: number;

    // Music Specific
    title?: string;
    lyrics?: string;
    isInstrumental?: boolean;
}
