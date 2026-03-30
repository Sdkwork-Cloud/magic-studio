import React, { useState } from 'react';
import { Sparkles, X, MessageSquare, Trash2, Plus, LayoutPanelLeft } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useChatStore } from '../store/chatStore';
import { MessageList } from './MessageList';
import ChatInput from './ChatInput';
import { ChatMode } from '../entities/chat.entity';

interface EmbeddedChatPaneProps {
  getContext: () => string;
  onInsert?: (text: string) => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EmbeddedChatPane: React.FC<EmbeddedChatPaneProps> = ({
  getContext,
  onInsert,
  onClose,
  className = '',
  style,
}) => {
  const { t } = useTranslation();
  const {
    currentSession,
    sendMessage,
    createSession,
    sessions,
    selectSession,
    deleteSession,
    activeSessionId,
    isGenerating,
  } = useChatStore();

  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState<ChatMode>('AGENT');
  const [model, setModel] = useState('gpt-4o');

  const handleSend = async (text: string) => {
    if (!activeSessionId) {
      createSession(model);
    }

    const context = getContext();
    await sendMessage(text, model, context);
  };

  const handleNewChat = () => {
    createSession(model);
    setShowHistory(false);
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    setShowHistory(false);
  };

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans ${className}`}
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--theme-primary-500)_10%,transparent),transparent_58%),radial-gradient(circle_at_left,color-mix(in_srgb,var(--text-primary)_5%,transparent),transparent_68%)] opacity-80" />

      <div
        className={`
          app-surface-subtle app-floating-panel absolute top-0 left-0 z-30 flex h-full flex-col border-r border-[var(--border-color)] transition-all duration-300 ease-in-out
          ${showHistory ? 'w-[260px] translate-x-0 shadow-2xl' : 'w-[260px] -translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Chat History
          </span>
          <button onClick={() => setShowHistory(false)} className="app-header-action rounded-xl p-1.5">
            <X size={14} />
          </button>
        </div>

        <div className="app-ghost-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`
                group flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors
                ${
                  activeSessionId === session.id
                    ? 'app-surface-strong border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_8%,var(--bg-panel-strong))] text-[var(--text-primary)] shadow-sm'
                    : 'border-transparent text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare
                  size={14}
                  className={activeSessionId === session.id ? 'text-primary-500' : 'opacity-50'}
                />
                <span className="truncate">{session.title}</span>
              </div>
              <button
                onClick={event => {
                  event.stopPropagation();
                  deleteSession(session.id);
                }}
                className="app-button-danger rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border-color)] p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] py-2 text-xs font-medium text-[var(--bg-panel-strong)] transition-colors hover:bg-primary-600 hover:text-white"
          >
            <Plus size={14} /> {t('copilot.new_chat')}
          </button>
        </div>
      </div>

      <div
        className={`relative z-10 flex h-full min-h-0 flex-1 flex-col transition-transform duration-300 ${showHistory ? 'translate-x-[260px] opacity-40 pointer-events-none' : ''}`}
        onClick={() => {
          if (showHistory) setShowHistory(false);
        }}
      >
        <div className="app-header-glass flex h-12 flex-none items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={event => {
                event.stopPropagation();
                setShowHistory(!showHistory);
              }}
              className={`app-header-action rounded-xl p-1.5 transition-colors ${showHistory ? 'bg-[color-mix(in_srgb,var(--theme-primary-500)_14%,transparent)] text-primary-500' : ''}`}
              title="View Sessions"
            >
              <LayoutPanelLeft size={16} />
            </button>

            <div className="h-4 w-px bg-[var(--border-color)]" />

            <div className="flex items-center gap-2">
              <div
                className="app-status-icon flex h-7 w-7 items-center justify-center rounded-xl shadow-sm"
                data-tone={mode === 'AGENT' ? 'primary' : 'success'}
              >
                <Sparkles size={12} />
              </div>
              <div className="flex flex-col">
                <div className="flex cursor-default items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  {currentSession?.title || t('copilot.title')}
                  <span className="app-status-pill" data-tone={mode === 'AGENT' ? 'primary' : 'success'}>
                    {mode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="app-header-action rounded-xl p-1.5 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <MessageList
          messages={currentSession?.messages || []}
          isTyping={isGenerating}
          onInsert={onInsert}
        />

        <ChatInput
          onSend={handleSend}
          disabled={isGenerating}
          mode={mode}
          setMode={setMode}
          model={model}
          setModel={setModel}
        />
      </div>
    </div>
  );
};
