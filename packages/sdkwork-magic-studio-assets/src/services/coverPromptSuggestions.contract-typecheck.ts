import type {
  AppSdkClient,
  AppSdkCoverPromptSuggestionsRequest,
  AppSdkCoverPromptSuggestionsResponse,
} from '@sdkwork/magic-studio-core/sdk';

type CoverPromptSuggestionsMethod =
  AppSdkClient['generation']['getCoverPromptSuggestions'];
type CoverPromptSuggestionsRequest = Parameters<CoverPromptSuggestionsMethod>[0];
type CoverPromptSuggestionsResponse = Awaited<ReturnType<CoverPromptSuggestionsMethod>>;

const validCoverPromptSuggestionsRequest = {
  context: 'AI workspace for startup founders',
  count: 3,
  language: 'en-US',
  styleHints: ['editorial', 'minimalist'],
} satisfies AppSdkCoverPromptSuggestionsRequest;

const validCoverPromptSuggestionsResponse = {
  code: 2000,
  message: 'ok',
  data: {
    prompts: [
      'Editorial cover prompt with clear hierarchy.',
      'Minimalist cover prompt with strong focal balance.',
    ],
  },
} satisfies AppSdkCoverPromptSuggestionsResponse;

const validRequestAlias = validCoverPromptSuggestionsRequest satisfies CoverPromptSuggestionsRequest;
const validResponseAlias = validCoverPromptSuggestionsResponse satisfies CoverPromptSuggestionsResponse;

void validCoverPromptSuggestionsRequest;
void validCoverPromptSuggestionsResponse;
void validRequestAlias;
void validResponseAlias;
