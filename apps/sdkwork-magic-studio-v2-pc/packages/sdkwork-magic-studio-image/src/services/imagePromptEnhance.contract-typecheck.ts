import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationPromptEnhanceRequest,
  MagicStudioGenerationPromptEnhanceResult,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type EnhanceGenerationPromptRequest = Parameters<MagicStudioServerClient['enhanceImageGenerationPrompt']>[0];
type EnhanceGenerationPromptResponse = Awaited<
  ReturnType<MagicStudioServerClient['enhanceImageGenerationPrompt']>
>;

const validImagePromptEnhanceRequest = {
  prompt: 'floating glass city',
  scene: 'image-generation',
  maxWords: 100,
} satisfies EnhanceGenerationPromptRequest satisfies MagicStudioGenerationPromptEnhanceRequest;

const validImagePromptEnhancePayload = {
  prompt: 'cinematic floating glass city at sunset, volumetric light, ultra detailed',
} satisfies MagicStudioGenerationPromptEnhanceResult;

const validImagePromptEnhanceResponse = {
  requestId: 'req-image-prompt-1',
  timestamp: '2026-04-22T10:00:00.000Z',
  data: validImagePromptEnhancePayload,
  meta: {
    version: '2026-04-22',
  },
} satisfies EnhanceGenerationPromptResponse satisfies MagicStudioApiEnvelope<MagicStudioGenerationPromptEnhanceResult>;

void validImagePromptEnhanceRequest;
void validImagePromptEnhancePayload;
void validImagePromptEnhanceResponse;
