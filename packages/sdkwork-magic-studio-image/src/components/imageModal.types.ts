import type { GenerationResultSelection } from '@sdkwork/magic-studio-generation-history';

import type { GenerationConfig } from '../services';

export interface AIImageGeneratorModalProps {
    contextText?: string;
    config?: Partial<GenerationConfig>;
    onClose: () => void;
    onSuccess: (result: GenerationResultSelection | GenerationResultSelection[]) => void;
    multiSelect?: boolean;
}

export interface ImageGeneratorModalProps {
    onClose: () => void;
    onSuccess: (selection: GenerationResultSelection) => void;
    actionLabel?: string;
}
