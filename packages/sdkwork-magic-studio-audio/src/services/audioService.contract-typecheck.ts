import type {
  MagicStudioApiEnvelope,
  MagicStudioAudioGenerationRequest,
  MagicStudioGenerationTask,
} from '@sdkwork/magic-studio-host-types';

const validAudioGenerationRequest = {
  mode: 'text-to-speech',
  prompt: 'narrate a calm ocean sunset',
  negativePrompt: 'static, clipping',
  model: 'gemini-tts',
  seed: 42,
  voice: 'Kore',
  duration: 8,
  format: 'wav',
} satisfies MagicStudioAudioGenerationRequest;

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
} satisfies MagicStudioAudioGenerationRequest;

const validAudioTranslationRequest = {
  ...validAudioTranscriptionRequest,
  mode: 'translation',
  sourceLanguage: 'en',
  targetLanguage: 'ja',
} satisfies MagicStudioAudioGenerationRequest;

const validAudioTask = {
  id: 'audio-task-1',
  uuid: 'audio-task-1',
  taskId: 'audio-task-1',
  product: 'audio',
  mode: 'text-to-speech',
  status: 'succeeded',
  prompt: 'narrate a calm ocean sunset',
  provider: 'sdkwork-ai-api',
  providerModel: 'gemini-tts',
  remoteJobId: 'remote-audio-task-1',
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
      metadata: {
        voice: 'Kore',
      },
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
    metadata: {
      voice: 'Kore',
    },
  },
  parameters: {
    voice: 'Kore',
    duration: 8,
  },
  providerPayload: {
    voice: 'Kore',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
} satisfies MagicStudioGenerationTask;

const validAudioTaskEnvelope = {
  requestId: 'req-audio-task-1',
  timestamp: new Date().toISOString(),
  data: validAudioTask,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validTranscriptionTask = {
  ...validAudioTask,
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
  providerPayload: {
    task: 'transcribe',
    text: 'Hello world',
    language: 'en',
    sourceAudioUrl: 'https://example.com/source-audio.wav',
  },
} satisfies MagicStudioGenerationTask;

const validTranscriptionTaskEnvelope = {
  requestId: 'req-audio-transcription-task-1',
  timestamp: new Date().toISOString(),
  data: validTranscriptionTask,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

void validAudioGenerationRequest;
void validAudioTranscriptionRequest;
void validAudioTranslationRequest;
void validAudioTask;
void validAudioTaskEnvelope;
void validTranscriptionTask;
void validTranscriptionTaskEnvelope;
