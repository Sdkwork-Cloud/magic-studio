
import React from 'react';
import { ChatMessage } from '../../types';
import MessageContent from './MessageContent';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAi = message.role === 'assistant';

  return (
    <div className={`flex flex-col w-full animate-in fade-in slide-in-from-bottom-1 duration-200 group`}>
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-1.5 px-0.5 opacity-90 select-none">
         <span className={`
            text-[11px] font-bold uppercase tracking-wider
            ${isAi ? 'text-indigo-400' : 'text-gray-500'}
         `}>
             {isAi ? 'Gemini' : 'You'}
         </span>
      </div>

      {/* Content Block */}
      <div className={`
          text-sm leading-relaxed
          ${isAi 
             ? 'text-gray-300 pl-0' // AI is plain text
             : 'bg-[#252526] text-gray-100 border border-[#333] rounded-md px-3 py-2.5' // User is a block
          }
      `}>
          <MessageContent message={message} />
      </div>
    </div>
  );
};

export default ChatBubble;
