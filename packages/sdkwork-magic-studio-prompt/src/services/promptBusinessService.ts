import {
  Result,
  type ServiceResult
} from '@sdkwork/magic-studio-types/service';
import { createUuid } from '@sdkwork/magic-studio-types/entity';
import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import type {
  MagicStudioPromptOptimizeRequest,
  MagicStudioPromptOptimizeResult,
} from '@sdkwork/magic-studio-server';
import type {
  PromptOptimizationConfig,
  PromptOptimizationResult,
} from '../types';

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

function describeReferenceInput(value: File | string | undefined, type: 'image' | 'video'): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return `Reference ${type} URL: ${value}`;
  }

  const parts = [`Reference ${type} file: ${value.name || 'unnamed-file'}`];
  const mimeType = normalizeText(value.type);
  if (mimeType) {
    parts.push(`mime ${mimeType}`);
  }
  if (typeof value.size === 'number' && Number.isFinite(value.size) && value.size > 0) {
    parts.push(`${value.size} bytes`);
  }

  return `${parts.join(', ')}.`;
}

function buildApiRequest(config: PromptOptimizationConfig, originalInput: string) {
  const imageReference = describeReferenceInput(config.inputImage, 'image');
  const videoReference = describeReferenceInput(config.inputVideo, 'video');
  const imageName = config.inputImage instanceof File ? normalizeText(config.inputImage.name) : '';
  const imageUrl = typeof config.inputImage === 'string' ? normalizeText(config.inputImage) : '';
  const videoName = config.inputVideo instanceof File ? normalizeText(config.inputVideo.name) : '';
  const videoUrl = typeof config.inputVideo === 'string' ? normalizeText(config.inputVideo) : '';
  const additionalInstructions = [
    normalizeText(config.additionalInstructions),
    imageReference || '',
    videoReference || '',
  ]
    .filter((value) => value.length > 0)
    .join(' ');

  return {
    prompt: originalInput,
    type: config.type,
    mode: config.mode,
    targetStyle: normalizeText(config.targetStyle) || undefined,
    additionalInstructions: additionalInstructions || undefined,
    inputImageName: imageName || undefined,
    inputImageUrl: imageUrl || undefined,
    inputVideoName: videoName || undefined,
    inputVideoUrl: videoUrl || undefined,
    maxWords: config.type === 'video' ? 220 : 180,
  } satisfies MagicStudioPromptOptimizeRequest;
}

function buildOptimizationResult(
  config: PromptOptimizationConfig,
  originalInput: string,
  optimizedPrompt: string,
  suggestions: string[]
): PromptOptimizationResult {
  const resultUuid = createUuid();

  return {
    id: null,
    uuid: resultUuid,
    type: config.type,
    mode: config.mode,
    originalInput,
    optimizedPrompt,
    suggestions,
    createdAt: new Date()
  };
}

function normalizeStringList(value: string[]): string[] {
  return value.map((item) => normalizeText(item)).filter((item) => item.length > 0);
}

function buildOptimizationResultFromServer(
  config: PromptOptimizationConfig,
  fallbackOriginalInput: string,
  data: MagicStudioPromptOptimizeResult | undefined
): PromptOptimizationResult {
  if (!data) {
    throw new Error('Prompt optimization response missing data');
  }

  const originalInput = normalizeText(data.originalInput) || fallbackOriginalInput;
  const optimizedPrompt = normalizeText(data.optimizedPrompt);
  if (!optimizedPrompt) {
    throw new Error('Prompt optimization response missing optimizedPrompt');
  }

  return buildOptimizationResult(
    config,
    originalInput,
    optimizedPrompt,
    normalizeStringList(data.suggestions)
  );
}

const localPromptAdapter: PromptBusinessAdapter = {
  async optimizePrompt(config: PromptOptimizationConfig): Promise<ServiceResult<PromptOptimizationResult>> {
    const originalInput = buildOriginalInput(config);

    try {
      const runtime = readDefaultPlatformRuntime('PromptBusinessService');
      const serverClient = createRuntimeMagicStudioServerClient(runtime);
      const payload = buildApiRequest(config, originalInput);
      const responsePayload = await serverClient.optimizePrompt(payload);

      return Result.success(
        buildOptimizationResultFromServer(config, originalInput, responsePayload.data)
      );
    } catch (error) {
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
