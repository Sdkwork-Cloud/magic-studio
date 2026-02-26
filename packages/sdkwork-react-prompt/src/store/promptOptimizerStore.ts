import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
    PromptType, 
    OptimizationMode, 
    PromptOptimizationResult, 
    PromptTemplate,
    ChatContext,
    ChatMessage
} from '../types';
import { generateUUID } from '@sdkwork/react-commons';
import { 
    DEFAULT_IMAGE_PROMPT_TEMPLATES, 
    DEFAULT_VIDEO_PROMPT_TEMPLATES 
} from '../constants';

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
    removeTemplate: (id: string) => void;
    
    initChatContext: (type: PromptType) => void;
    addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
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
    templates: [...DEFAULT_IMAGE_PROMPT_TEMPLATES, ...DEFAULT_VIDEO_PROMPT_TEMPLATES],
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
                set({ templates: [...get().templates.filter(t => t.type !== type), ...templates] });
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
            
            setResult: (result) => set({ result }),
            
            addToHistory: (result) => set((state) => ({
                history: [result, ...state.history].slice(0, 50)
            })),
            
            clearHistory: () => set({ history: [] }),
            
            addTemplate: (template) => set((state) => ({
                templates: [...state.templates, template]
            })),
            
            removeTemplate: (id) => set((state) => ({
                templates: state.templates.filter(t => t.id !== id)
            })),
            
            initChatContext: (type) => set({
                chatContext: {
                    sessionId: generateUUID(),
                    messages: [],
                    optimizationType: type,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            }),
            
            addChatMessage: (message) => set((state) => {
                if (!state.chatContext) return state;
                return {
                    chatContext: {
                        ...state.chatContext,
                        messages: [
                            ...state.chatContext.messages,
                            {
                                ...message,
                                id: generateUUID(),
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
        }
    )
);

export type { PromptOptimizerStore };
