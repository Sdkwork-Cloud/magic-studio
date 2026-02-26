
import React from 'react';
import { Editor } from '@tiptap/react';
import { EmbeddedChatPane } from '@sdkwork/react-chat';

interface NoteChatPaneProps {
    editor: Editor;
    onClose: () => void;
}

export const NoteChatPane: React.FC<NoteChatPaneProps> = ({ editor, onClose }) => {
    
    // Callback to get fresh context when message is sent
    const getContext = () => {
        return editor.getText();
    };

    const handleInsert = (text: string) => {
        editor.chain().focus().insertContent(text).run();
    };

    return (
        <div className="h-full w-full border-l border-[#27272a] bg-[#111113]">
            <EmbeddedChatPane 
                getContext={getContext}
                onInsert={handleInsert}
                onClose={onClose}
                className="w-full h-full"
            />
        </div>
    );
};
