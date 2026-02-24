
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, MapPin, Image as ImageIcon, Wand2, Upload, Trash2, Sparkles, Grid3X3, Layers, FolderOpen } from 'lucide-react';

import { ChooseAssetModal, PromptTextInput } from 'sdkwork-react-assets';
import { AIImageGeneratorModal } from 'sdkwork-react-image';

import { Asset } from '../../assets/entities/asset.entity';

import { genAIService } from 'sdkwork-react-core';
import { FilmLocation, ImageMediaResource } from 'sdkwork-react-commons';
import { generateUUID } from 'sdkwork-react-commons';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<FilmLocation>) => void;
    initialData?: FilmLocation;
}

type ImageType = 'face' | 'threeView' | 'grid';

const IMAGE_CONFIGS: Record<ImageType, { label: string; subLabel: string; aspect: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'; defaultPrompt: string }> = {
    face: {
        label: 'Main',
        subLabel: 'Front view / Primary environment',
        aspect: '16:9',
        defaultPrompt: 'cinematic wide shot, detailed environment, professional lighting, 8k, ultra realistic'
    },
    threeView: {
        label: 'Three-View',
        subLabel: 'Multiple perspectives',
        aspect: '16:9',
        defaultPrompt: 'environment design sheet, multiple angles, architectural details, professional concept art'
    },
    grid: {
        label: 'Grid',
        subLabel: 'Detail views / variations',
        aspect: '1:1',
        defaultPrompt: 'environment details, architectural elements, mood studies, design exploration grid'
    }
};

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [tags, setTags] = useState('');
    const [description, setDescription] = useState('');
    
    const [faceImage, setFaceImage] = useState<ImageMediaResource | undefined>();
    const [threeViewImage, setThreeViewImage] = useState<ImageMediaResource | undefined>();
    const [gridViewImage, setGridViewImage] = useState<ImageMediaResource | undefined>();
    
    const [facePrompt, setFacePrompt] = useState('');
    const [threeViewPrompt, setThreeViewPrompt] = useState('');
    const [gridPrompt, setGridPrompt] = useState('');
    
    const [activeTab, setActiveTab] = useState<ImageType>('face');
    const [activeAIModal, setActiveAIModal] = useState<ImageType | null>(null);
    const [activeAssetModal, setActiveAssetModal] = useState<ImageType | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const getDisplayUrl = (img: ImageMediaResource | undefined) => {
        if (!img) return null;
        return img.url || null;
    };

    const getPrompt = (type: ImageType) => {
        return type === 'face' ? facePrompt : type === 'threeView' ? threeViewPrompt : gridPrompt;
    };

    const setPrompt = (type: ImageType, value: string) => {
        if (type === 'face') setFacePrompt(value);
        else if (type === 'threeView') setThreeViewPrompt(value);
        else setGridPrompt(value);
    };

    const getImage = (type: ImageType) => {
        return type === 'face' ? faceImage : type === 'threeView' ? threeViewImage : gridViewImage;
    };

    const setImage = (type: ImageType, url: string | null) => {
        const now = Date.now();
        const setter = type === 'face' ? setFaceImage : type === 'threeView' ? setThreeViewImage : setGridViewImage;
        
        if (url) {
            const newImage: ImageMediaResource = {
                id: generateUUID(),
                uuid: generateUUID(),
                type: 'IMAGE',
                name: `${name}_${type}`,
                url,
                createdAt: now,
                updatedAt: now
            } as ImageMediaResource;
            setter(newImage);
        } else {
            setter(undefined);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setTags(initialData?.tags?.join(', ') || '');
            setDescription(initialData?.visualDescription || initialData?.description || '');
            setFaceImage(initialData?.faceImage || initialData?.image as any);
            setThreeViewImage(initialData?.threeViewImage);
            setGridViewImage(initialData?.gridViewImage);
            setFacePrompt(IMAGE_CONFIGS.face.defaultPrompt);
            setThreeViewPrompt(IMAGE_CONFIGS.threeView.defaultPrompt);
            setGridPrompt(IMAGE_CONFIGS.grid.defaultPrompt);
        } else {
            setName('');
            setTags('');
            setDescription('');
            setFaceImage(undefined);
            setThreeViewImage(undefined);
            setGridViewImage(undefined);
            setFacePrompt('');
            setThreeViewPrompt('');
            setGridPrompt('');
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, name, description, faceImage, threeViewImage, gridViewImage, tags]);

    const handleSave = useCallback(() => {
        if (!name.trim()) return;
        onSave({ 
            name, 
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            visualDescription: description,
            faceImage, 
            threeViewImage, 
            gridViewImage 
        });
        onClose();
    }, [name, description, faceImage, threeViewImage, gridViewImage, tags]);

    const handleEnhanceDescription = async (text: string) => {
        setIsEnhancing(true);
        try {
            const baseText = text || name;
            const enhanced = await genAIService.enhancePrompt(baseText);
            setDescription(enhanced);
            return enhanced;
        } catch (e) {
            console.error("Enhancement failed", e);
            return text;
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleEnhancePrompt = (type: ImageType) => async (text: string) => {
        try {
            const enhanced = await genAIService.enhancePrompt(text);
            setPrompt(type, enhanced);
            return enhanced;
        } catch (e) {
            console.error("Enhancement failed", e);
            return text;
        }
    };

    const handleFileUpload = (type: ImageType) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch('/api/assets/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.url) setImage(type, data.url);
            } catch (err) {
                console.error('Upload failed:', err);
            }
        };
        input.click();
    };

    const handleChooseFromAssets = (type: ImageType) => {
        setActiveAssetModal(type);
    };

    const handleAssetSelected = (assets: Asset[]) => {
        if (assets.length > 0 && activeAssetModal) {
            const asset = assets[0];
            const url = asset.remoteUrl || asset.path;
            if (url) setImage(activeAssetModal, url);
        }
        setActiveAssetModal(null);
    };

    const buildFullPrompt = (type: ImageType) => {
        const basePrompt = getPrompt(type);
        const namePart = name ? `${name}` : '';
        const descPart = description ? `, ${description}` : '';
        const tagsPart = tags ? `, ${tags}` : '';
        return `${namePart}${descPart}${tagsPart}, ${basePrompt}`;
    };

    if (!isOpen) return null;

    const tabs: { type: ImageType; icon: React.ReactNode }[] = [
        { type: 'face', icon: <ImageIcon size={14} /> },
        { type: 'threeView', icon: <Layers size={14} /> },
        { type: 'grid', icon: <Grid3X3 size={14} /> }
    ];

    const currentConfig = IMAGE_CONFIGS[activeTab];
    const currentImage = getImage(activeTab);
    const currentPrompt = getPrompt(activeTab);
    const hasImage = !!getDisplayUrl(currentImage);

    return createPortal(
        <>
            <div 
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div 
                    className="w-full max-w-7xl bg-[#0c0c0e] border border-[#1f1f23] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{ height: '90vh' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-none px-6 py-4 flex justify-between items-center border-b border-[#1f1f23]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                                <MapPin size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-[15px]">{initialData ? 'Edit Location' : 'New Location'}</h3>
                                <p className="text-[11px] text-gray-500">Create location with multiple views</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[#1a1a1c] hover:bg-[#252528] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex min-h-0">
                        {/* Left Sidebar */}
                        <div className="w-80 flex flex-col border-r border-[#1f1f23] p-5 gap-4">
                            {/* Name */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-400 mb-2 block">Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter location name..."
                                    className="w-full bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                                />
                            </div>
                            
                            {/* Tags */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-400 mb-2 block">Tags</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="e.g. Dark, Moody, Cyberpunk, Rain"
                                    className="w-full bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                                />
                            </div>
                            
                            {/* Description */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <PromptTextInput
                                    label="Visual Description"
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Describe architecture, lighting, colors, weather, key landmarks..."
                                    onEnhance={handleEnhanceDescription}
                                    enableEnhance={true}
                                    isEnhancing={isEnhancing}
                                    minHeight={120}
                                    maxHeight={350}
                                />
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col p-5 gap-4 min-h-0">
                            {/* Tabs */}
                            <div className="flex gap-2">
                                {tabs.map(({ type, icon }) => {
                                    const hasImg = !!getDisplayUrl(getImage(type));
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setActiveTab(type)}
                                            className={`
                                                flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all
                                                ${activeTab === type 
                                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                                                    : 'bg-[#1a1a1c] text-gray-400 hover:text-gray-200 hover:bg-[#252528]'
                                                }
                                            `}
                                        >
                                            {icon}
                                            <span>{IMAGE_CONFIGS[type].label}</span>
                                            {hasImg && (
                                                <div className="w-2 h-2 rounded-full bg-white/80" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex gap-4 min-h-0">
                                {/* Prompt Panel */}
                                <div className="w-96 flex flex-col flex-shrink-0">
                                    <PromptTextInput
                                        label={`${currentConfig.label} Prompt`}
                                        value={currentPrompt}
                                        onChange={(value) => setPrompt(activeTab, value)}
                                        placeholder={`Enter prompt for ${currentConfig.label}...`}
                                        onEnhance={handleEnhancePrompt(activeTab)}
                                        enableEnhance={true}
                                        minHeight={200}
                                        maxHeight={450}
                                    />
                                </div>

                                {/* Image Panel */}
                                <div className="flex-1 relative bg-[#0a0a0b] border border-[#1f1f23] rounded-2xl overflow-hidden">
                                    {hasImage ? (
                                        <>
                                            <img 
                                                src={getDisplayUrl(currentImage)!} 
                                                className="w-full h-full object-contain" 
                                                alt={currentConfig.label} 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleChooseFromAssets(activeTab)} 
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white text-[12px] font-medium border border-white/10 transition-all"
                                                        >
                                                            <FolderOpen size={14} /> From Assets
                                                        </button>
                                                        <button 
                                                            onClick={() => handleFileUpload(activeTab)} 
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white text-[12px] font-medium border border-white/10 transition-all"
                                                        >
                                                            <Upload size={14} /> Upload
                                                        </button>
                                                        <button 
                                                            onClick={() => setActiveAIModal(activeTab)} 
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-green-500/80 backdrop-blur-md hover:bg-green-500 rounded-xl text-white text-[12px] font-medium transition-all"
                                                        >
                                                            <Wand2 size={14} /> Regenerate
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={() => setImage(activeTab, null)} 
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 text-[12px] font-medium border border-red-500/20 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-8">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1c] to-[#0f0f11] flex items-center justify-center mb-5 border border-[#1f1f23] shadow-xl">
                                                {activeTab === 'face' && <ImageIcon size={36} className="text-gray-500" />}
                                                {activeTab === 'threeView' && <Layers size={36} className="text-gray-500" />}
                                                {activeTab === 'grid' && <Grid3X3 size={36} className="text-gray-500" />}
                                            </div>
                                            <h4 className="text-gray-300 font-medium text-sm mb-1">{currentConfig.label} Image</h4>
                                            <p className="text-gray-500 text-[12px] mb-6 text-center max-w-xs">{currentConfig.subLabel}</p>
                                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => handleChooseFromAssets(activeTab)} 
                                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1c] hover:bg-[#252528] border border-[#2a2a2c] text-gray-300 text-[13px] font-medium rounded-xl transition-all"
                                                    >
                                                        <FolderOpen size={16} /> From Assets
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFileUpload(activeTab)} 
                                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1c] hover:bg-[#252528] border border-[#2a2a2c] text-gray-300 text-[13px] font-medium rounded-xl transition-all"
                                                    >
                                                        <Upload size={16} /> Upload
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => setActiveAIModal(activeTab)} 
                                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-[13px] font-medium rounded-xl shadow-lg shadow-green-500/25 transition-all"
                                                >
                                                    <Sparkles size={16} /> Generate with AI
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-none px-6 py-4 border-t border-[#1f1f23] flex justify-between items-center bg-[#0a0a0b]">
                        <div className="flex items-center gap-4">
                            <p className="text-[11px] text-gray-500">
                                <kbd className="px-1.5 py-0.5 bg-[#1a1a1c] rounded text-gray-400 mx-0.5 text-[10px] border border-[#2a2a2c]">?</kbd>
                                <span className="mx-0.5">+</span>
                                <kbd className="px-1.5 py-0.5 bg-[#1a1a1c] rounded text-gray-400 mx-0.5 text-[10px] border border-[#2a2a2c]">Enter</kbd>
                                <span className="ml-1">to save</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={onClose} 
                                className="px-5 py-2.5 text-[13px] text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={!name.trim()} 
                                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-[13px] font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
                            >
                                <Save size={14} /> Save Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Image Generator Modal */}
            {activeAIModal && (
                <AIImageGeneratorModal 
                    contextText={description ? `${name}: ${description}` : name}
                    config={{ 
                        aspectRatio: IMAGE_CONFIGS[activeAIModal].aspect, 
                        prompt: buildFullPrompt(activeAIModal)
                    }}
                    onClose={() => setActiveAIModal(null)}
                    onSuccess={(url) => {
                        const finalUrl = Array.isArray(url) ? url[0] : url;
                        setImage(activeAIModal, finalUrl);
                        setActiveAIModal(null);
                    }}
                />
            )}

            {/* Choose Asset Modal */}
            {activeAssetModal && (
                <ChooseAssetModal 
                    isOpen={true}
                    onClose={() => setActiveAssetModal(null)}
                    onConfirm={handleAssetSelected}
                    accepts={['image']}
                    title="Choose Image from Assets"
                />
            )}
        </>,
        document.body
    );
};

