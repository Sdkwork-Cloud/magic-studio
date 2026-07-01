import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioServerClient,
  MagicStudioVideoGenerationRequest,
} from '@sdkwork/magic-studio-server';

type LipSyncVideoRequest = Parameters<MagicStudioServerClient['createVideoLipSyncTask']>[0];
type LipSyncVideoResponse = Awaited<ReturnType<MagicStudioServerClient['createVideoLipSyncTask']>>;
type ReadLipSyncTaskRequest = Parameters<MagicStudioServerClient['readVideoGenerationTask']>[0];
type ReadLipSyncTaskResponse = Awaited<ReturnType<MagicStudioServerClient['readVideoGenerationTask']>>;
type CancelLipSyncTaskRequest = Parameters<MagicStudioServerClient['cancelVideoGenerationTask']>[0];
type CancelLipSyncTaskResponse =
  Awaited<ReturnType<MagicStudioServerClient['cancelVideoGenerationTask']>>;

const validEnvelopeBase = {
  requestId: 'req-video-lipsync-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validVideoLipSyncRequest = {
  generationType: 'lip-sync',
  assets: [
    {
      role: 'source_video',
      type: 'video',
      value: 'https://example.com/source.mp4',
    },
    {
      role: 'driver_audio',
      type: 'audio',
      value: 'https://example.com/driver.wav',
    },
  ],
  prompt: '',
  negativePrompt: '',
  duration: '5s',
  resolution: '720p',
  aspectRatio: '16:9',
  model: 'mock-lipsync-model',
  videoStyle: {
    id: 'dialogue',
    prompt: 'natural interview lighting',
  },
  options: {
    lipSyncSourceType: 'video',
    lipSyncDriverType: 'audio',
  },
} satisfies LipSyncVideoRequest;

const validVideoLipSyncArtifact = {
  id: 'artifact-lipsync-1',
  uuid: 'artifact-lipsync-uuid-1',
  type: 'video',
  role: 'primary',
  url: 'https://example.com/lipsync-video.mp4',
  mimeType: 'video/mp4',
  name: 'lipsync-video.mp4',
  width: 1280,
  height: 720,
  duration: 5,
} satisfies MagicStudioGenerationArtifact;

const validVideoLipSyncTask = {
  id: 'task-lipsync-1',
  uuid: 'task-lipsync-uuid-1',
  taskId: 'lip-task-1',
  product: 'video',
  mode: 'lip-sync',
  status: 'queued',
  prompt: '',
  negativePrompt: '',
  provider: 'runtime-video',
  providerModel: 'mock-lipsync-model',
  remoteJobId: 'lip-task-1',
  progress: 10,
  inputRefs: [],
  artifacts: [],
  primaryArtifact: null,
  parameters: {
    duration: '5s',
    resolution: '720p',
    aspectRatio: '16:9',
    lipSyncSourceType: 'video',
    lipSyncDriverType: 'audio',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.500Z',
  completedAt: null,
} satisfies MagicStudioGenerationTask;

const validVideoLipSyncResponse = {
  ...validEnvelopeBase,
  data: validVideoLipSyncTask,
} satisfies LipSyncVideoResponse;

const validReadLipSyncTaskId: ReadLipSyncTaskRequest = 'lip-task-1';

const validReadLipSyncResponse = {
  ...validEnvelopeBase,
  data: {
    ...validVideoLipSyncTask,
    taskId: validReadLipSyncTaskId,
    status: 'succeeded',
    progress: 100,
    artifacts: [validVideoLipSyncArtifact],
    primaryArtifact: validVideoLipSyncArtifact,
    completedAt: '2026-04-25T00:00:01.000Z',
  },
} satisfies ReadLipSyncTaskResponse;

const validCancelLipSyncTaskId: CancelLipSyncTaskRequest = 'lip-task-1';

const validCancelLipSyncResponse = {
  ...validEnvelopeBase,
  data: {
    ...validVideoLipSyncTask,
    taskId: validCancelLipSyncTaskId,
    status: 'cancelled',
    progress: 30,
    errorCode: 'LIPSYNC_CANCELED',
    errorMessage: 'Lip Sync task canceled by user.',
    cancelledAt: '2026-04-25T00:00:02.000Z',
  },
} satisfies CancelLipSyncTaskResponse;

const validExplicitEnvelope = {
  ...validEnvelopeBase,
  data: validVideoLipSyncTask,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validServerRequest = validVideoLipSyncRequest satisfies MagicStudioVideoGenerationRequest;

void validVideoLipSyncRequest;
void validVideoLipSyncArtifact;
void validVideoLipSyncTask;
void validVideoLipSyncResponse;
void validReadLipSyncTaskId;
void validReadLipSyncResponse;
void validCancelLipSyncTaskId;
void validCancelLipSyncResponse;
void validExplicitEnvelope;
void validServerRequest;
