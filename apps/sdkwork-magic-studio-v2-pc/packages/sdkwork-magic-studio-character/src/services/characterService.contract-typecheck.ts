import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioCharacterGenerationRequest,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioGenerationTaskListQuery,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeCreateCharacterRequest =
  Parameters<MagicStudioServerClient['createCharacterGenerationTask']>[0];
type RuntimeCreateCharacterEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createCharacterGenerationTask']>
>;
type RuntimeReadCharacterEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readCharacterGenerationTask']>
>;
type RuntimeListGenerationQuery = NonNullable<
  Parameters<MagicStudioServerClient['listGenerationTasks']>[0]
>;
type RuntimeListGenerationEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['listGenerationTasks']>
>;
type RuntimeCancelGenerationEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['cancelGenerationTask']>
>;

const runtimeCreateCharacterRequestMatchesServerType: AssertAssignable<
  RuntimeCreateCharacterRequest,
  MagicStudioCharacterGenerationRequest
> = true;
const serverCreateCharacterRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioCharacterGenerationRequest,
  RuntimeCreateCharacterRequest
> = true;
const runtimeCreateCharacterEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateCharacterEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeReadCharacterEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadCharacterEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeListGenerationQueryMatchesServerType: AssertAssignable<
  RuntimeListGenerationQuery,
  MagicStudioGenerationTaskListQuery
> = true;
const runtimeListGenerationEnvelopeMatchesServerType: AssertAssignable<
  RuntimeListGenerationEnvelope,
  MagicStudioApiListEnvelope<MagicStudioGenerationTask>
> = true;
const runtimeCancelGenerationEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCancelGenerationEnvelope,
  MagicStudioApiEnvelope<MagicStudioGenerationTask>
> = true;

const validCharacterCreateRequest = {
  prompt: 'A cyberpunk scout',
  description: 'A cyberpunk scout',
  model: 'gemini-2.5-flash-image',
  archetype: 'cyberpunk',
  gender: 'female',
  age: 22,
  outfit: 'jacket',
  aspectRatio: '9:16',
  voiceId: 'Puck',
  avatarMode: 'full-body',
  avatar: {
    id: null,
    uuid: 'avatar-input-uuid-1',
    createdAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-05T08:00:00Z',
    assetId: 'asset-1',
    assetUuid: 'asset-uuid-1',
    primaryResourceId: null,
    primaryResourceUuid: null,
    resourceViewId: null,
    resourceViewUuid: null,
    path: 'assets://workspace/character/reference.png',
    type: 'image',
    role: 'character-reference',
    resource: null,
    metadata: {
      assetId: 'asset-1',
      assetUuid: 'asset-uuid-1',
      path: 'assets://workspace/character/reference.png',
    },
  },
} satisfies RuntimeCreateCharacterRequest;

const validCharacterArtifact = {
  id: 'artifact-1',
  uuid: 'artifact-uuid-1',
  type: 'image',
  role: 'primary',
  assetId: 'character-asset-db-1',
  assetUuid: 'character-asset-uuid-1',
  primaryResourceId: 'character-primary-resource-db-1',
  primaryResourceUuid: 'character-primary-resource-uuid-1',
  resourceViewId: 'character-resource-view-db-1',
  resourceViewUuid: 'character-resource-view-uuid-1',
  url: 'https://example.com/character-1.png',
  mimeType: 'image/png',
  name: 'character-1.png',
  metadata: {
    canonicalPath: 'assets://workspaces/ws-1/projects/proj-1/media/character-1.png',
  },
} satisfies MagicStudioGenerationArtifact;

const validCharacterTask = {
  id: 'task-db-1',
  uuid: 'task-uuid-1',
  taskId: 'character-task-1',
  product: 'character',
  mode: 'text-to-character',
  status: 'succeeded',
  prompt: validCharacterCreateRequest.prompt,
  provider: 'magic-studio',
  providerModel: 'gemini-2.5-flash-image',
  remoteJobId: 'remote-character-job-1',
  progress: 100,
  inputRefs: [],
  artifacts: [validCharacterArtifact],
  primaryArtifact: validCharacterArtifact,
  parameters: {
    description: validCharacterCreateRequest.description,
    archetype: validCharacterCreateRequest.archetype,
    gender: validCharacterCreateRequest.gender,
    age: validCharacterCreateRequest.age,
    outfit: validCharacterCreateRequest.outfit,
    aspectRatio: validCharacterCreateRequest.aspectRatio,
    voiceId: validCharacterCreateRequest.voiceId,
    avatarMode: validCharacterCreateRequest.avatarMode,
  },
  providerPayload: {},
  createdAt: '2026-04-05T08:00:00Z',
  updatedAt: '2026-04-05T08:00:10Z',
  completedAt: '2026-04-05T08:00:10Z',
  cancelledAt: null,
} satisfies MagicStudioGenerationTask;

const validCharacterTaskEnvelope = {
  requestId: 'request-character-task',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validCharacterTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCreateCharacterEnvelope;

const validCharacterTaskListQuery = {
  product: 'character',
  page: 1,
  pageSize: 50,
} satisfies RuntimeListGenerationQuery;

const validCharacterTaskListEnvelope = {
  requestId: 'request-character-task-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validCharacterTask],
  meta: {
    page: 1,
    pageSize: 50,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeListGenerationEnvelope;

const validCharacterTaskCancelEnvelope = {
  requestId: 'request-character-task-cancel',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: {
    ...validCharacterTask,
    status: 'cancelled',
    cancelledAt: '2026-04-25T00:00:00.000Z',
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCancelGenerationEnvelope;

void runtimeCreateCharacterRequestMatchesServerType;
void serverCreateCharacterRequestMatchesRuntimeType;
void runtimeCreateCharacterEnvelopeMatchesServerType;
void runtimeReadCharacterEnvelopeMatchesServerType;
void runtimeListGenerationQueryMatchesServerType;
void runtimeListGenerationEnvelopeMatchesServerType;
void runtimeCancelGenerationEnvelopeMatchesServerType;
void validCharacterTaskEnvelope;
void validCharacterTaskListQuery;
void validCharacterTaskListEnvelope;
void validCharacterTaskCancelEnvelope;
