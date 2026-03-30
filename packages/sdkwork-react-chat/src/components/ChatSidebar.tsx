
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTranslation } from '@sdkwork/react-i18n';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen }) => {
  const { sessions, activeSessionId, createSession, selectSession, deleteSession } = useChatStore();
  const { t } = useTranslation();
  
  // Group sessions by date could be implemented here
  
  return (
    <div className={`
        flex-none flex flex-col h-full bg-[#18181b] border-r border-[#27272a] transition-all duration-300
        ${isOpen ? 'w-[260px]' : 'w-0 overflow-hidden opacity-0'}
    `}>
        {/* Header */}
        <div className="p-3 flex-none">
            <button 
                onClick={() => createSession()}
                className="flex items-center justify-between w-full px-3 py-2 bg-transparent hover:bg-[#27272a] border border-[#333] rounded-lg text-sm text-gray-200 transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>{t('copilot.new_chat')}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] border border-[#444] px-1.5 py-0.5 rounded text-gray-500">?N</span>
                </div>
            </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            {sessions.map(session => (
                <div 
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`
                        group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all border border-transparent
                        ${activeSessionId === session.id 
                            ? 'bg-[#27272a] text-white' 
                            : 'text-gray-400 hover:bg-[#212124] hover:text-gray-200'
                        }
                    `}
                >
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <span className="truncate">{session.title}</span>
                    </div>
                    {activeSessionId === session.id && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                            className="text-gray-500 hover:text-red-400 p-1 rounded"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            ))}

            {sessions.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-600">
                    No history
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#27272a] flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                 U
             </div>
             <div className="flex-1 min-w-0">
                 <div className="text-xs font-medium text-white truncate">User</div>
                 <div className="text-[10px] text-gray-500 truncate">Pro Plan</div>
             </div>
        </div>
    </div>
  );
};

export default ChatSidebar;
export { ChatSidebar };
