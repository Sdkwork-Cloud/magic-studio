import type {
  MagicStudioApiEnvelope,
  MagicStudioCustomVoiceCreateRequest,
  MagicStudioCustomVoiceUpdateRequest,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
  MagicStudioVoiceCloneTask,
  MagicStudioVoiceCloneTaskCreateRequest,
  MagicStudioVoicePreviewRequest,
  MagicStudioVoiceSpeaker,
  MagicStudioVoiceSpeechTaskCreateRequest,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeCreateCustomVoiceRequest =
  Parameters<MagicStudioServerClient['createCustomVoice']>[0];
type RuntimeCreateCustomVoiceEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createCustomVoice']>
>;
type RuntimeUpdateCustomVoiceRequest =
  Parameters<MagicStudioServerClient['updateCustomVoice']>[1];
type RuntimeUpdateCustomVoiceEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateCustomVoice']>
>;
type RuntimeDeleteCustomVoiceEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deleteCustomVoice']>
>;
type RuntimeCreateCloneRequest =
  Parameters<MagicStudioServerClient['createVoiceCloneTask']>[0];
type RuntimeCreateCloneEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createVoiceCloneTask']>
>;
type RuntimePreviewRequest =
  Parameters<MagicStudioServerClient['updateVoicePreview']>[1];
type RuntimeCreateSpeechRequest =
  Parameters<MagicStudioServerClient['createVoiceSpeechTask']>[0];

const runtimeCreateCustomVoiceRequestMatchesServerType: AssertAssignable<
  RuntimeCreateCustomVoiceRequest,
  MagicStudioCustomVoiceCreateRequest
> = true;
const serverCreateCustomVoiceRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioCustomVoiceCreateRequest,
  RuntimeCreateCustomVoiceRequest
> = true;
const runtimeCreateCustomVoiceEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateCustomVoiceEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>
> = true;
const runtimeUpdateCustomVoiceRequestMatchesServerType: AssertAssignable<
  RuntimeUpdateCustomVoiceRequest,
  MagicStudioCustomVoiceUpdateRequest
> = true;
const runtimeUpdateCustomVoiceEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUpdateCustomVoiceEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>
> = true;
const runtimeDeleteCustomVoiceEnvelopeMatchesServerType: AssertAssignable<
  RuntimeDeleteCustomVoiceEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeCreateCloneRequestMatchesServerType: AssertAssignable<
  RuntimeCreateCloneRequest,
  MagicStudioVoiceCloneTaskCreateRequest
> = true;
const runtimeCreateCloneEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateCloneEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>
> = true;
const runtimePreviewRequestMatchesServerType: AssertAssignable<
  RuntimePreviewRequest,
  MagicStudioVoicePreviewRequest
> = true;
const runtimeCreateSpeechRequestMatchesServerType: AssertAssignable<
  RuntimeCreateSpeechRequest,
  MagicStudioVoiceSpeechTaskCreateRequest
> = true;

const validCustomVoiceCreateRequest = {
  name: 'Kore Custom',
  gender: 'female',
  style: 'narration',
  language: 'en-US',
  provider: 'magic-studio-voice-lab',
  providerVoiceId: null,
  previewUrl: 'https://cdn.example.com/kore.wav',
  previewText: 'Hello from the clone preview',
  avatarUrl: 'https://cdn.example.com/kore.png',
  description: 'Warm narrator voice',
  tags: ['warm', 'narration'],
  referenceAudio: null,
  config: {
    speed: 1,
    pitch: 1,
    stability: 0.8,
    similarityBoost: 0.7,
  },
  isFavorite: true,
  metadata: {
    source: 'voice-lab',
  },
} satisfies RuntimeCreateCustomVoiceRequest;

const validCustomVoiceUpdateRequest = {
  previewText: 'Updated preview',
  isFavorite: false,
} satisfies RuntimeUpdateCustomVoiceRequest;

const validCloneRequest = {
  speakerId: 'speaker-kore',
  sampleAudioUrl: 'https://cdn.example.com/reference.wav',
  language: 'en-US',
  model: 'gemini-tts',
} satisfies RuntimeCreateCloneRequest;

const validPreviewRequest = {
  previewText: 'Updated preview',
  previewAudioUrl: 'https://cdn.example.com/updated-preview.wav',
} satisfies RuntimePreviewRequest;

const validSpeechRequest = {
  speakerId: 'speaker-kore',
  text: 'Narrate this opening line with a warm tone',
  model: 'gemini-tts',
  language: 'en-US',
  format: 'wav',
} satisfies RuntimeCreateSpeechRequest;

void runtimeCreateCustomVoiceRequestMatchesServerType;
void serverCreateCustomVoiceRequestMatchesRuntimeType;
void runtimeCreateCustomVoiceEnvelopeMatchesServerType;
void runtimeUpdateCustomVoiceRequestMatchesServerType;
void runtimeUpdateCustomVoiceEnvelopeMatchesServerType;
void runtimeDeleteCustomVoiceEnvelopeMatchesServerType;
void runtimeCreateCloneRequestMatchesServerType;
void runtimeCreateCloneEnvelopeMatchesServerType;
void runtimePreviewRequestMatchesServerType;
void runtimeCreateSpeechRequestMatchesServerType;
void validCustomVoiceCreateRequest;
void validCustomVoiceUpdateRequest;
void validCloneRequest;
void validPreviewRequest;
void validSpeechRequest;
