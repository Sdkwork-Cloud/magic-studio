import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioGenerationTask,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
  MagicStudioVoiceSpeechTaskCreateRequest,
  MagicStudioVoiceSpeechTaskListQuery,
  MagicStudioVoiceSpeechTaskUpdateRequest,
  MagicStudioVoiceSpeechTaskUpsertRequest,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeCreateSpeechRequest =
  Parameters<MagicStudioServerClient['createVoiceSpeechTask']>[0];
type RuntimeCreateSpeechEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createVoiceSpeechTask']>
>;
type RuntimeSpeechTaskListQuery = NonNullable<
  Parameters<MagicStudioServerClient['listVoiceSpeechTasks']>[0]
>;
type RuntimeSpeechTaskList = Awaited<
  ReturnType<MagicStudioServerClient['listVoiceSpeechTasks']>
>;
type RuntimeReadSpeechEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readVoiceSpeechTask']>
>;
type RuntimeUpdateSpeechRequest =
  Parameters<MagicStudioServerClient['updateVoiceSpeechTask']>[1];
type RuntimeUpdateSpeechEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateVoiceSpeechTask']>
>;
type RuntimeUpsertSpeechRequest =
  Parameters<MagicStudioServerClient['upsertVoiceSpeechTask']>[1];
type RuntimeUpsertSpeechEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['upsertVoiceSpeechTask']>
>;
type RuntimeCancelSpeechEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['cancelVoiceSpeechTask']>
>;
type RuntimeDeleteSpeechEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deleteVoiceSpeechTask']>
>;

const runtimeCreateSpeechRequestMatchesServerType: AssertAssignable<
  RuntimeCreateSpeechRequest,
  MagicStudioVoiceSpeechTaskCreateRequest
> = true;
const serverCreateSpeechRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioVoiceSpeechTaskCreateRequest,
  RuntimeCreateSpeechRequest
> = true;
const runtimeCreateSpeechEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateSpeechEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeSpeechTaskListQueryMatchesServerType: AssertAssignable<
  RuntimeSpeechTaskListQuery,
  MagicStudioVoiceSpeechTaskListQuery
> = true;
const runtimeSpeechTaskListMatchesServerType: AssertAssignable<
  RuntimeSpeechTaskList,
  MagicStudioApiListEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeReadSpeechEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadSpeechEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeUpdateSpeechRequestMatchesServerType: AssertAssignable<
  RuntimeUpdateSpeechRequest,
  MagicStudioVoiceSpeechTaskUpdateRequest
> = true;
const runtimeUpdateSpeechEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUpdateSpeechEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeUpsertSpeechRequestMatchesServerType: AssertAssignable<
  RuntimeUpsertSpeechRequest,
  MagicStudioVoiceSpeechTaskUpsertRequest
> = true;
const runtimeUpsertSpeechEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUpsertSpeechEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeCancelSpeechEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCancelSpeechEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeDeleteSpeechEnvelopeMatchesServerType: AssertAssignable<
  RuntimeDeleteSpeechEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;

const validSpeechRequest = {
  speakerId: 'speaker-kore',
  text: 'Narrate this opening line with a warm tone',
  model: 'gemini-tts',
  speed: 1,
  pitch: 1,
  stability: 0.8,
  similarityBoost: 0.7,
  format: 'wav',
  language: 'en-US',
  voiceId: 'kore',
  avatarUrl: 'https://cdn.example.com/kore.png',
  description: 'Warm narrator voice',
  mode: 'design',
  inputMethod: 'upload',
  referenceAudio: null,
} satisfies RuntimeCreateSpeechRequest;

const validSpeechArtifact = {
  id: 'artifact-1',
  uuid: 'artifact-uuid-1',
  type: 'voice',
  role: 'primary',
  url: 'https://example.com/generated-voice.wav',
  mimeType: 'audio/wav',
  name: 'generated-voice.wav',
  duration: 9,
} satisfies MagicStudioGenerationTask['artifacts'][number];

const validSpeechTask = {
  id: 'voice-task-db-1',
  uuid: 'voice-task-uuid-1',
  taskId: 'voice-task-1',
  product: 'speech',
  mode: 'text-to-speech',
  status: 'succeeded',
  prompt: validSpeechRequest.text,
  provider: 'magic-studio',
  providerModel: validSpeechRequest.model,
  remoteJobId: 'remote-voice-task-1',
  progress: 100,
  inputRefs: [],
  artifacts: [validSpeechArtifact],
  primaryArtifact: validSpeechArtifact,
  parameters: {
    speakerId: validSpeechRequest.speakerId,
    language: validSpeechRequest.language,
  },
  providerPayload: {},
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:01:00.000Z',
  completedAt: '2026-04-25T00:01:00.000Z',
  cancelledAt: null,
} satisfies MagicStudioGenerationTask;

const validSpeechListQuery = {
  page: 1,
  pageSize: 20,
  status: 'succeeded',
  speakerId: validSpeechRequest.speakerId,
} satisfies RuntimeSpeechTaskListQuery;

const validSpeechUpdateRequest = {
  isFavorite: true,
} satisfies RuntimeUpdateSpeechRequest;

const validSpeechUpsertRequest = {
  text: validSpeechRequest.text,
  speakerId: validSpeechRequest.speakerId,
  speakerName: 'Kore',
  status: 'succeeded',
  provider: 'magic-studio',
  providerModel: validSpeechRequest.model,
  progress: 100,
  language: validSpeechRequest.language,
  format: validSpeechRequest.format,
  voiceId: validSpeechRequest.voiceId,
  avatarUrl: validSpeechRequest.avatarUrl,
  description: validSpeechRequest.description,
  mode: validSpeechRequest.mode,
  inputMethod: validSpeechRequest.inputMethod,
  isFavorite: true,
  artifacts: [validSpeechArtifact],
  primaryArtifact: validSpeechArtifact,
} satisfies RuntimeUpsertSpeechRequest;

const validSpeechTaskResponse = {
  requestId: 'request-voice-speech',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validSpeechTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCreateSpeechEnvelope;

const validSpeechTaskListResponse = {
  requestId: 'request-voice-speech-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validSpeechTask],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeSpeechTaskList;

const validSpeechDeleteResponse = {
  requestId: 'request-voice-speech-delete',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeDeleteSpeechEnvelope;

void runtimeCreateSpeechRequestMatchesServerType;
void serverCreateSpeechRequestMatchesRuntimeType;
void runtimeCreateSpeechEnvelopeMatchesServerType;
void runtimeSpeechTaskListQueryMatchesServerType;
void runtimeSpeechTaskListMatchesServerType;
void runtimeReadSpeechEnvelopeMatchesServerType;
void runtimeUpdateSpeechRequestMatchesServerType;
void runtimeUpdateSpeechEnvelopeMatchesServerType;
void runtimeUpsertSpeechRequestMatchesServerType;
void runtimeUpsertSpeechEnvelopeMatchesServerType;
void runtimeCancelSpeechEnvelopeMatchesServerType;
void runtimeDeleteSpeechEnvelopeMatchesServerType;
void validSpeechListQuery;
void validSpeechUpdateRequest;
void validSpeechUpsertRequest;
void validSpeechTaskResponse;
void validSpeechTaskListResponse;
void validSpeechDeleteResponse;
