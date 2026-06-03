import type {
  MagicStudioApiEnvelope,
  MagicStudioPromptOptimizeRequest,
  MagicStudioPromptOptimizeResult,
} from '@sdkwork/magic-studio-server';

const validPromptOptimizeRequest = {
  prompt: 'Turn this mountain lake idea into a production-ready image prompt.',
  type: 'image',
  mode: 'text-to-prompt',
  targetStyle: 'cinematic',
  additionalInstructions: 'add volumetric sunrise light',
  maxWords: 180,
} satisfies MagicStudioPromptOptimizeRequest;

const validPromptOptimizeResult = {
  originalInput: validPromptOptimizeRequest.prompt,
  optimizedPrompt: 'A cinematic sunrise mountain lake with volumetric mist and reflective water.',
  suggestions: [
    'Add focal subject details and scene context for clearer composition.',
    'Specify lighting and color palette to reduce style ambiguity.',
  ],
  keywords: ['cinematic', 'sunrise', 'mountain', 'lake'],
} satisfies MagicStudioPromptOptimizeResult;

const validPromptOptimizeResponse = {
  requestId: 'req-prompt-optimize-1',
  timestamp: '2026-04-05T12:00:00.000Z',
  data: validPromptOptimizeResult,
  meta: {
    version: 'v1',
  },
} satisfies MagicStudioApiEnvelope<MagicStudioPromptOptimizeResult>;

void validPromptOptimizeRequest;
void validPromptOptimizeResult;
void validPromptOptimizeResponse;
