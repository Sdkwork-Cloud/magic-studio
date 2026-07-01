import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationTask,
  MagicStudioMusicExtendRequest,
  MagicStudioMusicGenerationRequest,
  MagicStudioMusicRemixRequest,
  MagicStudioMusicSimilarRequest,
} from '@sdkwork/magic-studio-host-types';

const validMusicGenerationRequest = {
  title: 'Night Drive',
  prompt: 'uplifting synthwave anthem',
  lyrics: 'neon lights keep calling us home',
  style: 'electronic',
  duration: 120,
  model: 'suno-v3',
  customMode: true,
  instrumental: false,
} satisfies MagicStudioMusicGenerationRequest;

const validMusicSimilarRequest = {
  source: {
    id: 'source-music-1',
    uuid: 'source-music-1',
    assetId: 'source-music-1',
    type: 'music',
    role: 'reference',
    url: 'https://example.com/source-music.mp3',
    name: 'source-music.mp3',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  duration: 60,
  model: 'suno-v3.5',
  idempotencyKey: 'music-similar-1',
} satisfies MagicStudioMusicSimilarRequest;

const validMusicRemixRequest = {
  source: validMusicSimilarRequest.source,
  style: 'jazz-funk',
  model: 'suno-v3.5',
  idempotencyKey: 'music-remix-1',
} satisfies MagicStudioMusicRemixRequest;

const validMusicExtendRequest = {
  source: validMusicSimilarRequest.source,
  extendDuration: 45,
  style: 'cinematic',
  model: 'udio-v1',
  idempotencyKey: 'music-extend-1',
} satisfies MagicStudioMusicExtendRequest;

const validMusicTask = {
  id: 'music-task-1',
  uuid: 'music-task-1',
  taskId: 'music-task-1',
  product: 'music',
  mode: 'text-to-music',
  status: 'succeeded',
  prompt: 'uplifting synthwave anthem',
  provider: 'sdkwork-ai-api',
  providerModel: 'suno-v3',
  remoteJobId: 'remote-music-task-1',
  progress: 100,
  inputRefs: [],
  artifacts: [
    {
      id: 'music-artifact-1',
      uuid: 'music-artifact-1',
      type: 'music',
      role: 'primary',
      url: 'https://example.com/generated-music.mp3',
      mimeType: 'audio/mpeg',
      name: 'generated-music.mp3',
      duration: 120,
      metadata: {
        title: 'Night Drive',
        style: 'electronic',
        lyrics: 'neon lights keep calling us home',
      },
    },
  ],
  primaryArtifact: {
    id: 'music-artifact-1',
    uuid: 'music-artifact-1',
    type: 'music',
    role: 'primary',
    url: 'https://example.com/generated-music.mp3',
    mimeType: 'audio/mpeg',
    name: 'generated-music.mp3',
    duration: 120,
    metadata: {
      title: 'Night Drive',
      style: 'electronic',
      lyrics: 'neon lights keep calling us home',
    },
  },
  parameters: {
    title: 'Night Drive',
    style: 'electronic',
    lyrics: 'neon lights keep calling us home',
    duration: 120,
    customMode: true,
    instrumental: false,
  },
  providerPayload: {
    executionMode: 'generated-ai-sdk',
    responseFormat: 'url',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
} satisfies MagicStudioGenerationTask;

const validMusicTaskEnvelope = {
  requestId: 'req-music-task-1',
  timestamp: new Date().toISOString(),
  data: validMusicTask,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validLifecycleOnlyMusicTask = {
  ...validMusicTask,
  taskId: 'music-remix-task-1',
  mode: 'restyle',
  status: 'queued',
  inputRefs: [validMusicSimilarRequest.source],
  artifacts: [],
  primaryArtifact: null,
  completedAt: null,
  parameters: {
    style: 'jazz-funk',
  },
} satisfies MagicStudioGenerationTask;

const validLifecycleOnlyMusicTaskEnvelope = {
  requestId: 'req-music-remix-task-1',
  timestamp: new Date().toISOString(),
  data: validLifecycleOnlyMusicTask,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

void validMusicGenerationRequest;
void validMusicSimilarRequest;
void validMusicRemixRequest;
void validMusicExtendRequest;
void validMusicTask;
void validMusicTaskEnvelope;
void validLifecycleOnlyMusicTask;
void validLifecycleOnlyMusicTaskEnvelope;
