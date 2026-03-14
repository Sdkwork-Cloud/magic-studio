import type {
    ImageAspectRatio,
    ImageGenerationConfig,
    ImageModelOutputPolicy,
    ImagePanelGenerationRequirement,
    ImagePanelRuntimeState,
    ImagePanelSchema
} from '../../entities';

export type {
    ImagePanelSectionKey,
    ImagePanelRequirementKey,
    ImagePanelGenerationRequirement,
    ImagePanelGenerationRule,
    ImagePanelSchema,
    ImagePanelRuntimeState,
    ImageAspectRatioOption,
    ImageBatchSizeOption,
    ImageModelOutputPolicy
} from '../../entities';

export interface ImageOutputSettingsSectionProps {
    aspectRatio?: ImageAspectRatio;
    batchSize?: number;
    outputPolicy: ImageModelOutputPolicy;
    onAspectRatioChange: (value: ImageAspectRatio) => void;
    onBatchSizeChange: (value: number) => void;
}

export interface ImagePanelSchemaEvaluator {
    schema: ImagePanelSchema;
    canGenerate: (state: ImagePanelRuntimeState) => boolean;
    normalizeConfig: (model: string, config: ImageGenerationConfig) => Partial<ImageGenerationConfig> | null;
    evaluateRequirement: (
        requirement: ImagePanelGenerationRequirement,
        state: ImagePanelRuntimeState
    ) => boolean;
}
