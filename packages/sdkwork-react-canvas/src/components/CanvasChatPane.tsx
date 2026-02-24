
import React from 'react';
import { EmbeddedChatPane } from 'sdkwork-react-chat';
import { useCanvasStore } from '../store/canvasStore';

export const CanvasChatPane: React.FC = () => {
    const { activeBoard } = useCanvasStore();

    const getContext = () => {
        if (!activeBoard) return "No active canvas.";
        const elementSummary = activeBoard.elements.map(e => `${e.type} at (${e.x},${e.y})`).join('\n');
        return `Current Canvas: ${activeBoard.title}\nElements:\n${elementSummary}`;
    };

    const handleInsert = (text: string) => {
        // If the user clicks insert on a text block, maybe create a sticky note
        // For now, simple copy
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="h-full w-full border-l border-[#27272a] bg-[#111113] flex flex-col">
            <div className="flex-1 min-h-0">
                <EmbeddedChatPane 
                    getContext={getContext}
                    onInsert={handleInsert}
                />
            </div>
        </div>
    );
};
