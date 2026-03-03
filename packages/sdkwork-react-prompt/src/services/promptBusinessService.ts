import {
  createServiceAdapterController,
  generateUUID,
  Result,
  type ServiceResult
} from '@sdkwork/react-commons';
import { hasSdkworkClient, sdk } from '@sdkwork/react-core';
import type {
  PromptOptimizationConfig,
  PromptOptimizationResult,
  PromptType
} from '../types';

const PROMPT_ENHANCE_ENDPOINT = '/app/v3/api/generation/prompt/enhance';

interface PromptEnhanceApiRequest {
  prompt: string;
  generationType: 'IMAGE' | 'VIDEO';
  mode: string;
  style?: string;
  additionalInstructions?: string;
  reference?: PromptEnhanceReference;
}

interface PromptEnhanceReference {
  type: 'image' | 'video';
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  url?: string;
}

interface PromptEnhanceApiData {
  prompt?: string;
  optimizedPrompt?: string;
  suggestions?: string[];
  keywords?: string[];
}

interface PromptEnhanceApiEnvelope {
  data?: PromptEnhanceApiData;
}

interface GenerationModuleV2 {
  enhanceGenerationPrompt?: (
    body: PromptEnhanceApiRequest
  ) => Promise<PromptEnhanceApiData | PromptEnhanceApiEnvelope | undefined>;
}

export interface PromptBusinessAdapter {
  optimizePrompt(config: PromptOptimizationConfig): Promise<ServiceResult<PromptOptimizationResult>>;
}

function normalizeText(value?: string): string {
  return (value || '').trim();
}

function buildOriginalInput(config: PromptOptimizationConfig): string {
  const textInput = normalizeText(config.inputText);
  if (textInput) {
    return textInput;
  }

  if (config.mode === 'video-to-prompt') {
    return 'Generate from provided video reference.';
  }

  if (config.mode === 'image-to-prompt') {
    return 'Generate from provided image reference.';
  }

  return 'Generate a high-quality creative prompt.';
}

function normalizeReferenceInput(value: File | string | undefined, type: 'image' | 'video'): PromptEnhanceReference | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return { type, url: value };
  }

  return {
    type,
    fileName: value.name,
    mimeType: value.type,
    fileSize: value.size
  };
}

function buildApiRequest(config: PromptOptimizationConfig, originalInput: string): PromptEnhanceApiRequest {
  const generationType: 'IMAGE' | 'VIDEO' = config.type === 'video' ? 'VIDEO' : 'IMAGE';
  const reference = config.mode === 'video-to-prompt'
    ? normalizeReferenceInput(config.inputVideo, 'video')
    : normalizeReferenceInput(config.inputImage, 'image');

  return {
    prompt: originalInput,
    generationType,
    mode: config.mode,
    style: normalizeText(config.targetStyle) || undefined,
    additionalInstructions: normalizeText(config.additionalInstructions) || undefined,
    reference
  };
}

function buildFallbackPrompt(config: PromptOptimizationConfig, originalInput: string): string {
  const segments: string[] = [originalInput];

  if (config.type === 'video') {
    segments.push('Describe shot composition, camera movement, pacing, and cinematic lighting.');
  } else {
    segments.push('Describe composition, lighting, materials, color palette, and high-detail rendering.');
  }

  if (config.mode === 'image-to-prompt') {
    segments.push('Respect key subject and framing from the uploaded image reference.');
  } else if (config.mode === 'video-to-prompt') {
    segments.push('Respect visual rhythm and continuity from the uploaded video reference.');
  }

  const style = normalizeText(config.targetStyle);
  if (style) {
    segments.push(`Target style: ${style}.`);
  }

  const extra = normalizeText(config.additionalInstructions);
  if (extra) {
    segments.push(`Extra instructions: ${extra}.`);
  }

  return segments.join(' ');
}

function buildFallbackSuggestions(type: PromptType): string[] {
  if (type === 'video') {
    return [
      'Specify camera movement (dolly, pan, handheld) to improve motion quality.',
      'Add timing hints like slow motion, realtime, or quick cuts.',
      'Describe mood and lighting direction to stabilize visual style.'
    ];
  }

  return [
    'Add focal subject details and scene context for better composition.',
    'Specify lighting and color palette to reduce style ambiguity.',
    'Include quality cues such as ultra-detailed texture and clean background.'
  ];
}

function extractOptimizedPrompt(data: PromptEnhanceApiData, fallback: string): string {
  const fromOptimized = normalizeText(data.optimizedPrompt);
  if (fromOptimized) {
    return fromOptimized;
  }

  const fromPrompt = normalizeText(data.prompt);
  if (fromPrompt) {
    return fromPrompt;
  }

  return fallback;
}

function normalizeEnhanceResponse(
  payload: PromptEnhanceApiData | PromptEnhanceApiEnvelope | undefined
): PromptEnhanceApiData {
  if (!payload) {
    return {};
  }

  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    return payload.data;
  }

  return payload as PromptEnhanceApiData;
}

function buildOptimizationResult(
  config: PromptOptimizationConfig,
  originalInput: string,
  optimizedPrompt: string,
  suggestions: string[]
): PromptOptimizationResult {
  return {
    id: generateUUID(),
    type: config.type,
    mode: config.mode,
    originalInput,
    optimizedPrompt,
    suggestions,
    createdAt: new Date()
  };
}

const localPromptAdapter: PromptBusinessAdapter = {
  async optimizePrompt(config: PromptOptimizationConfig): Promise<ServiceResult<PromptOptimizationResult>> {
    const originalInput = buildOriginalInput(config);
    const fallbackPrompt = buildFallbackPrompt(config, originalInput);
    const fallbackSuggestions = buildFallbackSuggestions(config.type);

    if (!hasSdkworkClient()) {
      const localResult = buildOptimizationResult(config, originalInput, fallbackPrompt, fallbackSuggestions);
      return Result.success(localResult);
    }

    try {
      const payload = buildApiRequest(config, originalInput);
      const generationV2 = sdk.generation as unknown as GenerationModuleV2;
      const responsePayload = typeof generationV2.enhanceGenerationPrompt === 'function'
        ? await generationV2.enhanceGenerationPrompt(payload)
        : await sdk.client.http.post<PromptEnhanceApiData>(PROMPT_ENHANCE_ENDPOINT, payload);
      const response = normalizeEnhanceResponse(responsePayload);
      const optimizedPrompt = extractOptimizedPrompt(response, fallbackPrompt);
      const suggestions = response.suggestions && response.suggestions.length > 0
        ? response.suggestions
        : response.keywords || fallbackSuggestions;

      return Result.success(
        buildOptimizationResult(config, originalInput, optimizedPrompt, suggestions)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      const endpointMissing = message.includes('404') || message.includes('not found');
      if (endpointMissing) {
        const localResult = buildOptimizationResult(config, originalInput, fallbackPrompt, fallbackSuggestions);
        return Result.success(localResult);
      }

      return Result.error<PromptOptimizationResult>(
        error instanceof Error ? error.message : 'Prompt optimization failed'
      );
    }
  }
};

const controller = createServiceAdapterController<PromptBusinessAdapter>(localPromptAdapter);

export const promptBusinessService: PromptBusinessAdapter = controller.service;
export const setPromptBusinessAdapter = controller.setAdapter;
export const getPromptBusinessAdapter = controller.getAdapter;
export const resetPromptBusinessAdapter = controller.resetAdapter;
