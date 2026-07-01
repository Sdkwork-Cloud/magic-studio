import type {
  MagicStudioApiEnvelope,
  MagicStudioGenerationPromptEnhanceRequest,
  MagicStudioGenerationPromptEnhanceResult,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type EnhanceGenerationPromptRequest =
  Parameters<MagicStudioServerClient['enhanceVideoGenerationPrompt']>[0];
type EnhanceGenerationPromptResponse =
  Awaited<ReturnType<MagicStudioServerClient['enhanceVideoGenerationPrompt']>>;

const validEnvelopeBase = {
  requestId: 'req-video-prompt-enhance-1',
  timestamp: '2026-04-25T00:00:00.000Z',
  meta: {
    version: '2026-04-25',
  },
};

const validVideoPromptEnhanceRequest = {
  prompt: 'make the motion more cinematic',
  scene: 'video-generation',
  style: 'warm cinematic lighting',
  language: 'en',
  maxWords: 140,
} satisfies EnhanceGenerationPromptRequest;

const validVideoPromptEnhancePayload = {
  prompt: 'enhanced cinematic prompt',
} satisfies MagicStudioGenerationPromptEnhanceResult;

const validVideoPromptEnhanceResponse = {
  ...validEnvelopeBase,
  data: validVideoPromptEnhancePayload,
} satisfies EnhanceGenerationPromptResponse;

const validExplicitEnvelope = {
  ...validEnvelopeBase,
  data: validVideoPromptEnhancePayload,
} satisfies MagicStudioApiEnvelope<MagicStudioGenerationPromptEnhanceResult>;

const validServerRequest =
  validVideoPromptEnhanceRequest satisfies MagicStudioGenerationPromptEnhanceRequest;

void validVideoPromptEnhanceRequest;
void validVideoPromptEnhancePayload;
void validVideoPromptEnhanceResponse;
void validExplicitEnvelope;
void validServerRequest;
