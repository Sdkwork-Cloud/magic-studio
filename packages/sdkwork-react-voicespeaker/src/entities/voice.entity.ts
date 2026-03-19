import { BaseEntity } from '@sdkwork/react-commons';

// ============================================================================
// Voice Speaker - shared voice persona definitions
// ============================================================================

export type VoiceGender = 'male' | 'female' | 'neutral';
export type VoiceStyle = 'neutral' | 'expressive' | 'news' | 'story' | 'whisper';
export type VoiceProvider = 'gemini-tts' | 'eleven-labs-v2' | 'openai-tts-1' | 'azure-tts' | 'custom';
export type VoiceGenerationMode = 'design' | 'clone';
export type VoiceReferenceInputMethod = 'upload' | 'mic';

export interface VoiceSpeaker extends BaseEntity {
  type: 'VOICE_SPEAKER';
  name: string;
  gender: VoiceGender;
  style: VoiceStyle;
  language: string;
  provider: VoiceProvider;
  providerVoiceId?: string;
  previewUrl?: string;
  avatarUrl?: string;
  description?: string;
  tags: string[];
  isFavorite?: boolean;
  config?: {
    speed?: number;
    pitch?: number;
    stability?: number;
    similarityBoost?: number;
  };
}

// ============================================================================
// Voice Task - voice generation job definitions
// ============================================================================

export interface VoiceTask extends BaseEntity {
  type: 'VOICE_TASK';
  speakerId: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  config?: VoiceConfig;
  result?: {
    url: string;
    duration: number;
  };
  results?: GeneratedVoiceResult[];
  isFavorite?: boolean;
  error?: string;
}

// ============================================================================
// Legacy types kept for backward compatibility
// ============================================================================

export type VoiceModelType = VoiceProvider;

export interface VoiceProfile {
  id: string;
  name: string;
  gender: VoiceGender;
  style: VoiceStyle;
  language: string;
  previewUrl?: string;
}

export interface VoiceConfig {
  text: string;
  voiceId: string;
  name?: string;
  avatarUrl?: string;
  previewText?: string;
  mode?: VoiceGenerationMode;
  inputMethod?: VoiceReferenceInputMethod;
  model: VoiceModelType;
  speed: number;
  pitch: number;
  stability?: number;
  similarityBoost?: number;
  referenceAudio?: string;
  description?: string;
  mediaType: 'voice';
}

export interface GeneratedVoiceResult {
  id: string;
  url: string;
  duration: number;
  text: string;
  speakerName: string;
  avatarUrl?: string;
}
