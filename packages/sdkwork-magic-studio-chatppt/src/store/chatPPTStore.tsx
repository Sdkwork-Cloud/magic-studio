
import { Presentation, Slide } from '../entities';
import { chatPPTBusinessService } from '../services';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { matchesEntityKey, resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import { normalizePresentation, normalizePresentationSlide } from '../services/presentationIdentity';
import {
    findPresentationByKey,
    removePresentationByKey,
    replacePresentationByKey,
} from './presentationIdentity';

interface ChatPPTStoreContextType {
    presentations: Presentation[];
    activePresentationKey: string | null;
    activeSlideIndex: number;
    activePresentation: Presentation | null;
    currentSlide: Slide | null;
    
    createPresentation: (title: string) => Promise<void>;
    selectPresentation: (id: string) => void;
    deletePresentation: (id: string) => Promise<void>;
    
    addSlide: (layout?: Slide['layout']) => Promise<void>;
    updateSlide: (slideId: string, updates: Partial<Slide>) => Promise<void>;
    selectSlide: (index: number) => void;
    
    generateSlidesFromPrompt: (prompt: string) => Promise<void>;
    isGenerating: boolean;
}

const ChatPPTStoreContext = createContext<ChatPPTStoreContextType | undefined>(undefined);

export const ChatPPTStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [activePresentationKey, setActivePresentationKey] = useState<string | null>(null);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    // Load History
    useEffect(() => {
        const load = async () => {
            const result = await chatPPTBusinessService.chatPPTService.findAll({ page: 0, size: 50 });
            if (result.success && result.data) {
                const normalized = result.data.content.map(normalizePresentation);
                setPresentations(normalized);
                if (normalized.length > 0 && !activePresentationKey) {
                    setActivePresentationKey(resolveEntityKey(normalized[0]));
                }
            }
        };
        load();
    }, []);

    const activePresentation = activePresentationKey
        ? findPresentationByKey(presentations, activePresentationKey)
        : null;
    const currentSlide = activePresentation ? activePresentation.slides[activeSlideIndex] : null;

    const createPresentation = async (title: string) => {
        const res = await chatPPTBusinessService.chatPPTService.createPresentation(title);
        if (res.success && res.data) {
            const normalized = normalizePresentation(res.data);
            setPresentations(prev => [normalized, ...prev]);
            setActivePresentationKey(resolveEntityKey(normalized));
            setActiveSlideIndex(0);
        }
    };

    const deletePresentation = async (presentationKey: string) => {
        await chatPPTBusinessService.chatPPTService.deleteById(presentationKey);
        setPresentations(prev => removePresentationByKey(prev, presentationKey));
        if (activePresentation && matchesEntityKey(activePresentation, presentationKey)) setActivePresentationKey(null);
    };

    const selectPresentation = (presentationKey: string) => {
        setActivePresentationKey(presentationKey);
        setActiveSlideIndex(0);
    };

    const addSlide = async (layout: Slide['layout'] = 'bullet-points') => {
        if (!activePresentationKey) return;
        const res = await chatPPTBusinessService.chatPPTService.addSlide(activePresentationKey, layout);
        if (res.success && res.data) {
             const normalized = normalizePresentation(res.data);
             setPresentations(prev => replacePresentationByKey(prev, activePresentationKey, normalized));
             setActiveSlideIndex(normalized.slides.length - 1);
        }
    };

    const updateSlide = async (slideId: string, updates: Partial<Slide>) => {
        if (!activePresentationKey) return;
        const result = await chatPPTBusinessService.chatPPTService.updateSlide(
            activePresentationKey,
            slideId,
            updates,
        );
        if (result.success && result.data) {
            const normalized = normalizePresentation(result.data);
            setPresentations(prev => replacePresentationByKey(prev, activePresentationKey, normalized));
        }
    };

    const selectSlide = (index: number) => {
        setActiveSlideIndex(index);
    };

    const generateSlidesFromPrompt = async (prompt: string) => {
        if (!activePresentationKey) return;
        setIsGenerating(true);
        try {
            await chatPPTBusinessService.chatPPTService.generateSlidesFromPrompt(
                activePresentationKey,
                prompt,
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <ChatPPTStoreContext.Provider value={{
            presentations, activePresentationKey, activeSlideIndex, activePresentation, currentSlide,
            createPresentation, selectPresentation, deletePresentation,
            addSlide, updateSlide, selectSlide,
            generateSlidesFromPrompt, isGenerating
        }}>
            {children}
        </ChatPPTStoreContext.Provider>
    );
};

export const useChatPPTStore = () => {
    const context = useContext(ChatPPTStoreContext);
    if (!context) throw new Error('useChatPPTStore must be used within ChatPPTStoreProvider');
    return context;
};

