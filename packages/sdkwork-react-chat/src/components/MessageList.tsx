import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
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
    <div className="app-ghost-scrollbar flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center pb-20 text-[var(--text-muted)] select-none">
          <div className="app-surface-strong mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <div
              className="app-status-icon flex h-10 w-10 items-center justify-center rounded-full"
              data-tone="primary"
            >
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-sm">How can I help you today?</p>
        </div>
      )}

      {messages.map(message => (
        <ChatBubble key={message.id} message={message} onInsert={onInsert} />
      ))}

      {isTyping && (
        <div className="mb-6 animate-in fade-in px-0.5">
          <div className="app-status-pill w-fit" data-tone="primary">
            Assistant
          </div>
          <div className="mt-2 flex h-6 items-center gap-1.5">
            <span className="app-status-dot animate-bounce [animation-delay:-0.3s]" data-tone="muted" />
            <span className="app-status-dot animate-bounce [animation-delay:-0.15s]" data-tone="muted" />
            <span className="app-status-dot animate-bounce" data-tone="primary" />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
