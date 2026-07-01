import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';

type TextToSpeechRequest = Parameters<MagicStudioServerClient['createAudioTextToSpeechTask']>[0];
type TextToSpeechResponse = Awaited<ReturnType<MagicStudioServerClient['createAudioTextToSpeechTask']>>;
type AudioTranscriptionRequest = Parameters<MagicStudioServerClient['createAudioTranscriptionTask']>[0];
type AudioTranscriptionResponse = Awaited<ReturnType<MagicStudioServerClient['createAudioTranscriptionTask']>>;
type AudioTranslationRequest = Parameters<MagicStudioServerClient['createAudioTranslationTask']>[0];
type AudioTranslationResponse = Awaited<ReturnType<MagicStudioServerClient['createAudioTranslationTask']>>;
type ReadAudioTaskRequest = Parameters<MagicStudioServerClient['readAudioGenerationTask']>[0];
type ReadAudioTaskResponse = Awaited<ReturnType<MagicStudioServerClient['readAudioGenerationTask']>>;

const validAudioGenerationRequest = {
  mode: 'text-to-speech',
  prompt: 'narrate a calm ocean sunset',
  negativePrompt: 'static, clipping',
  model: 'gemini-tts',
  seed: 42,
  voice: 'Kore',
  duration: 8,
  format: 'wav',
} satisfies TextToSpeechRequest;

const validAudioTranscriptionRequest = {
  mode: 'transcription',
  model: 'whisper-1',
  language: 'en',
  format: 'text',
  sourceAudio: {
    id: 'source-audio-1',
    uuid: 'source-audio-1',
    assetId: 'source-audio-1',
    type: 'audio',
    role: 'input',
    url: 'https://example.com/source-audio.wav',
    name: 'source-audio.wav',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
} satisfies AudioTranscriptionRequest;

const validAudioTranslationRequest = {
  ...validAudioTranscriptionRequest,
  mode: 'translation',
  sourceLanguage: 'en',
  targetLanguage: 'zh-CN',
} satisfies AudioTranslationRequest;

const validAudioGenerationResponse = {
  requestId: 'req-audio-create-1',
  timestamp: new Date().toISOString(),
  data: {
    id: 'audio-task-1',
    uuid: 'audio-task-1',
    taskId: 'audio-task-1',
    product: 'audio',
    mode: 'text-to-speech',
    status: 'succeeded',
    prompt: 'narrate a calm ocean sunset',
    provider: 'sdkwork-ai-api',
    providerModel: 'gemini-tts',
    progress: 100,
    inputRefs: [],
    artifacts: [
      {
        id: 'audio-artifact-1',
        uuid: 'audio-artifact-1',
        type: 'audio',
        role: 'primary',
        url: 'https://example.com/generated-audio.wav',
        mimeType: 'audio/wav',
        name: 'generated-audio.wav',
        duration: 8,
      },
    ],
    primaryArtifact: {
      id: 'audio-artifact-1',
      uuid: 'audio-artifact-1',
      type: 'audio',
      role: 'primary',
      url: 'https://example.com/generated-audio.wav',
      mimeType: 'audio/wav',
      name: 'generated-audio.wav',
      duration: 8,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  meta: {
    version: 'v1',
  },
} satisfies TextToSpeechResponse;

const validAudioTranscriptionResponse = {
  requestId: 'req-audio-transcription-create-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validAudioGenerationResponse.data,
    taskId: 'audio-transcription-task-1',
    mode: 'speech-to-text',
    providerModel: 'whisper-1',
    artifacts: [
      {
        id: 'audio-text-artifact-1',
        uuid: 'audio-text-artifact-1',
        type: 'text',
        role: 'primary',
        url: 'data:text/plain;charset=utf-8,Hello%20world',
        mimeType: 'text/plain',
        name: 'audio-transcription.txt',
        metadata: {
          text: 'Hello world',
          transcript: 'Hello world',
          language: 'en',
        },
      },
    ],
    primaryArtifact: {
      id: 'audio-text-artifact-1',
      uuid: 'audio-text-artifact-1',
      type: 'text',
      role: 'primary',
      url: 'data:text/plain;charset=utf-8,Hello%20world',
      mimeType: 'text/plain',
      name: 'audio-transcription.txt',
      metadata: {
        text: 'Hello world',
        transcript: 'Hello world',
        language: 'en',
      },
    },
  },
  meta: {
    version: 'v1',
  },
} satisfies AudioTranscriptionResponse;

const validAudioTranslationResponse = {
  requestId: 'req-audio-translation-create-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validAudioTranscriptionResponse.data,
    taskId: 'audio-translation-task-1',
    providerPayload: {
      task: 'translate',
      text: 'Hello world',
      language: 'zh-CN',
    },
  },
  meta: {
    version: 'v1',
  },
} satisfies AudioTranslationResponse;

const validAudioStatusTaskId: ReadAudioTaskRequest = 'audio-task-1';

const validAudioStatusResponse = {
  requestId: 'req-audio-status-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validAudioGenerationResponse.data,
    taskId: validAudioStatusTaskId,
    status: 'processing',
    progress: 65,
    artifacts: [],
    primaryArtifact: null,
  },
  meta: {
    version: 'v1',
  },
} satisfies ReadAudioTaskResponse;

void validAudioGenerationRequest;
void validAudioTranscriptionRequest;
void validAudioTranslationRequest;
void validAudioGenerationResponse;
void validAudioTranscriptionResponse;
void validAudioTranslationResponse;
void validAudioStatusTaskId;
void validAudioStatusResponse;
