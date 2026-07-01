import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import type { ImageAspectRatio } from '@sdkwork/magic-studio-types/image';

export interface GenerateAssetCoverImageRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: ImageAspectRatio;
  model?: string;
}

export interface AssetCoverGenerationAdapter {
  generateImage: (input: GenerateAssetCoverImageRequest) => Promise<GenerationOutcome>;
}

const localAssetCoverGenerationAdapter: AssetCoverGenerationAdapter = {
  generateImage: async () => {
    throw new Error('Asset cover generation adapter is not configured');
  },
};

const controller =
  createServiceAdapterController<AssetCoverGenerationAdapter>(localAssetCoverGenerationAdapter);

export const assetCoverGenerationService: AssetCoverGenerationAdapter = controller.service;
export const setAssetCoverGenerationAdapter = controller.setAdapter;
export const getAssetCoverGenerationAdapter = controller.getAdapter;
export const resetAssetCoverGenerationAdapter = controller.resetAdapter;

