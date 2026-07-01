import type {
  MagicStudioApiEnvelope,
  MagicStudioPromptOptimizeRequest,
  MagicStudioPromptOptimizeResult,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimePromptOptimizeRequest =
  Parameters<MagicStudioServerClient['optimizePrompt']>[0];
type RuntimePromptOptimizeEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['optimizePrompt']>
>;

const runtimePromptOptimizeRequestMatchesServerType: AssertAssignable<
  RuntimePromptOptimizeRequest,
  MagicStudioPromptOptimizeRequest
> = true;
const serverPromptOptimizeRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioPromptOptimizeRequest,
  RuntimePromptOptimizeRequest
> = true;
const runtimePromptOptimizeEnvelopeMatchesServerType: AssertAssignable<
  RuntimePromptOptimizeEnvelope,
  MagicStudioApiEnvelope<MagicStudioPromptOptimizeResult>
> = true;

const validSettingsPromptOptimizeRequest = {
  prompt: 'You are a careful coding agent.',
  scene: 'agent-system-prompt',
  maxWords: 400,
} satisfies RuntimePromptOptimizeRequest;

const validSettingsPromptOptimizeResult = {
  originalInput: validSettingsPromptOptimizeRequest.prompt,
  optimizedPrompt:
    'You are a careful coding agent with concise and deterministic system instructions.',
  suggestions: ['Keep policy constraints explicit.'],
  keywords: ['coding', 'deterministic', 'constraints'],
} satisfies MagicStudioPromptOptimizeResult;

const validSettingsPromptOptimizeResponse = {
  requestId: 'request-settings-prompt-optimize',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validSettingsPromptOptimizeResult,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimePromptOptimizeEnvelope;

void runtimePromptOptimizeRequestMatchesServerType;
void serverPromptOptimizeRequestMatchesRuntimeType;
void runtimePromptOptimizeEnvelopeMatchesServerType;
void validSettingsPromptOptimizeResponse;
