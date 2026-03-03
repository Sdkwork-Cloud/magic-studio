
import React from 'react';
import { EmbeddedChatPane } from '@sdkwork/react-chat';
import { useChatPPTStore } from '../store/chatPPTStore';
import { platform } from '@sdkwork/react-core';

export const PPTChatPane: React.FC = () => {
    const { activePresentation, generateSlidesFromPrompt } = useChatPPTStore();

    const getContext = () => {
        if (!activePresentation) return "No active presentation.";
        return `Current Presentation: ${activePresentation.title}\nSlide Count: ${activePresentation.slides.length}`;
    };

    const handleInsert = (text: string) => {
        // Just copy to clipboard for now in this context, or maybe insert to notes
        platform.copy(text);
    };
    
    // In a real implementation, we would hook up the onSend to intercept specific commands
    // For now, we rely on the user using the "Generate" button logic which we simulate via a custom tool call in a real agent system.
    // Here we just provide the chat UI.
    
    return (
        <div className="h-full w-full border-l border-[#27272a]">
            <EmbeddedChatPane 
                getContext={getContext}
                onInsert={handleInsert}
                className="bg-[#111113]"
            />
        </div>
    );
};
