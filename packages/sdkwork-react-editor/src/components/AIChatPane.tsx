
import React from 'react';
import { EmbeddedChatPane } from '@sdkwork/react-chat';
import { useEditorStore } from '../store/editorStore';

const AIChatPane: React.FC = () => {
    const { activeFilePath, openFiles, updateFileContent } = useEditorStore();
    
    // Callback to get fresh code context
    const getContext = () => {
        const file = openFiles.find(f => f.path === activeFilePath);
        return file ? `Current File: ${file.path}\n\nCode:\n${file.content || ''}` : '';
    };

    const handleInsert = (text: string) => {
        // In a real Monaco implementation, we would access the editor instance reference
        // and insert at cursor position. 
        // Since we are decoupling, we might need to expose an insertion method in the EditorStore
        // or for now, just copy to clipboard if advanced insertion isn't ready.
        
        // However, generic "Insert" usually implies appending or pasting.
        // For Code Editor, we might assume the user copies it themselves or we find a way to access the active instance.
        // Given existing constraints, we'll rely on the ChatBubble's Copy button primarily,
        // but if we must support insert, we'd need to trigger an event or use a store action.
        
        console.log("Insert requested:", text);
        // Fallback: Copy to clipboard if we can't directly insert via store easily without complex ref forwarding
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="h-full w-full">
            <EmbeddedChatPane 
                getContext={getContext}
                onInsert={handleInsert}
            />
        </div>
    );
};

export default AIChatPane;
export { AIChatPane };
