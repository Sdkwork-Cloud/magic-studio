
import React from 'react';
import { EmbeddedChatPane } from '@sdkwork/magic-studio-chat/embedded-pane';
import { useChatPPTStore } from '../store/chatPPTStore';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';

export const PPTChatPane: React.FC = () => {
    const runtime = getPlatformRuntime();
    const { activePresentation } = useChatPPTStore();

    const getContext = () => {
        if (!activePresentation) return "No active presentation.";
        return `Current Presentation: ${activePresentation.title}\nSlide Count: ${activePresentation.slides.length}`;
    };

    const handleInsert = (text: string) => {
        // Just copy to clipboard for now in this context, or maybe insert to notes
        void runtime.clipboard.copy(text);
    };
    
    // Chat stays presentation-aware here; generation actions are owned by the PPT workflow.
    
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
