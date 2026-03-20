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
    <div className="relative flex h-full w-full overflow-hidden bg-[#212121] text-gray-100">
      <ChatSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="relative flex h-full min-w-0 flex-1 flex-col bg-[#212121]">
        <div className="absolute left-0 top-0 z-10 flex flex-none items-center gap-2 p-3">
          <Button
            className="h-10 w-10 p-0 text-gray-400 transition-colors hover:bg-[#333] hover:text-white"
            onClick={() => navigate('/')}
            size="sm"
            title="Go Back"
            type="button"
            variant="ghost"
          >
            <ArrowLeft size={20} />
          </Button>
          <Button
            className="h-10 w-10 p-0 text-gray-400 transition-colors hover:bg-[#333] hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="sm"
            title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
            type="button"
            variant="ghost"
          >
            <PanelLeft size={20} />
          </Button>
        </div>

        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <Button
            className="flex items-center gap-2 rounded-lg bg-[#2f2f2f] px-3 py-1.5 text-sm font-medium text-gray-200 shadow-sm transition-colors hover:bg-[#383838]"
            size="sm"
            type="button"
            variant="ghost"
          >
            <span>GPT-4o</span>
            <span className="text-xs text-gray-500">v</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#333]">
                <Sparkles className="text-white" size={32} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">How can I help you today?</h2>
            </div>
          ) : (
            <div className="flex flex-col pb-4 pt-16">
              {currentSession.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        <div className="flex-none bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10">
          <ChatInput disabled={isGenerating} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
