import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
  MagicStudioVoiceCloneTask,
  MagicStudioVoiceCloneTaskCreateRequest,
  MagicStudioVoiceCloneTaskListQuery,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeCreateCloneRequest =
  Parameters<MagicStudioServerClient['createVoiceCloneTask']>[0];
type RuntimeCreateCloneEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createVoiceCloneTask']>
>;
type RuntimeCloneTaskListQuery = NonNullable<
  Parameters<MagicStudioServerClient['listVoiceCloneTasks']>[0]
>;
type RuntimeCloneTaskList = Awaited<
  ReturnType<MagicStudioServerClient['listVoiceCloneTasks']>
>;
type RuntimeReadCloneEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readVoiceCloneTask']>
>;
type RuntimeCancelCloneEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['cancelVoiceCloneTask']>
>;
type RuntimeDeleteCloneEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deleteVoiceCloneTask']>
>;

const runtimeCreateCloneRequestMatchesServerType: AssertAssignable<
  RuntimeCreateCloneRequest,
  MagicStudioVoiceCloneTaskCreateRequest
> = true;
const serverCreateCloneRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioVoiceCloneTaskCreateRequest,
  RuntimeCreateCloneRequest
> = true;
const runtimeCreateCloneEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateCloneEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>
> = true;
const runtimeCloneTaskListQueryMatchesServerType: AssertAssignable<
  RuntimeCloneTaskListQuery,
  MagicStudioVoiceCloneTaskListQuery
> = true;
const runtimeCloneTaskListMatchesServerType: AssertAssignable<
  RuntimeCloneTaskList,
  MagicStudioApiListEnvelope<MagicStudioVoiceCloneTask>
> = true;
const runtimeReadCloneEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadCloneEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>
> = true;
const runtimeCancelCloneEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCancelCloneEnvelope,
  MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>
> = true;
const runtimeDeleteCloneEnvelopeMatchesServerType: AssertAssignable<
  RuntimeDeleteCloneEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;

const validCloneRequest = {
  speakerId: 'speaker-kore',
  sampleAudioUrl: 'https://example.com/reference.wav',
  language: 'zh-CN',
  model: 'gemini-tts',
  idempotencyKey: 'voice-speaker-clone:speaker-kore',
  previewText: 'Preview this cloned voice',
  autoUpdatePreview: true,
} satisfies RuntimeCreateCloneRequest;

const validCloneTask = {
  id: 'clone-task-db-1',
  uuid: 'clone-task-uuid-1',
  taskId: 'voice-clone-task-1',
  speakerId: validCloneRequest.speakerId,
  speakerName: 'Kore',
  status: 'queued',
  language: validCloneRequest.language,
  model: validCloneRequest.model,
  provider: 'magic-studio',
  remoteJobId: null,
  progress: 0,
  idempotencyKey: validCloneRequest.idempotencyKey,
  sampleAudio: null,
  sampleAudioUrl: validCloneRequest.sampleAudioUrl,
  previewText: validCloneRequest.previewText,
  previewAudioUrl: null,
  errorCode: null,
  errorMessage: null,
  providerPayload: null,
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
  completedAt: null,
  cancelledAt: null,
} satisfies MagicStudioVoiceCloneTask;

const validCloneListQuery = {
  page: 1,
  pageSize: 20,
  status: 'queued',
  speakerId: validCloneRequest.speakerId,
} satisfies RuntimeCloneTaskListQuery;

const validCloneTaskResponse = {
  requestId: 'request-voice-clone',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validCloneTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCreateCloneEnvelope;

const validCloneTaskListResponse = {
  requestId: 'request-voice-clone-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validCloneTask],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeCloneTaskList;

const validCloneDeleteResponse = {
  requestId: 'request-voice-clone-delete',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeDeleteCloneEnvelope;

void runtimeCreateCloneRequestMatchesServerType;
void serverCreateCloneRequestMatchesRuntimeType;
void runtimeCreateCloneEnvelopeMatchesServerType;
void runtimeCloneTaskListQueryMatchesServerType;
void runtimeCloneTaskListMatchesServerType;
void runtimeReadCloneEnvelopeMatchesServerType;
void runtimeCancelCloneEnvelopeMatchesServerType;
void runtimeDeleteCloneEnvelopeMatchesServerType;
void validCloneListQuery;
void validCloneTaskResponse;
void validCloneTaskListResponse;
void validCloneDeleteResponse;
