import React, { useState, useCallback } from 'react';
import { 
    Image, Video, Sparkles, Upload, X, ArrowLeft
} from 'lucide-react';
import { usePromptOptimizerStore } from '../store';
import { promptBusinessService } from '../services';
import { StyleSelector } from '@sdkwork/react-assets';
import { IMAGE_STYLES, VIDEO_STYLES } from '@sdkwork/react-commons';
import { useRouter } from '@sdkwork/react-core';
import type { PromptType, OptimizationMode } from '../types';

export const PromptOptimizerPage: React.FC = () => {
    const {
        currentType,
        currentMode,
        inputText,
        inputImage,
        inputVideo,
        inputImageUrl,
        inputVideoUrl,
        isProcessing,
        result,
        setType,
        setMode,
        setInputText,
        setInputImage,
        setInputVideo,
        setIsProcessing,
        setResult,
        addToHistory,
        initChatContext,
    } = usePromptOptimizerStore();
    
    const { navigate } = useRouter();
    const [selectedStyle, setSelectedStyle] = useState<string>('');
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [optimizeError, setOptimizeError] = useState('');
    
    const handleTypeChange = (type: PromptType) => {
        setType(type);
        setSelectedStyle('');
        setMode('text-to-prompt');
    };
    
    const handleModeChange = (mode: OptimizationMode) => {
        setMode(mode);
        setInputImage(null);
        setInputVideo(null);
        setInputText('');
    };
    
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInputImage(file);
        }
    }, [setInputImage]);
    
    const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInputVideo(file);
        }
    }, [setInputVideo]);
    
    const handleOptimize = async () => {
        if (!inputText.trim() && !inputImage && !inputVideo) return;

        setOptimizeError('');
        setIsProcessing(true);

        try {
            const optimization = await promptBusinessService.optimizePrompt({
                type: currentType,
                mode: currentMode,
                inputText,
                inputImage: inputImage || undefined,
                inputVideo: inputVideo || undefined,
                targetStyle: selectedStyle,
                additionalInstructions,
            });

            if (!optimization.success || !optimization.data) {
                setOptimizeError(optimization.message || 'Prompt optimization failed');
                return;
            }

            setResult(optimization.data);
            addToHistory(optimization.data);
            setInputText(optimization.data.optimizedPrompt);
            initChatContext(currentType);
            navigate('/chat');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleGoBack = () => {
        navigate('/portal');
    };
    
    const styles = currentType === 'image' ? IMAGE_STYLES : VIDEO_STYLES;
    
    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleGoBack}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                        title="Go Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <Sparkles className="text-purple-500" size={24} />
                    <h1 className="text-lg font-bold">Prompt Optimizer</h1>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex gap-2 p-1 bg-[#18181b] rounded-lg w-fit">
                        <button
                            onClick={() => handleTypeChange('image')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                currentType === 'image' 
                                    ? 'bg-[#27272a] text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Image size={16} />
                            Image Prompt
                        </button>
                        <button
                            onClick={() => handleTypeChange('video')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                currentType === 'video' 
                                    ? 'bg-[#27272a] text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Video size={16} />
                            Video Prompt
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleModeChange('text-to-prompt')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                currentMode === 'text-to-prompt' 
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                    : 'bg-[#18181b] text-gray-400 hover:text-white'
                            }`}
                        >
                            Text to Prompt
                        </button>
                        <button
                            onClick={() => handleModeChange('image-to-prompt')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                currentMode === 'image-to-prompt' 
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                    : 'bg-[#18181b] text-gray-400 hover:text-white'
                            }`}
                        >
                            {currentType === 'image' ? 'Image' : 'Frame'} to Prompt
                        </button>
                        {currentType === 'video' && (
                            <button
                                onClick={() => handleModeChange('video-to-prompt')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    currentMode === 'video-to-prompt' 
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                        : 'bg-[#18181b] text-gray-400 hover:text-white'
                                }`}
                            >
                                Video to Prompt
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Describe what you want to generate
                            </label>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`Enter your ${currentType} description...`}
                                className="w-full h-32 px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>

                        {result && (
                            <div className="space-y-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                                <div className="text-xs font-medium text-purple-300">Latest optimized prompt</div>
                                <div className="text-sm text-gray-100 leading-relaxed">{result.optimizedPrompt}</div>
                            </div>
                        )}
                        
                        {(currentMode === 'image-to-prompt' || currentMode === 'video-to-prompt') && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Upload reference {currentMode === 'image-to-prompt' ? 'image' : 'video'}
                                </label>
                                
                                {currentMode === 'image-to-prompt' && (
                                    inputImageUrl ? (
                                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-[#27272a]">
                                            <img src={inputImageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setInputImage(null)}
                                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-[#27272a] rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                            <Upload size={24} className="text-gray-500 mb-2" />
                                            <span className="text-xs text-gray-500">Upload Image</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )
                                )}
                                
                                {(currentMode === 'video-to-prompt') && (
                                    inputVideoUrl ? (
                                        <div className="relative w-64 rounded-lg overflow-hidden border border-[#27272a]">
                                            <video src={inputVideoUrl} controls className="w-full" />
                                            <button
                                                onClick={() => setInputVideo(null)}
                                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-64 h-36 border-2 border-dashed border-[#27272a] rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                            <Upload size={24} className="text-gray-500 mb-2" />
                                            <span className="text-xs text-gray-500">Upload Video</span>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleVideoUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )
                                )}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Target Style (Optional)
                            </label>
                            <StyleSelector
                                value={selectedStyle}
                                onChange={setSelectedStyle}
                                options={styles}
                                label={currentType === 'image' ? 'Image Style' : 'Video Style'}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                Additional Instructions (Optional)
                            </label>
                            <input
                                type="text"
                                value={additionalInstructions}
                                onChange={(e) => setAdditionalInstructions(e.target.value)}
                                placeholder="e.g., Make it more dramatic, add rain effects..."
                                className="w-full px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                    
                    <button
                        onClick={handleOptimize}
                        disabled={isProcessing || (!inputText.trim() && !inputImage && !inputVideo)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                    >
                        <Sparkles size={18} />
                        {isProcessing ? 'Optimizing...' : 'Optimize Prompt'}
                    </button>

                    {optimizeError && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {optimizeError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptOptimizerPage;
