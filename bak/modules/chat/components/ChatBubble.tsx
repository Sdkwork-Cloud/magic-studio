
import React from 'react';
import { ChatMessage } from '../entities/chat.entity';
import { Copy, ArrowLeftToLine, RefreshCw, ThumbsUp } from 'lucide-react';
import { platform } from '../../../platform';

interface ChatBubbleProps {
  message: ChatMessage;
  onInsert?: (text: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onInsert }) => {
  const isAi = message.role === 'ai';

  const handleCopy = () => {
    platform.copy(message.content);
  };

  return (
    <div className={`flex flex-col w-full animate-in fade-in slide-in-from-bottom-1 duration-200 group mb-6`}>
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-1.5 px-0.5 opacity-90 select-none">
         <span className={`
            text-[11px] font-bold uppercase tracking-wider
            ${isAi ? 'text-indigo-400' : 'text-gray-500'}
         `}>
             {isAi ? 'Gemini' : 'You'}
         </span>
         {message.model && isAi && (
            <span className="text-[10px] text-gray-600 bg-[#252526] px-1 rounded border border-[#333]">
                {message.model}
            </span>
         )}
      </div>

      {/* Content Block */}
      <div className={`
          text-sm leading-7 whitespace-pre-wrap break-words
          ${isAi 
             ? 'text-gray-300 pl-0' 
             : 'bg-[#252526] text-gray-100 border border-[#333] rounded-md px-3 py-2.5'
          }
      `}>
          {message.content}
          
          {message.status === 'streaming' && (
              <span className="inline-block w-1.5 h-4 bg-indigo-500 ml-1 animate-pulse align-middle" />
          )}

          {message.status === 'error' && (
             <div className="mt-2 p-2 bg-red-900/20 border border-red-900/50 text-red-400 text-xs rounded">
                 Error: {message.error}
             </div>
          )}
      </div>

      {/* Footer Actions (AI Only) */}
      {isAi && message.status === 'completed' && (
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onInsert && (
                <button 
                    onClick={() => onInsert(message.content)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#252526] hover:bg-[#333] text-gray-400 hover:text-blue-400 rounded text-xs border border-[#333] transition-colors"
                    title="Insert at cursor"
                >
                    <ArrowLeftToLine size={12} />
                    <span>Insert</span>
                </button>
            )}
            
            <button 
                onClick={handleCopy}
                className="p-1.5 bg-[#252526] hover:bg-[#333] text-gray-400 hover:text-white rounded border border-[#333] transition-colors"
                title="Copy"
            >
                <Copy size={12} />
            </button>
            
            <div className="flex-1" />
            
            <button className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors">
                <ThumbsUp size={12} />
            </button>
             <button className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors">
                <RefreshCw size={12} />
            </button>
        </div>
      )}
    </div>
  );
};
