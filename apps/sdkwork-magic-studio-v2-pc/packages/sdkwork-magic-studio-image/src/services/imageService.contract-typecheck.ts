import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationPromptEnhanceRequest,
  MagicStudioGenerationPromptEnhanceResult,
  MagicStudioGenerationTask,
  MagicStudioImageEditRequest,
  MagicStudioImageGenerationRequest,
  MagicStudioImageUpscaleRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type { MediaInputRef } from '@sdkwork/magic-studio-types/agi';

type ImageGenerationRequest = Parameters<MagicStudioServerClient['createImageGenerationTask']>[0];
type ImageVariationRequest = Parameters<MagicStudioServerClient['createImageVariationTask']>[0];
type ImageEditRequest = Parameters<MagicStudioServerClient['createImageEditTask']>[0];
type ImageUpscaleRequest = Parameters<MagicStudioServerClient['createImageUpscaleTask']>[0];
type ImageGenerationResponse = Awaited<
  ReturnType<MagicStudioServerClient['createImageGenerationTask']>
>;
type PromptEnhanceRequest = Parameters<MagicStudioServerClient['enhanceImageGenerationPrompt']>[0];
type PromptEnhanceResponse = Awaited<
  ReturnType<MagicStudioServerClient['enhanceImageGenerationPrompt']>
>;

const validReferenceInput = {
  id: null,
  uuid: 'image-input-uuid-1',
  assetId: null,
  assetUuid: 'image-asset-uuid-1',
  primaryResourceId: null,
  primaryResourceUuid: null,
  resourceViewId: null,
  resourceViewUuid: 'image-view-uuid-1',
  type: 'image',
  role: 'reference',
  url: 'https://example.com/reference-1.png',
  name: 'Reference 1',
  mimeType: 'image/png',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies MediaInputRef;

const validImageGenerationRequest = {
  prompt: 'floating glass city',
  negativePrompt: 'blur',
  model: 'gemini-2.5-flash-image',
  width: 1280,
  height: 720,
  quality: 'hd',
  style: 'realistic',
  steps: 30,
  guidance: 7,
  aspectRatio: '16:9',
  seed: 42,
  referenceImages: [validReferenceInput],
} satisfies ImageGenerationRequest satisfies MagicStudioImageGenerationRequest;

const validImageVariationRequest = {
  prompt: '',
  model: 'gemini-2.5-flash-image',
  width: 1024,
  height: 1024,
  referenceImages: [
    {
      ...validReferenceInput,
      uuid: 'variation-image-input-uuid-1',
      assetUuid: 'variation-image-asset-uuid-1',
      resourceViewUuid: 'variation-image-view-uuid-1',
      url: 'https://example.com/variation-reference.png',
      name: 'Variation Reference',
    },
  ],
} satisfies ImageVariationRequest satisfies MagicStudioImageGenerationRequest;

const validImageEditRequest = {
  source: {
    ...validReferenceInput,
    uuid: 'source-image-input-uuid-1',
    assetId: 'source-asset-1',
    assetUuid: 'source-asset-uuid-1',
    role: 'source-image',
    url: 'https://storage.example.com/source.png',
    name: 'source.png',
  },
  mask: {
    ...validReferenceInput,
    uuid: 'mask-image-input-uuid-1',
    assetId: 'mask-asset-1',
    assetUuid: 'mask-asset-uuid-1',
    role: 'mask',
    url: 'https://cdn.example.com/mask.png',
    name: 'mask.png',
  },
  prompt: 'Remove the masked content naturally.',
  negativePrompt: 'blurry',
  strength: 1,
  format: 'png',
  n: 1,
} satisfies ImageEditRequest satisfies MagicStudioImageEditRequest;

const validImageUpscaleRequest = {
  source: validImageEditRequest.source,
  prompt: 'Upscale the source image while preserving details.',
  negativePrompt: 'blurry',
  model: 'upscaler-pro',
  scale: 4,
  targetWidth: 2048,
  targetHeight: 2048,
  format: 'png',
  n: 1,
} satisfies ImageUpscaleRequest satisfies MagicStudioImageUpscaleRequest;

const validPromptEnhanceRequest = {
  prompt: 'floating glass city',
  scene: 'image-generation',
  maxWords: 100,
} satisfies PromptEnhanceRequest satisfies MagicStudioGenerationPromptEnhanceRequest;

const validImageTaskPayload = {
  id: 'task-1',
  uuid: 'task-uuid-1',
  taskId: 'image-task-1',
  product: 'image',
  mode: 'text-to-image',
  status: 'succeeded',
  prompt: validImageGenerationRequest.prompt,
  negativePrompt: validImageGenerationRequest.negativePrompt,
  provider: 'runtime-image',
  providerModel: 'gemini-2.5-flash-image',
  remoteJobId: 'image-task-1',
  progress: 100,
  inputRefs: validImageGenerationRequest.referenceImages,
  artifacts: [
    {
      id: 'artifact-1',
      uuid: 'artifact-uuid-1',
      type: 'image',
      role: 'primary',
      url: 'https://example.com/generated-image.png',
      mimeType: 'image/png',
      name: 'generated-image.png',
      width: 1280,
      height: 720,
      metadata: {
        aspectRatio: '16:9',
      },
    },
  ],
  primaryArtifact: {
    id: 'artifact-1',
    uuid: 'artifact-uuid-1',
    type: 'image',
    role: 'primary',
    url: 'https://example.com/generated-image.png',
    mimeType: 'image/png',
    name: 'generated-image.png',
    width: 1280,
    height: 720,
    metadata: {
      aspectRatio: '16:9',
    },
  },
  parameters: {
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
  },
  providerPayload: {
    source: 'contract',
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:01.000Z',
  completedAt: '2026-04-25T00:00:01.000Z',
} satisfies MagicStudioGenerationTask;

const validImageTaskResponse = {
  requestId: 'req-image-task-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validImageTaskPayload,
  meta: {
    version: '2026-04-25',
  },
} satisfies ImageGenerationResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationTask>;

const validPromptEnhancePayload = {
  prompt: 'cinematic floating glass city at sunset, volumetric light, ultra detailed',
} satisfies MagicStudioGenerationPromptEnhanceResult;

const validPromptEnhanceResponse = {
  requestId: 'req-image-prompt-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validPromptEnhancePayload,
  meta: {
    version: '2026-04-25',
  },
} satisfies PromptEnhanceResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationPromptEnhanceResult>;

void validImageGenerationRequest;
void validImageVariationRequest;
void validImageEditRequest;
void validImageUpscaleRequest;
void validPromptEnhanceRequest;
void validImageTaskResponse;
void validPromptEnhanceResponse;
