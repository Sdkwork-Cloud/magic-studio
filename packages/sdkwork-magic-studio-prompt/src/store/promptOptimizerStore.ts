import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
    PromptType, 
    OptimizationMode, 
    PromptOptimizationResult, 
    PromptTemplate,
    ChatContext,
    ChatMessage,
    ChatAttachment,
    PromptTemplateVariable
} from '../types';
import { createUuid, deriveClientEntityUuidFromId, matchesEntityKey } from '@sdkwork/magic-studio-types/entity';
import { 
    DEFAULT_IMAGE_PROMPT_TEMPLATES, 
    DEFAULT_VIDEO_PROMPT_TEMPLATES 
} from '../constants';

type PromptIdentityLike = {
    id?: string | null;
    uuid?: string | null;
};

type ChatAttachmentDraft = Omit<ChatAttachment, 'id' | 'uuid'> & Partial<Pick<ChatAttachment, 'id' | 'uuid'>>;
type ChatMessageDraft = Omit<ChatMessage, 'id' | 'uuid' | 'timestamp' | 'attachments'> & {
    attachments?: ChatAttachmentDraft[];
};

const normalizeIdentityValue = (value?: string | null): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const ensureStableIdentity = <T extends PromptIdentityLike>(entity: T): T & { id: string | null; uuid: string } => {
    const normalizedId = normalizeIdentityValue(entity.id);
    const identityKey = normalizeIdentityValue(entity.uuid)
        || (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null)
        || createUuid();

    return {
        ...entity,
        id: normalizedId,
        uuid: identityKey,
    };
};

const normalizePromptOptimizationResult = (
    result: PromptOptimizationResult
): PromptOptimizationResult => ensureStableIdentity(result);

const normalizePromptTemplateVariable = (
    variable: PromptTemplateVariable
): PromptTemplateVariable => ensureStableIdentity(variable);

const normalizePromptTemplate = (template: PromptTemplate): PromptTemplate => {
    const normalizedTemplate = ensureStableIdentity(template);

    return {
        ...normalizedTemplate,
        variables: normalizedTemplate.variables.map(normalizePromptTemplateVariable),
    };
};

const normalizeChatAttachment = (attachment: ChatAttachmentDraft): ChatAttachment => ensureStableIdentity(attachment);

interface PromptOptimizerStore {
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
    chatContext: ChatContext | null;
    
    setType: (type: PromptType) => void;
    setMode: (mode: OptimizationMode) => void;
    setInputText: (text: string) => void;
    setInputImage: (file: File | null) => void;
    setInputVideo: (file: File | null) => void;
    setInputImageUrl: (url: string | null) => void;
    setInputVideoUrl: (url: string | null) => void;
    setIsProcessing: (processing: boolean) => void;
    setResult: (result: PromptOptimizationResult | null) => void;
    addToHistory: (result: PromptOptimizationResult) => void;
    clearHistory: () => void;
    addTemplate: (template: PromptTemplate) => void;
    removeTemplate: (templateKey: string) => void;
    
    initChatContext: (type: PromptType) => void;
    addChatMessage: (message: ChatMessageDraft) => void;
    clearChatContext: () => void;
    
    reset: () => void;
}

const initialState = {
    currentType: 'image' as PromptType,
    currentMode: 'text-to-prompt' as OptimizationMode,
    inputText: '',
    inputImage: null,
    inputVideo: null,
    inputImageUrl: null,
    inputVideoUrl: null,
    isProcessing: false,
    result: null,
    history: [],
    templates: [...DEFAULT_IMAGE_PROMPT_TEMPLATES, ...DEFAULT_VIDEO_PROMPT_TEMPLATES].map(normalizePromptTemplate),
    chatContext: null,
};

export const usePromptOptimizerStore = create<PromptOptimizerStore>()(
    persist(
        (set, get) => ({
            ...initialState,
            
            setType: (type) => {
                set({ currentType: type });
                const templates = type === 'image' 
                    ? DEFAULT_IMAGE_PROMPT_TEMPLATES 
                    : DEFAULT_VIDEO_PROMPT_TEMPLATES;
                set({ templates: [...get().templates.filter(t => t.type !== type), ...templates.map(normalizePromptTemplate)] });
            },
            
            setMode: (mode) => set({ currentMode: mode }),
            
            setInputText: (text) => set({ inputText: text }),
            
            setInputImage: (file) => {
                const oldUrl = get().inputImageUrl;
                if (oldUrl) {
                    URL.revokeObjectURL(oldUrl);
                }
                const newUrl = file ? URL.createObjectURL(file) : null;
                set({ inputImage: file, inputImageUrl: newUrl });
            },
            
            setInputVideo: (file) => {
                const oldUrl = get().inputVideoUrl;
                if (oldUrl) {
                    URL.revokeObjectURL(oldUrl);
                }
                const newUrl = file ? URL.createObjectURL(file) : null;
                set({ inputVideo: file, inputVideoUrl: newUrl });
            },
            
            setInputImageUrl: (url) => set({ inputImageUrl: url }),
            
            setInputVideoUrl: (url) => set({ inputVideoUrl: url }),
            
            setIsProcessing: (processing) => set({ isProcessing: processing }),
            
            setResult: (result) => set({ result: result ? normalizePromptOptimizationResult(result) : null }),
            
            addToHistory: (result) => set((state) => ({
                history: [normalizePromptOptimizationResult(result), ...state.history].slice(0, 50)
            })),
            
            clearHistory: () => set({ history: [] }),
            
            addTemplate: (template) => set((state) => ({
                templates: [...state.templates, normalizePromptTemplate(template)]
            })),
            
            removeTemplate: (templateKey) => set((state) => ({
                templates: state.templates.filter((template) => !matchesEntityKey(template, templateKey))
            })),
            
            initChatContext: (type) => {
                const chatContextUuid = createUuid();

                set({
                    chatContext: {
                        id: null,
                        uuid: chatContextUuid,
                        sessionId: createUuid(),
                        messages: [],
                        optimizationType: type,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                });
            },
            
            addChatMessage: (message) => set((state) => {
                if (!state.chatContext) return state;

                const messageUuid = createUuid();
                return {
                    chatContext: {
                        ...state.chatContext,
                        messages: [
                            ...state.chatContext.messages,
                            {
                                ...message,
                                id: null,
                                uuid: messageUuid,
                                attachments: message.attachments?.map(normalizeChatAttachment),
                                timestamp: new Date(),
                            }
                        ],
                        updatedAt: new Date(),
                    }
                };
            }),
            
            clearChatContext: () => set({ chatContext: null }),
            
            reset: () => {
                const oldImageUrl = get().inputImageUrl;
                const oldVideoUrl = get().inputVideoUrl;
                if (oldImageUrl) URL.revokeObjectURL(oldImageUrl);
                if (oldVideoUrl) URL.revokeObjectURL(oldVideoUrl);
                set(initialState);
            },
        }),
        {
            name: 'prompt-optimizer-store',
            partialize: (state) => ({
                history: state.history,
                templates: state.templates,
            }),
            merge: (persistedState, currentState) => {
                const persisted = (persistedState || {}) as Partial<PromptOptimizerStore>;

                return {
                    ...currentState,
                    ...persisted,
                    history: Array.isArray(persisted.history)
                        ? persisted.history.map(normalizePromptOptimizationResult)
                        : currentState.history,
                    templates: Array.isArray(persisted.templates)
                        ? persisted.templates.map(normalizePromptTemplate)
                        : currentState.templates,
                };
            },
        }
    )
);

export type { PromptOptimizerStore };
