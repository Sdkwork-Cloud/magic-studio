type EntityId = string | null;

export type PromptType = 'image' | 'video';

export type OptimizationMode = 'text-to-prompt' | 'image-to-prompt' | 'video-to-prompt';

export interface PromptOptimizationConfig {
    type: PromptType;
    mode: OptimizationMode;
    inputText?: string;
    inputImage?: File | string;
    inputVideo?: File | string;
    targetStyle?: string;
    additionalInstructions?: string;
}

export interface PromptOptimizationResult {
    id: EntityId;
    uuid: string;
    type: PromptType;
    mode: OptimizationMode;
    originalInput: string;
    optimizedPrompt: string;
    suggestions?: string[];
    createdAt: Date;
}

export interface PromptTemplate {
    id: EntityId;
    uuid: string;
    name: string;
    description: string;
    type: PromptType;
    template: string;
    variables: PromptTemplateVariable[];
}

export interface PromptTemplateVariable {
    id: EntityId;
    uuid: string;
    name: string;
    description: string;
    defaultValue?: string;
    required: boolean;
}

export interface PromptOptimizerState {
    currentType: PromptType;
    currentMode: OptimizationMode;
    inputText: string;
    inputImage: File | null;
    inputVideo: File | null;
    inputImageUrl: string | null;
    inputVideoUrl: string | null;
    isProcessing: boolean;
    result: PromptOptimizationResult | null;
    history: PromptOptimizationResult[];
    templates: PromptTemplate[];
}

export interface ChatContext {
    id: EntityId;
    uuid: string;
    sessionId: string;
    messages: ChatMessage[];
    optimizationType: PromptType;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatMessage {
    id: EntityId;
    uuid: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: ChatAttachment[];
    timestamp: Date;
}

export interface ChatAttachment {
    id: EntityId;
    uuid: string;
    type: 'image' | 'video';
    url: string;
    name?: string;
}
