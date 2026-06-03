import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationArtifact,
  MagicStudioGenerationTask,
  MagicStudioImageEditRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type { MediaInputRef } from '@sdkwork/magic-studio-types/agi';

type CreateImageEditRequest = Parameters<MagicStudioServerClient['createImageEditTask']>[0];
type CreateImageEditResponse = Awaited<ReturnType<MagicStudioServerClient['createImageEditTask']>>;

const validSourceRef = {
  id: null,
  uuid: 'source-input-uuid-1',
  assetId: 'source-asset-1',
  assetUuid: 'source-asset-uuid-1',
  primaryResourceId: null,
  primaryResourceUuid: null,
  resourceViewId: null,
  resourceViewUuid: 'source-view-uuid-1',
  type: 'image',
  role: 'source-image',
  url: 'https://example.com/source.png',
  name: 'source.png',
  mimeType: 'image/png',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies MediaInputRef;

const validMaskRef = {
  id: null,
  uuid: 'mask-input-uuid-1',
  assetId: 'mask-asset-1',
  assetUuid: 'mask-asset-uuid-1',
  primaryResourceId: null,
  primaryResourceUuid: null,
  resourceViewId: null,
  resourceViewUuid: 'mask-view-uuid-1',
  type: 'image',
  role: 'mask',
  url: 'https://example.com/mask.png',
  name: 'mask.png',
  mimeType: 'image/png',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies MediaInputRef;

const validImageEditRequest = {
  source: validSourceRef,
  mask: validMaskRef,
  prompt: 'Remove the masked object and reconstruct the background naturally',
  negativePrompt: 'blurry',
  model: 'gemini-2.5-flash-image',
  strength: 1,
  format: 'png',
  n: 1,
  width: 1024,
  height: 1024,
} satisfies CreateImageEditRequest satisfies MagicStudioImageEditRequest;

const validImageEditArtifact = {
  id: 'artifact-edit-1',
  uuid: 'artifact-edit-uuid-1',
  type: 'image',
  role: 'primary',
  url: 'https://example.com/edited-image.png',
  mimeType: 'image/png',
  name: 'edited-image.png',
  width: 1024,
  height: 1024,
  metadata: {
    aspectRatio: '1:1',
  },
} satisfies MagicStudioGenerationArtifact;

const validImageEditTask = {
  id: 'task-edit-1',
  uuid: 'task-edit-uuid-1',
  taskId: 'image-edit-task-1',
  product: 'image',
  mode: 'inpaint',
  status: 'succeeded',
  prompt: validImageEditRequest.prompt,
  negativePrompt: validImageEditRequest.negativePrompt,
  provider: 'runtime-image',
  providerModel: 'gemini-2.5-flash-image',
  remoteJobId: 'image-edit-task-1',
  progress: 100,
  inputRefs: [validSourceRef, validMaskRef],
  artifacts: [validImageEditArtifact],
  primaryArtifact: validImageEditArtifact,
  parameters: {
    strength: 1,
    format: 'png',
    n: 1,
    width: 1024,
    height: 1024,
  },
  providerPayload: {
    source: 'contract',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validImageEditResponse = {
  requestId: 'req-image-edit-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validImageEditTask,
  meta: {
    version: '2026-04-25',
  },
} satisfies CreateImageEditResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

void validSourceRef;
void validMaskRef;
void validImageEditRequest;
void validImageEditArtifact;
void validImageEditTask;
void validImageEditResponse;
