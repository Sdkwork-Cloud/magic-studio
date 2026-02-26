
import React, { useState } from 'react';
import { X, Upload, FileText, Box, Layers, Image as ImageIcon, Film } from 'lucide-react';
import { Button } from '@sdkwork/react-commons';
import { ImageUpload, VideoUpload } from '@sdkwork/react-commons';
import { PromptTextInput } from '../PromptTextInput';
import { useTranslation } from '@sdkwork/react-i18n';
import { generateUUID } from '@sdkwork/react-commons';

export interface ImportData {
    id: string;
    fileUrl: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    createdAt: number;
    type: 'image' | 'video';
}

interface UploadGenerationModalProps {
    onClose: () => void;
    onImport: (data: ImportData) => void;
    initialType?: 'image' | 'video';
}

export const UploadGenerationModal: React.FC<UploadGenerationModalProps> = ({ onClose, onImport, initialType = 'image' }) => {
    const { t } = useTranslation();
    const [type, setType] = useState<'image' | 'video'>(initialType);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('External Source');
    const [aspectRatio, setAspectRatio] = useState('1:1');

    const handleImport = () => {
        if (!fileUrl) return;
        
        const data: ImportData = {
            id: generateUUID(),
            fileUrl,
            prompt: prompt || 'Imported content',
            model,
            aspectRatio,
            createdAt: Date.now(),
            type
        };
        onImport(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="w-full max-w-2xl bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Upload size={18} className="text-blue-500" />
                        Import Generation
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex gap-6">
                        {/* Left: Upload */}
                        <div className="w-1/3 flex flex-col gap-4">
                            <div className="flex bg-[#252526] p-1 rounded-lg border border-[#333]">
                                <button 
                                    onClick={() => { setType('image'); setFileUrl(null); }}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${type === 'image' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <ImageIcon size={14} /> Image
                                </button>
                                <button 
                                    onClick={() => { setType('video'); setFileUrl(null); }}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${type === 'video' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Film size={14} /> Video
                                </button>
                            </div>
                            
                            {type === 'image' ? (
                                <ImageUpload 
                                    value={fileUrl}
                                    onChange={(f) => setFileUrl(f.url)}
                                    onRemove={() => setFileUrl(null)}
                                    aspectRatio="aspect-square"
                                    label="Upload Image"
                                    className="bg-[#18181b] border-[#333] flex-1"
                                />
                            ) : (
                                <VideoUpload 
                                    value={fileUrl}
                                    onChange={(f) => setFileUrl(f.url)}
                                    onRemove={() => setFileUrl(null)}
                                    aspectRatio="aspect-video"
                                    label="Upload Video"
                                    className="bg-[#18181b] border-[#333] flex-1"
                                />
                            )}
                        </div>

                        {/* Right: Metadata */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prompt</label>
                                <PromptTextInput 
                                    value={prompt}
                                    onChange={setPrompt}
                                    placeholder="Describe the content..."
                                    rows={4}
                                    className="bg-[#18181b]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Model</label>
                                    <div className="relative group">
                                        <Box size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full bg-[#18181b] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. Midjourney"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Aspect Ratio</label>
                                    <div className="relative group">
                                        <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                            className="w-full bg-[#18181b] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                                            placeholder="e.g. 16:9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleImport} disabled={!fileUrl} className="bg-blue-600 hover:bg-blue-500 border-0">
                        Import Content
                    </Button>
                </div>
            </div>
        </div>
    );
};
