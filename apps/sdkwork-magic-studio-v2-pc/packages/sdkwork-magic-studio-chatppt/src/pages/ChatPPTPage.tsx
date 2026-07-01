
import { PPTChatPane } from '../components/PPTChatPane'
import { PPTPreview } from '../components/PPTPreview'
import React, { useState, useEffect } from 'react';
;
;

// Reusing Resizer Pattern
const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
    <div className="group relative flex-none w-[1px] h-full bg-[#2b2b2b] z-50 cursor-col-resize hover:bg-blue-500 transition-colors delay-75">
        <div className="absolute inset-y-0 -left-1 -right-1 bg-transparent z-50" onMouseDown={onMouseDown} />
    </div>
);

const ChatPPTPage: React.FC = () => {
    const [chatWidth, setChatWidth] = useState(350);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 280 && newWidth <= 600) setChatWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#111]">
            {/* Middle: Preview */}
            <div className="flex-1 min-w-0 bg-[#09090b]">
                <PPTPreview />
            </div>

            <Resizer onMouseDown={() => setIsResizing(true)} />

            {/* Right: Chat */}
            <div style={{ width: chatWidth }} className="flex-none bg-[#111113]">
                <PPTChatPane />
            </div>
        </div>
    );
};

export default ChatPPTPage;
