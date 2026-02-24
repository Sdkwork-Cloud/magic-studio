
import React from 'react';
import { EmbeddedChatPane } from 'sdkwork-react-chat';
import { useFilmStore } from '../store/filmStore';
import { Bot, PenTool } from 'lucide-react';

export const FilmChatPanel: React.FC = () => {
    const { project, updateScript } = useFilmStore();

    // Provide the current script content as context to the AI
    const getContext = () => {
        return `Current Script Title: ${project.script.title}\n\nContent:\n${project.script.content}`;
    };

    // Allow AI to append or insert content directly into the script
    const handleInsert = (text: string) => {
        // Simple append for now, in a real rich text editor this would insert at cursor
        const newContent = project.script.content 
            ? `${project.script.content}\n\n${text}`
            : text;
        updateScript(newContent);
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#111113] border-l border-[#27272a]">
            {/* Context Header */}
            <div className="flex-none h-10 flex items-center px-4 border-b border-[#27272a] bg-[#18181b] select-none">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Bot size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Screenwriter Co-pilot</span>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 min-h-0">
                <EmbeddedChatPane 
                    getContext={getContext}
                    onInsert={handleInsert}
                    className="bg-[#111113]"
                    // Optional: You could pass a custom "System Prompt" here via props if EmbeddedChatPane supports it
                    // to force the AI to act like a Screenwriter.
                />
            </div>
        </div>
    );
};
