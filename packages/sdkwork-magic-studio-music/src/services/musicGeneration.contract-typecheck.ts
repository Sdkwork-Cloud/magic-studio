import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';

type CreateMusicGenerationRequest = Parameters<MagicStudioServerClient['createMusicGenerationTask']>[0];
type CreateMusicGenerationResponse = Awaited<ReturnType<MagicStudioServerClient['createMusicGenerationTask']>>;
type CreateMusicSimilarRequest = Parameters<MagicStudioServerClient['createMusicSimilarTask']>[0];
type CreateMusicSimilarResponse = Awaited<ReturnType<MagicStudioServerClient['createMusicSimilarTask']>>;
type CreateMusicRemixRequest = Parameters<MagicStudioServerClient['createMusicRemixTask']>[0];
type CreateMusicRemixResponse = Awaited<ReturnType<MagicStudioServerClient['createMusicRemixTask']>>;
type CreateMusicExtendRequest = Parameters<MagicStudioServerClient['createMusicExtendTask']>[0];
type CreateMusicExtendResponse = Awaited<ReturnType<MagicStudioServerClient['createMusicExtendTask']>>;
type ReadMusicTaskRequest = Parameters<MagicStudioServerClient['readMusicGenerationTask']>[0];
type ReadMusicTaskResponse = Awaited<ReturnType<MagicStudioServerClient['readMusicGenerationTask']>>;

const validMusicGenerationRequest = {
  title: 'Night Drive',
  prompt: 'uplifting synthwave anthem',
  model: 'suno-v3',
  lyrics: 'neon lights keep calling us home',
  style: 'electronic',
  duration: 120,
  customMode: true,
  instrumental: false,
} satisfies CreateMusicGenerationRequest;

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
} satisfies CreateMusicSimilarRequest;

const validMusicRemixRequest = {
  source: validMusicSimilarRequest.source,
  style: 'jazz-funk',
  model: 'suno-v3.5',
  idempotencyKey: 'music-remix-1',
} satisfies CreateMusicRemixRequest;

const validMusicExtendRequest = {
  source: validMusicSimilarRequest.source,
  extendDuration: 45,
  style: 'cinematic',
  model: 'udio-v1',
  idempotencyKey: 'music-extend-1',
} satisfies CreateMusicExtendRequest;

const validMusicGenerationResponse = {
  requestId: 'req-music-create-1',
  timestamp: new Date().toISOString(),
  data: {
    id: 'music-task-1',
    uuid: 'music-task-1',
    taskId: 'music-task-1',
    product: 'music',
    mode: 'text-to-music',
    status: 'succeeded',
    prompt: 'uplifting synthwave anthem',
    provider: 'sdkwork-ai-api',
    providerModel: 'suno-v3',
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
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  meta: {
    version: 'v1',
  },
} satisfies CreateMusicGenerationResponse;

const validMusicSimilarResponse = {
  requestId: 'req-music-similar-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validMusicGenerationResponse.data,
    taskId: 'music-similar-task-1',
    mode: 'variation',
    status: 'queued',
    inputRefs: [validMusicSimilarRequest.source],
    artifacts: [],
    primaryArtifact: null,
    completedAt: null,
  },
  meta: {
    version: 'v1',
  },
} satisfies CreateMusicSimilarResponse;

const validMusicRemixResponse = {
  requestId: 'req-music-remix-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validMusicSimilarResponse.data,
    taskId: 'music-remix-task-1',
    mode: 'restyle',
    parameters: {
      style: 'jazz-funk',
    },
  },
  meta: {
    version: 'v1',
  },
} satisfies CreateMusicRemixResponse;

const validMusicExtendResponse = {
  requestId: 'req-music-extend-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validMusicSimilarResponse.data,
    taskId: 'music-extend-task-1',
    mode: 'extend',
    parameters: {
      extendDuration: 45,
      style: 'cinematic',
    },
  },
  meta: {
    version: 'v1',
  },
} satisfies CreateMusicExtendResponse;

const validMusicStatusTaskId: ReadMusicTaskRequest = 'music-task-1';

const validMusicStatusResponse = {
  requestId: 'req-music-status-1',
  timestamp: new Date().toISOString(),
  data: {
    ...validMusicGenerationResponse.data,
    taskId: validMusicStatusTaskId,
    status: 'processing',
    progress: 65,
    artifacts: [],
    primaryArtifact: null,
    completedAt: null,
  },
  meta: {
    version: 'v1',
  },
} satisfies ReadMusicTaskResponse;

void validMusicGenerationRequest;
void validMusicSimilarRequest;
void validMusicRemixRequest;
void validMusicExtendRequest;
void validMusicGenerationResponse;
void validMusicSimilarResponse;
void validMusicRemixResponse;
void validMusicExtendResponse;
void validMusicStatusTaskId;
void validMusicStatusResponse;
