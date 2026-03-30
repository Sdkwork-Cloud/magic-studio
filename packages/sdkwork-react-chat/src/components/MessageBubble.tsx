
import React from 'react';
import { ChatMessage } from '../entities';
import { User, Sparkles, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`group w-full text-gray-100 border-b border-black/5 dark:border-white/5 ${isUser ? 'bg-transparent' : 'bg-transparent'}`}>
            <div className="max-w-3xl mx-auto px-4 py-8 flex gap-5">
                {/* Avatar */}
                <div className="flex-none flex flex-col relative items-end">
                    {isUser ? (
                        <div className="w-8 h-8 bg-[#333] rounded-full flex items-center justify-center text-gray-300">
                            <User size={16} />
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                            <Sparkles size={16} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-hidden">
                    {/* Name */}
                    <div className="font-bold text-sm mb-1 opacity-90 select-none">
                        {isUser ? 'You' : 'Assistant'}
                    </div>

                    {/* Text Body */}
                    <div className="prose prose-invert prose-sm max-w-none leading-7 whitespace-pre-wrap">
                        {message.content || (
                             message.status === 'streaming' && <span className="animate-pulse">●</span>
                        )}
                        {message.status === 'error' && (
                            <div className="text-red-400 text-sm border border-red-900/50 bg-red-900/20 p-2 rounded mt-2">
                                Error: {message.error}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions (AI Only) */}
                    {!isUser && message.status === 'completed' && (
                        <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
    <button className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-[#333] rounded-md transition-colors">
        {icon}
    </button>
);
