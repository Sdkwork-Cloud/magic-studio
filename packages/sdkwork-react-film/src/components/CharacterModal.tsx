
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, Image as ImageIcon, Wand2, Upload, Trash2, Sparkles, Grid3X3, Layers, FolderOpen, Mic2 } from 'lucide-react';
import { ChooseAssetModal, PromptTextInput } from 'sdkwork-react-assets';
import { AIImageGeneratorModal } from 'sdkwork-react-image';
import { Asset } from 'sdkwork-react-commons';
import { genAIService } from 'sdkwork-react-core';
import { FilmCharacter, ImageMediaResource, generateUUID } from 'sdkwork-react-commons';
import { ChooseVoiceSpeaker, PRESET_VOICES } from 'sdkwork-react-voicespeaker';

interface CharacterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<FilmCharacter>) => void;
    initialData?: FilmCharacter;
}

type ImageType = 'face' | 'threeView' | 'grid';

const IMAGE_CONFIGS: Record<ImageType, { label: string; subLabel: string; aspect: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'; defaultPrompt: string }> = {
    face: {
        label: 'Portrait',
        subLabel: 'Front view / Main character',
        aspect: '3:4',
        defaultPrompt: 'portrait photo, professional lighting, detailed face, character design, high quality, 8k'
    },
    threeView: {
        label: 'Three-View',
        subLabel: 'Front, side, back views',
        aspect: '16:9',
        defaultPrompt: 'character design sheet, front side back views, turnaround sheet, white background, professional concept art'
    },
    grid: {
        label: 'Grid',
        subLabel: 'Multiple angles / expressions',
        aspect: '1:1',
        defaultPrompt: 'character expressions sheet, multiple poses, detail views, character showcase, concept art grid'
    }
};

export const CharacterModal: React.FC<CharacterModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [description, setDescription] = useState('');
    const [traits, setTraits] = useState('');
    const [voiceId, setVoiceId] = useState<string>('');
    
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
            setGender(initialData?.appearance?.gender || '');
            setAge(initialData?.appearance?.ageGroup || '');
            setDescription(initialData?.description || '');
            setTraits(initialData?.personality?.traits?.join(', ') || '');
            setFaceImage(initialData?.faceImage);
            setThreeViewImage(initialData?.threeViewImage);
            setGridViewImage(initialData?.gridViewImage);
            setVoiceId(initialData?.interactionSettings?.voiceId || '');
            setFacePrompt(IMAGE_CONFIGS.face.defaultPrompt);
            setThreeViewPrompt(IMAGE_CONFIGS.threeView.defaultPrompt);
            setGridPrompt(IMAGE_CONFIGS.grid.defaultPrompt);
        } else {
            setName('');
            setGender('');
            setAge('');
            setDescription('');
            setTraits('');
            setFaceImage(undefined);
            setThreeViewImage(undefined);
            setGridViewImage(undefined);
            setVoiceId('');
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
    }, [isOpen, name, description, faceImage, threeViewImage, gridViewImage, gender, age, traits, voiceId]);

    const handleSave = useCallback(() => {
        if (!name.trim()) return;
        onSave({ 
            name, 
            description,
            appearance: {
                gender,
                ageGroup: age
            },
            personality: {
                traits: traits.split(',').map(t => t.trim()).filter(Boolean)
            },
            faceImage, 
            threeViewImage, 
            gridViewImage,
            interactionSettings: {
                voiceId
            }
        });
        onClose();
    }, [name, description, faceImage, threeViewImage, gridViewImage, gender, age, traits, voiceId]);

    const handleEnhanceDescription = async (text: string) => {
        setIsEnhancing(true);
        try {
            const baseText = text || `${name}, ${gender}, ${age}`;
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
        const genderPart = gender ? `, ${gender}` : '';
        const agePart = age ? `, ${age}` : '';
        const traitsPart = traits ? `, ${traits}` : '';
        return `${namePart}${descPart}${genderPart}${agePart}${traitsPart}, ${basePrompt}`;
    };

    const selectedVoice = PRESET_VOICES.find(v => v.id === voiceId);
    const selectedVoiceValue = selectedVoice ? {
        id: selectedVoice.id,
        name: selectedVoice.name,
        gender: selectedVoice.gender,
        language: selectedVoice.language,
        style: selectedVoice.style
    } : null;

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
                    <div className="flex-none px-6 py-4 flex justify-between items-center border-b border-[#1f1f23]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <User size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-[15px]">{initialData ? 'Edit Character' : 'New Character'}</h3>
                                <p className="text-[11px] text-gray-500">Create character with multiple views</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[#1a1a1c] hover:bg-[#252528] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 flex min-h-0">
                        <div className="w-80 flex flex-col border-r border-[#1f1f23] p-5 gap-4">
                            <div>
                                <label className="text-[11px] font-medium text-gray-400 mb-2 block">Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter character name..."
                                    className="w-full bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-medium text-gray-400 mb-2 block">Gender</label>
                                    <input
                                        type="text"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        placeholder="e.g. Male, Female"
                                        className="w-full bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-gray-400 mb-2 block">Age</label>
                                    <input
                                        type="text"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="e.g. 30s, Teenager"
                                        className="w-full bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[11px] font-medium text-gray-400 mb-2 block">Traits</label>
                                <input
                                    type="text"
                                    value={traits}
                                    onChange={(e) => setTraits(e.target.value)}
                                    placeholder="e.g. Brave, Smart, Cheerful"
                                    className="w-full bg-[#0a0a0b] border border-[#1f1f23] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            
                            <div className="flex-1 flex flex-col min-h-0">
                                <PromptTextInput
                                    label="Description"
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Describe appearance, clothing, style, personality..."
                                    onEnhance={handleEnhanceDescription}
                                    enableEnhance={true}
                                    isEnhancing={isEnhancing}
                                    minHeight={120}
                                    maxHeight={250}
                                />
                            </div>
                            
                            <div className="pt-2 border-t border-[#1f1f23]">
                                <div className="mb-3 flex items-center gap-2 text-gray-400">
                                    <Mic2 size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Voice</span>
                                </div>
                                <ChooseVoiceSpeaker 
                                    value={selectedVoiceValue}
                                    onChange={(v) => setVoiceId(v.id)}
                                    label={null}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col p-5 gap-4 min-h-0">
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
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
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

                            <div className="flex-1 flex gap-4 min-h-0">
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
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/80 backdrop-blur-md hover:bg-blue-500 rounded-xl text-white text-[12px] font-medium transition-all"
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
                                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white text-[13px] font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all"
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
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white text-[13px] font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                            >
                                <Save size={14} /> Save Character
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
