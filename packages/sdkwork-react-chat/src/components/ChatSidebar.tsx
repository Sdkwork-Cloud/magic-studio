import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useChatStore } from '../store/chatStore';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle: _onToggle }) => {
  const { sessions, activeSessionId, createSession, selectSession, deleteSession } = useChatStore();
  const { t } = useTranslation();

  return (
    <div
      className={`
        app-surface-subtle flex h-full flex-none flex-col border-r border-[var(--border-color)] transition-all duration-300
        ${isOpen ? 'w-[260px]' : 'w-0 overflow-hidden opacity-0'}
      `}
    >
      <div className="flex-none p-3">
        <button
          onClick={() => createSession()}
          className="app-surface-strong group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        >
          <div className="flex items-center gap-2">
            <Plus size={16} />
            <span>{t('copilot.new_chat')}</span>
          </div>
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <span className="app-brand-badge text-[10px] font-semibold text-[var(--text-muted)]">
              ?N
            </span>
          </div>
        </button>
      </div>

      <div className="app-ghost-scrollbar flex-1 space-y-1 overflow-y-auto px-2">
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => selectSession(session.id)}
            className={`
              group flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all
              ${
                activeSessionId === session.id
                  ? 'app-surface-strong border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_8%,var(--bg-panel-strong))] text-[var(--text-primary)] shadow-sm'
                  : 'border-transparent text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <div className="flex flex-1 items-center gap-3 overflow-hidden">
              <span className="truncate">{session.title}</span>
            </div>
            {activeSessionId === session.id && (
              <button
                onClick={event => {
                  event.stopPropagation();
                  deleteSession(session.id);
                }}
                className="app-button-danger rounded-lg p-1"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">No history</div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--border-color)] p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--theme-primary-500),var(--theme-primary-700))] text-xs font-bold text-white shadow-lg shadow-primary-900/20">
          U
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-[var(--text-primary)]">User</div>
          <div className="truncate text-[10px] text-[var(--text-muted)]">Pro Plan</div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
export { ChatSidebar };
