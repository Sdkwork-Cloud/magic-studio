
import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import ChatSidebar from '../components/ChatSidebar';
import ChatInput, { ChatMode } from '../components/ChatInput';
import { MessageBubble } from '../components/MessageBubble';
import { PanelLeft, Sparkles, MessageSquare } from 'lucide-react';

const ChatPage: React.FC = () => {
    const { currentSession, isGenerating, sendMessage } = useChatStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSession?.messages, isGenerating]);

    const handleSend = (text: string, mode: ChatMode, model: string) => {
        sendMessage(text, model);
    };

    return (
        <div className="flex w-full h-full bg-[#212121] text-gray-100 overflow-hidden relative">
            {/* Sidebar */}
            <ChatSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-[#212121] relative">
                
                {/* Header Toggle */}
                <div className="flex-none p-3 absolute top-0 left-0 z-10">
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                        title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    >
                        <PanelLeft size={20} />
                    </button>
                </div>

                {/* Model Selector (Floating Top) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                     <button className="flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#383838] rounded-lg text-sm font-medium text-gray-200 transition-colors shadow-sm cursor-pointer">
                         <span>GPT-4o</span>
                         <span className="text-xs text-gray-500">▼</span>
                     </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto scroll-smooth">
                    {!currentSession || currentSession.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center mb-6">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                        </div>
                    ) : (
                        <div className="flex flex-col pb-4 pt-16">
                            {currentSession.messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="flex-none bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10">
                    <ChatInput 
                        onSend={handleSend} 
                        disabled={isGenerating} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
