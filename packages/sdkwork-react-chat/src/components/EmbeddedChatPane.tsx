
import React, { useState } from 'react';
import { 
    Sparkles, X, MessageSquare, 
    Trash2, Plus, LayoutPanelLeft 
} from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import { useChatStore } from '../store/chatStore';
import { MessageList } from './MessageList';
import ChatInput from './ChatInput';
import { ChatMode } from '../entities/chat.entity';

interface EmbeddedChatPaneProps {
    /** 
     * Function to retrieve current context (code, note content) 
     * Called when sending a message.
     */
    getContext: () => string;
    
    /**
     * Callback when user clicks "Insert" on a code block or message.
     */
    onInsert?: (text: string) => void;
    
    /**
     * Optional close handler if used in a modal/overlay
     */
    onClose?: () => void;
    
    className?: string;
    style?: React.CSSProperties;
}

export const EmbeddedChatPane: React.FC<EmbeddedChatPaneProps> = ({ 
    getContext, 
    onInsert, 
    onClose,
    className = '',
    style
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
      isGenerating
  } = useChatStore();

  const [showHistory, setShowHistory] = useState(false);
  
  // Chat Context State
  const [mode, setMode] = useState<ChatMode>('AGENT');
  const [model, setModel] = useState('gpt-4o');

  const handleSend = async (text: string) => {
    // If no session active, create one
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
        className={`flex flex-col h-full w-full bg-[#111113] text-gray-300 font-sans relative overflow-hidden ${className}`}
        style={style}
    >
      
      {/* --- Session History Sidebar (Slide Over) --- */}
      <div 
        className={`
            absolute top-0 left-0 h-full bg-[#18181b] border-r border-[#27272a] z-30 transition-all duration-300 ease-in-out flex flex-col
            ${showHistory ? 'w-[260px] translate-x-0 shadow-2xl' : 'w-[260px] -translate-x-full'}
        `}
      >
          <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chat History</span>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white">
                  <X size={14} />
              </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {sessions.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`
                        group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors border border-transparent
                        ${activeSessionId === session.id 
                            ? 'bg-[#27272a] text-white border-[#333]' 
                            : 'text-gray-400 hover:bg-[#1e1e1f] hover:text-gray-200'
                        }
                    `}
                  >
                      <div className="flex items-center gap-3 overflow-hidden">
                          <MessageSquare size={14} className={activeSessionId === session.id ? 'text-blue-400' : 'opacity-50'} />
                          <span className="truncate">{session.title}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                      >
                          <Trash2 size={12} />
                      </button>
                  </div>
              ))}
          </div>

          <div className="p-3 border-t border-[#27272a]">
              <button 
                onClick={handleNewChat}
                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors"
              >
                  <Plus size={14} /> {t('copilot.new_chat')}
              </button>
          </div>
      </div>

      {/* --- Main Chat Area --- */}
      <div 
        className={`flex-1 flex flex-col h-full min-h-0 transition-transform duration-300 ${showHistory ? 'translate-x-[260px] opacity-40 pointer-events-none' : ''}`}
        onClick={() => { if(showHistory) setShowHistory(false); }} 
      >
          {/* Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-[#27272a] bg-[#18181b] shadow-sm flex-none">
            <div className="flex items-center gap-3">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                    className={`p-1.5 rounded-md transition-colors ${showHistory ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#27272a] hover:text-white'}`}
                    title="View Sessions"
                >
                    <LayoutPanelLeft size={16} />
                </button>
                
                <div className="h-4 w-[1px] bg-[#333]" />

                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-lg transition-colors ${mode === 'AGENT' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                        <Sparkles size={12} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-xs font-bold text-white cursor-default">
                            {currentSession?.title || t('copilot.title')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>
          </div>

          {/* Messages List */}
          <MessageList 
            messages={currentSession?.messages || []} 
            isTyping={isGenerating} 
            onInsert={onInsert}
          />

          {/* Input Area */}
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
