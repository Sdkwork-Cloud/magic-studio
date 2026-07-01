
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth">
      {messages.map(msg => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      
      {isTyping && (
           <div className="flex flex-col gap-1.5 animate-in fade-in px-0.5">
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

export default MessageList;
