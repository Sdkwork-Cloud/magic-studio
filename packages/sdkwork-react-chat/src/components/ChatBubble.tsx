import React from 'react';
import { Copy, ArrowLeftToLine, RefreshCw, ThumbsUp } from 'lucide-react';
import { platform } from '@sdkwork/react-core';
import { ChatMessage } from '../entities';

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
    <div className="group mb-6 flex w-full flex-col animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="mb-2 flex items-center gap-2 px-0.5 opacity-90 select-none">
        <span
          className={`app-status-pill ${isAi ? '' : 'text-[var(--text-muted)]'}`}
          data-tone={isAi ? 'primary' : 'neutral'}
        >
          {isAi ? 'Gemini' : 'You'}
        </span>
        {message.model && isAi && (
          <span className="app-surface-subtle rounded-full px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
            {message.model}
          </span>
        )}
      </div>

      <div
        className={`whitespace-pre-wrap break-words text-sm leading-7 ${
          isAi
            ? 'pl-0 text-[var(--text-primary)]'
            : 'app-surface-strong rounded-2xl px-4 py-3 text-[var(--text-primary)] shadow-sm'
        }`}
      >
        {message.content}

        {message.status === 'streaming' && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse align-middle bg-primary-500" />
        )}

        {message.status === 'error' && (
          <div className="app-banner mt-3 text-xs" data-tone="danger">
            Error: {message.error}
          </div>
        )}
      </div>

      {isAi && message.status === 'completed' && (
        <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {onInsert && (
            <button
              onClick={() => onInsert(message.content)}
              className="app-surface-subtle flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-primary-500/30 hover:text-primary-500"
              title="Insert at cursor"
            >
              <ArrowLeftToLine size={12} />
              <span>Insert</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="app-surface-subtle rounded-xl p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            title="Copy"
          >
            <Copy size={12} />
          </button>

          <div className="flex-1" />

          <button className="app-header-action rounded-xl p-1.5">
            <ThumbsUp size={12} />
          </button>
          <button className="app-header-action rounded-xl p-1.5">
            <RefreshCw size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
