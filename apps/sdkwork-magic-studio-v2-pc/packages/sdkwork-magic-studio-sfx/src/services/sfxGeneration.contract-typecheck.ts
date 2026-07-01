import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioSfxGenerationRequest,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeCreateSfxRequest =
  Parameters<MagicStudioServerClient['createSfxGenerationTask']>[0];
type RuntimeCreateSfxEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createSfxGenerationTask']>
>;
type RuntimeReadSfxEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readSfxGenerationTask']>
>;

const runtimeCreateSfxRequestMatchesServerType: AssertAssignable<
  RuntimeCreateSfxRequest,
  MagicStudioSfxGenerationRequest
> = true;
const serverCreateSfxRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioSfxGenerationRequest,
  RuntimeCreateSfxRequest
> = true;
const runtimeCreateSfxEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateSfxEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeReadSfxEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadSfxEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;

const validSfxGenerationRequest = {
  prompt: 'short cinematic whoosh',
  model: 'audioldm-2',
  duration: 3,
  mediaType: 'sfx',
} satisfies RuntimeCreateSfxRequest;

const validSfxArtifact = {
  id: 'sfx-artifact-1',
  uuid: 'sfx-artifact-uuid-1',
  type: 'audio',
  role: 'primary',
  assetId: 'sfx-asset-db-1',
  assetUuid: 'sfx-asset-uuid-1',
  primaryResourceId: 'sfx-primary-resource-db-1',
  primaryResourceUuid: 'sfx-primary-resource-uuid-1',
  resourceViewId: 'sfx-resource-view-db-1',
  resourceViewUuid: 'sfx-resource-view-uuid-1',
  url: 'https://example.com/generated-sfx.mp3',
  mimeType: 'audio/mpeg',
  name: 'generated-sfx.mp3',
  duration: 3,
  metadata: {
    canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/generated-sfx.mp3',
    duration: 3,
  },
} satisfies MagicStudioGenerationArtifact;

const validSfxGenerationTask = {
  id: 'sfx-task-db-1',
  uuid: 'sfx-task-uuid-1',
  taskId: 'sfx-task-1',
  product: 'sfx',
  mode: 'text-to-audio',
  status: 'succeeded',
  prompt: validSfxGenerationRequest.prompt,
  provider: 'magic-studio-server',
  providerModel: validSfxGenerationRequest.model,
  remoteJobId: 'sfx-remote-job-1',
  progress: 100,
  inputRefs: [],
  artifacts: [validSfxArtifact],
  primaryArtifact: validSfxArtifact,
  parameters: {
    duration: validSfxGenerationRequest.duration,
    mediaType: validSfxGenerationRequest.mediaType,
  },
  providerPayload: {
    duration: validSfxGenerationRequest.duration,
    mediaType: validSfxGenerationRequest.mediaType,
  },
  createdAt: '2026-04-05T08:00:00Z',
  updatedAt: '2026-04-05T08:00:10Z',
  completedAt: '2026-04-05T08:00:10Z',
  cancelledAt: null,
} satisfies MagicStudioGenerationTask;

const validSfxGenerationResponse = {
  requestId: 'request-sfx-create',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validSfxGenerationTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCreateSfxEnvelope;

const validSfxStatusResponse = {
  requestId: 'request-sfx-read',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validSfxGenerationTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeReadSfxEnvelope;

void runtimeCreateSfxRequestMatchesServerType;
void serverCreateSfxRequestMatchesRuntimeType;
void runtimeCreateSfxEnvelopeMatchesServerType;
void runtimeReadSfxEnvelopeMatchesServerType;
void validSfxGenerationResponse;
void validSfxStatusResponse;
