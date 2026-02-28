
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../entities';
import { ChatBubble } from './ChatBubble';

interface MessageListProps {
  messages: ChatMessage[];
  onInsert?: (text: string) => void;
  isTyping?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, onInsert, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth custom-scrollbar">
      {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 pb-20 select-none">
              <p className="text-sm">How can I help you today?</p>
          </div>
      )}
      
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} onInsert={onInsert} />
      ))}
      
       {isTyping && (
           <div className="flex flex-col gap-1.5 animate-in fade-in px-0.5 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Gemini</span>
              <div className="flex items-center gap-1.5 h-6">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
              </div>
           </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
