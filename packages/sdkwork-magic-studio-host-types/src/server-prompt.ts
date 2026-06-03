export type MagicStudioPromptOptimizationType = 'image' | 'video';

export type MagicStudioPromptOptimizationMode =
  | 'text-to-prompt'
  | 'image-to-prompt'
  | 'video-to-prompt';

export interface MagicStudioPromptOptimizeRequest {
  prompt: string;
  scene?: string;
  type?: MagicStudioPromptOptimizationType;
  mode?: MagicStudioPromptOptimizationMode;
  targetStyle?: string;
  additionalInstructions?: string;
  inputImageName?: string;
  inputImageUrl?: string;
  inputVideoName?: string;
  inputVideoUrl?: string;
  language?: string;
  maxWords?: number;
}

export interface MagicStudioPromptOptimizeResult {
  originalInput: string;
  optimizedPrompt: string;
  suggestions: string[];
  keywords: string[];
}
