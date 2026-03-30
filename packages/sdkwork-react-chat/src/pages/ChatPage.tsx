import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, PanelLeft, Sparkles } from 'lucide-react';
import { Button } from '@sdkwork/react-commons';
import { useRouter } from '@sdkwork/react-core';
import { ChatInput } from '../components/ChatInput';
import { MessageBubble } from '../components/MessageBubble';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatMode } from '../entities';
import { useChatStore } from '../store/chatStore';

const ChatPage: React.FC = () => {
  const { currentSession, isGenerating, sendMessage } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { navigate } = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isGenerating]);

  const handleSend = (text: string, _mode: ChatMode, model: string) => {
    sendMessage(text, model);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--theme-primary-500)_12%,transparent),transparent_58%),radial-gradient(circle_at_left,color-mix(in_srgb,var(--text-primary)_6%,transparent),transparent_68%)] opacity-80" />
      <ChatSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        <div className="absolute left-4 top-4 z-10">
          <div className="app-floating-panel flex items-center gap-1 rounded-2xl p-1">
            <Button
              className="app-header-action h-10 w-10 rounded-xl p-0 transition-colors"
              onClick={() => navigate('/')}
              size="sm"
              title="Go Back"
              type="button"
              variant="ghost"
            >
              <ArrowLeft size={18} />
            </Button>
            <Button
              className="app-header-action h-10 w-10 rounded-xl p-0 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              size="sm"
              title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
              type="button"
              variant="ghost"
            >
              <PanelLeft size={18} />
            </Button>
          </div>
        </div>

        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <div className="app-floating-panel flex items-center gap-3 rounded-full px-3 py-2 text-xs">
            <span className="app-status-pill" data-tone="primary">
              GPT-4o
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Model
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="app-surface-strong mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--theme-primary-500),var(--theme-primary-700))] text-white shadow-lg shadow-primary-900/20">
                  <Sparkles size={28} />
                </div>
              </div>
              <span className="app-status-pill mb-4" data-tone="primary">
                Assistant
              </span>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                How can I help you today?
              </h2>
              <p className="max-w-md text-sm text-[var(--text-muted)]">
                Ask a question, plan a task, or continue an existing conversation without leaving
                the aligned shell.
              </p>
            </div>
          ) : (
            <div className="flex flex-col pb-4 pt-20">
              {currentSession.messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        <div className="flex-none bg-gradient-to-t from-[var(--bg-app)] via-[color-mix(in_srgb,var(--bg-app)_84%,transparent)] to-transparent pt-12">
          <ChatInput disabled={isGenerating} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
