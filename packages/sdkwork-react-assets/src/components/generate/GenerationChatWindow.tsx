// GenerationChatWindow - A simple chat interface for AI generation
// This is a placeholder component - full implementation should be added

import React, { useState, useRef, useEffect } from 'react';

export interface GenerationTask {
    id: string;
    config: any;
    status: 'pending' | 'completed' | 'failed';
    results?: any[];
    error?: string;
}

export interface GenerationConfig {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: string;
    styleId: string;
    referenceImages?: string[];
    [key: string]: any;
}

export interface GenerationChatWindowProps {
    mode: 'image' | 'video' | 'audio' | 'music' | 'voice' | 'sfx' | 'character';
    title: string;
    onNavigateBack: () => void;
    history: GenerationTask[];
    isGenerating: boolean;
    onDelete: (id: string) => void;
    onReuse: (task: GenerationTask) => void;
    config: GenerationConfig;
    setConfig: (config: Partial<GenerationConfig>) => void;
    onGenerate: () => Promise<void>;
    onUpload?: () => Promise<void>;
    onRemoveReferenceImage?: (index: number) => void;
}

export const GenerationChatWindow: React.FC<GenerationChatWindowProps> = ({
    mode,
    title,
    onNavigateBack,
    history,
    isGenerating,
    onDelete,
    onReuse,
    config,
    setConfig,
    onGenerate,
    onUpload,
    onRemoveReferenceImage
}) => {
    const [input, setInput] = useState(config.prompt || '');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isGenerating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isGenerating) return;
        
        setConfig({ prompt: input });
        await onGenerate();
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-[#212121] text-gray-100">
            {/* Header */}
            <div className="flex-none p-4 border-b border-[#333] flex items-center gap-3">
                <button
                    onClick={onNavigateBack}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-semibold">{title}</h1>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="text-6xl mb-4">✨</div>
                        <p className="text-lg font-medium">Start Creating</p>
                        <p className="text-sm">Enter a prompt to generate {mode}</p>
                    </div>
                ) : (
                    history.map((task) => (
                        <div key={task.id} className="bg-[#2a2a2a] rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm text-gray-400">Prompt: {task.config?.prompt}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onReuse(task)}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                        Reuse
                                    </button>
                                    <button
                                        onClick={() => onDelete(task.id)}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            {task.status === 'completed' && task.results && task.results.length > 0 && (
                                <div className="mt-2">
                                    <img
                                        src={task.results[0]?.url}
                                        alt="Generated"
                                        className="max-w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}
                            {task.status === 'failed' && (
                                <p className="text-red-400 text-sm">Error: {task.error}</p>
                            )}
                        </div>
                    ))
                )}
                {isGenerating && (
                    <div className="bg-[#2a2a2a] rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span>Generating...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-[#333]">
                {onUpload && (
                    <div className="flex gap-2 mb-2">
                        {config.referenceImages?.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img src={img} alt={`Reference ${idx}`} className="w-16 h-16 object-cover rounded" />
                                {onRemoveReferenceImage && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveReferenceImage(idx)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={onUpload}
                            className="px-3 py-2 bg-[#333] hover:bg-[#444] rounded-lg text-sm text-gray-300"
                        >
                            Upload Reference
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Enter your ${mode} prompt...`}
                        className="flex-1 bg-[#2a2a2a] border border-[#333] rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        disabled={isGenerating}
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !input.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                        Generate
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GenerationChatWindow;
