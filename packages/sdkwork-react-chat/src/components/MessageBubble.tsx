import React from 'react';
import { User, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../entities';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className="group w-full border-b border-[color-mix(in_srgb,var(--border-color)_70%,transparent)]">
      <div className="mx-auto flex max-w-3xl gap-5 px-4 py-8">
        <div className="relative flex flex-none flex-col items-end">
          {isUser ? (
            <div className="app-surface-subtle flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] shadow-sm">
              <User size={16} />
            </div>
          ) : (
            <div
              className="app-status-icon flex h-9 w-9 items-center justify-center rounded-full shadow-lg"
              data-tone="primary"
            >
              <Sparkles size={16} />
            </div>
          )}
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="mb-2 flex items-center gap-2 select-none">
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {isUser ? 'You' : 'Assistant'}
            </span>
            {!isUser && (
              <span className="app-status-pill" data-tone="primary">
                AI
              </span>
            )}
          </div>

          <div
            className={`max-w-none whitespace-pre-wrap break-words text-sm leading-7 ${
              isUser
                ? 'app-surface-strong rounded-2xl px-4 py-3 text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {message.content ||
              (message.status === 'streaming' && (
                <span className="animate-pulse text-primary-500">...</span>
              ))}
            {message.status === 'error' && (
              <div className="app-banner mt-3 text-sm" data-tone="danger">
                Error: {message.error}
              </div>
            )}
          </div>

          {!isUser && message.status === 'completed' && (
            <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <ActionButton icon={<Copy size={14} />} />
              <ActionButton icon={<RefreshCw size={14} />} />
              <div className="flex-1" />
              <ActionButton icon={<ThumbsUp size={14} />} />
              <ActionButton icon={<ThumbsDown size={14} />} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon }: { icon: React.ReactNode }) => (
  <button className="app-header-action rounded-xl p-1.5">{icon}</button>
);
