import type { ImageAspectRatio } from '@sdkwork/magic-studio-types/image';
import { getAppSdkClientWithSession } from '@sdkwork/magic-studio-core/sdk';

import {
  persistGenerationOutcomeAsset,
  type PersistedGenerationOutcomeAsset,
} from './generatedOutcomeAssetPersistence';
import {
  type AssetCoverGenerationAdapter,
  assetCoverGenerationService,
} from './coverGenerationAdapter';

interface CoverPromptSuggestionsRequest {
  context: string;
  count?: number;
  language?: string;
  styleHints?: string[];
}

interface CoverPromptSuggestionsResponse {
  code?: number;
  data?: {
    prompts?: unknown;
  };
  message?: string;
  msg?: string;
}

interface CoverPromptSuggestionsApiLike {
  getCoverPromptSuggestions(
    request: CoverPromptSuggestionsRequest,
  ): Promise<CoverPromptSuggestionsResponse>;
}

const coverImageGenerationService: AssetCoverGenerationAdapter = assetCoverGenerationService;
const SUCCESS_CODE = 2000;

export interface GenerateAssetCoverImageInput {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: ImageAspectRatio;
  model?: string;
}

export interface SuggestAssetCoverPromptsInput {
  context: string;
  count?: number;
  styleHints?: string[];
  language?: string;
}

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const normalizeStringList = (values: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((item) => normalizeText(item))
        .filter((item): item is string => Boolean(item)),
    ),
  );
};

const getCoverPromptSuggestionsApi = (): CoverPromptSuggestionsApiLike => {
  const generationApi = getAppSdkClientWithSession().generation as Partial<CoverPromptSuggestionsApiLike>;

  if (typeof generationApi.getCoverPromptSuggestions !== 'function') {
    throw new Error('Cover prompt suggestions SDK method is unavailable.');
  }

  return generationApi as CoverPromptSuggestionsApiLike;
};

const readFailureMessage = (response: CoverPromptSuggestionsResponse): string =>
  normalizeText(response.message)
  ?? normalizeText(response.msg)
  ?? 'Failed to load cover prompt suggestions.';

export const generateAssetCoverImage = async ({
  prompt,
  negativePrompt,
  aspectRatio,
  model,
}: GenerateAssetCoverImageInput): Promise<PersistedGenerationOutcomeAsset> => {
  const outcome = await coverImageGenerationService.generateImage({
    prompt,
    negativePrompt,
    aspectRatio,
    model,
  });

  return persistGenerationOutcomeAsset({
    outcome,
    type: 'image',
    domain: 'asset-center',
    name: `asset_cover_${Date.now()}.png`,
  });
};

export const suggestAssetCoverPrompts = async ({
  context,
  count,
  styleHints,
  language,
}: SuggestAssetCoverPromptsInput): Promise<string[]> => {
  const normalizedContext = normalizeText(context);
  if (!normalizedContext) {
    throw new Error('Cover prompt suggestion context is required.');
  }

  const normalizedStyleHints = normalizeStringList(styleHints);
  const requestBody: CoverPromptSuggestionsRequest = {
    context: normalizedContext,
    count,
    language,
    ...(normalizedStyleHints.length > 0 ? { styleHints: normalizedStyleHints } : {}),
  };
  const response = await getCoverPromptSuggestionsApi().getCoverPromptSuggestions(requestBody);

  if (typeof response.code === 'number' && response.code !== SUCCESS_CODE) {
    throw new Error(readFailureMessage(response));
  }

  const promptSuggestions = normalizeStringList(response.data?.prompts);
  if (promptSuggestions.length === 0) {
    throw new Error('Failed to load cover prompt suggestions.');
  }

  return promptSuggestions;
};
