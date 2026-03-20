
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Clapperboard, Video, Image as ImageIcon, Wand2, MessageSquare, Play, Layers, Grid3x3, ArrowRightLeft, FileImage, Type, Upload, Plus, Trash2, User, Music, Zap, Sparkles, Cpu, Cloud, Brain, Star, Activity, LayoutGrid, ChevronDown } from 'lucide-react';
import { SettingTextArea, SettingSlider } from '@sdkwork/react-settings';
import { Button, FilmShot, FilmCharacter, FilmDialogueItem, ModelSelector, ModelProvider, MediaScene, GenerationProduct, AssetAtomicMediaResource, MediaResourceType, Asset } from '@sdkwork/react-commons';
import { PromptTextInput, ChooseAssetModal, type InputAttachment } from '@sdkwork/react-assets';
import { AIImageGeneratorModal } from '@sdkwork/react-image';
import { genAIService, uploadHelper } from '@sdkwork/react-core';
import { generateUUID } from '@sdkwork/react-commons';
import { filmPreferencesService } from '../services';
import {
    buildAtomicAssetResource,
    resolveAtomicAssetResourceType,
    resolveAtomicAssetResourceUrl,
    toFilmShotAssetResource
} from '../utils/filmAtomicAssetAdapters';

interface ShotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<FilmShot>) => void;
    initialData?: FilmShot;
    sceneIndex?: number;
    characters?: FilmCharacter[];
}

const GENERATION_MODES = [
    { value: 'TEXT_TO_VIDEO', label: "\u6587\u751f\u89c6\u9891", icon: Type, description: "\u4f7f\u7528\u6587\u5b57\u751f\u6210\u89c6\u9891" },
    { value: 'IMAGE_TO_VIDEO', label: "\u56fe\u751f\u89c6\u9891", icon: FileImage, description: "\u4ece\u56fe\u7247\u751f\u6210\u89c6\u9891" },
    { value: 'START_END_FRAMES', label: "\u9996\u5c3e\u5e27", icon: ArrowRightLeft, description: "\u8bbe\u7f6e\u9996\u5c3e\u5e27\u751f\u6210" },
    { value: 'REFERENCE_GUIDED', label: "\u53c2\u8003\u751f\u6210", icon: Layers, description: "\u53c2\u8003\u7d20\u6750\u751f\u6210\u89c6\u9891" },
    { value: 'MULTI_FRAME_INTELLIGENT', label: "\u667a\u80fd\u591a\u5e27", icon: Grid3x3, description: "\u667a\u80fd\u591a\u5e27/\u5206\u955c" },
    { value: 'UNIVERSAL_REFERENCE', label: "\u5168\u80fd\u667a\u80fd\u53c2\u8003", icon: Activity, description: "\u56fe\u7247/\u89c6\u9891/\u97f3\u9891\u53c2\u8003" },
];

const isGenerationProduct = (value: string): value is GenerationProduct => {
    return GENERATION_MODES.some((mode) => mode.value === value);
};

const resolveShotPromptText = (shot?: FilmShot): string => {
    const generation = shot?.generation;
    const promptValue = generation?.prompt;
    if (typeof promptValue === 'string' && promptValue.trim().length > 0) {
        return promptValue;
    }
    if (promptValue && typeof promptValue === 'object') {
        const promptBase = (promptValue as { base?: unknown }).base;
        if (typeof promptBase === 'string') {
            return promptBase;
        }
    }
    if (typeof generation?.base === 'string') {
        return generation.base;
    }
    return '';
};

const ASSET_ROLES = {
    START_FRAME: "\u5f00\u59cb\u5e27",
    END_FRAME: "\u7ed3\u675f\u5e27",
    REFERENCE: "\u53c2\u8003\u7d20\u6750",
    AUDIO_TRACK: "\u97f3\u9891\u8f68",
    VIDEO_REFERENCE: "\u89c6\u9891\u53c2\u8003",
    IMAGE_REFERENCE: "\u56fe\u7247\u53c2\u8003",
};

const PLATFORM_PROVIDERS: ModelProvider[] = [
    {
        id: 'keling',
        name: "\u53ef\u7075",
        icon: <Zap size={16} />,
        color: 'text-yellow-400',
        models: [
            { id: 'keling-v1', name: "\u53ef\u7075AI\u89c6\u9891 v1.0", description: "\u53ef\u7075\u5b98\u65b9\u89c6\u9891\u751f\u6210\u6a21\u578b，\u652f\u6301\u6587\u751f\u89c6\u9891\u548c\u56fe\u751f\u89c6\u9891" },
            { id: 'keling-v2', name: "\u53ef\u7075AI\u89c6\u9891 v2.0", description: "\u65b0\u7248\u672c，\u753b\u8d28\u66f4\u9ad8" }
        ]
    },
    {
        id: 'vidu',
        name: 'Vidu',
        icon: <Sparkles size={16} />,
        color: 'text-purple-400',
        models: [
            { id: 'vidu-gen1', name: 'Vidu Gen1', description: "Vidu \u7b2c\u4e00\u4ee3\u89c6\u9891\u751f\u6210" }
        ]
    },
    {
        id: 'jimeng',
        name: "\u5373\u68a6",
        icon: <Cpu size={16} />,
        color: 'text-green-400',
        models: [
            { id: 'jimeng-v1', name: "\u5373\u68a6 v1", description: "\u5373\u68a6AI\u89c6\u9891\u751f\u6210" }
        ]
    },
    {
        id: 'sora',
        name: 'Sora',
        icon: <Star size={16} />,
        color: 'text-blue-400',
        models: [
            { id: 'sora-1', name: 'Sora 1.0', description: "OpenAI Sora \u89c6\u9891\u751f\u6210\u6a21\u578b" }
        ]
    },
    {
        id: 'google',
        name: 'Google',
        icon: <Cloud size={16} />,
        color: 'text-red-400',
        models: [
            { id: 'google-veo3', name: 'Veo 3', description: "Google Veo \u89c6\u9891\u751f\u6210" }
        ]
    },
    {
        id: 'runway',
        name: 'Runway',
        icon: <Brain size={16} />,
        color: 'text-pink-400',
        models: [
            { id: 'runway-gen3', name: 'Gen-3', description: "Runway Gen-3 \u89c6\u9891\u751f\u6210" }
        ]
    },
    {
        id: 'pika',
        name: 'Pika',
        icon: <Sparkles size={16} />,
        color: 'text-cyan-400',
        models: [
            { id: 'pika-1', name: 'Pika 1.0', description: "Pika Labs \u89c6\u9891\u751f\u6210" }
        ]
    }
];

export const ShotModal: React.FC<ShotModalProps> = ({ isOpen, onClose, onSave, initialData, sceneIndex, characters = [] }) => {
    const [duration, setDuration] = useState(3);
    const [description, setDescription] = useState('');
    const [visualPrompt, setVisualPrompt] = useState('');
    const [dialogueItems, setDialogueItems] = useState<FilmDialogueItem[]>([]);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
    const [showAIModal, setShowAIModal] = useState(false);
    const [genProduct, setGenProduct] = useState<GenerationProduct>('TEXT_TO_VIDEO');
    const [selectedPlatform, setSelectedPlatform] = useState<string>('keling-v1');
    const [assets, setAssets] = useState<AssetAtomicMediaResource[]>([]);
    const [activeAssetIndex, setActiveAssetIndex] = useState<number | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [assetModalIndex, setAssetModalIndex] = useState<number | null>(null);

    const handleProductChange = (prod: GenerationProduct) => {
        setGenProduct(prod);
        filmPreferencesService.setLastGenerationProduct(prod);
    };

    useEffect(() => {
        if (isOpen && initialData) {
            setDuration(initialData.duration || 3);
            setDescription(initialData.description || '');
            setVisualPrompt(resolveShotPromptText(initialData));

            if (initialData.dialogue?.items && initialData.dialogue.items.length > 0) {
                setDialogueItems(initialData.dialogue.items);
            } else {
                setDialogueItems([]);
            }

            const savedProduct = filmPreferencesService.getLastGenerationProduct();
            if (typeof initialData.generation?.product === 'string' && isGenerationProduct(initialData.generation.product)) {
                setGenProduct(initialData.generation.product);
            } else if (savedProduct && isGenerationProduct(savedProduct)) {
                setGenProduct(savedProduct);
            }

            if (initialData.generation?.modelId) {
                setSelectedPlatform(initialData.generation.modelId);
            }

            const loadedAssets = (initialData.generation?.assets || []) as Array<Partial<AssetAtomicMediaResource>>;
            const normalizedAssets: AssetAtomicMediaResource[] = loadedAssets.map((asset, idx) => {
                const type = resolveAtomicAssetResourceType(asset);
                const metadataAssetId =
                    typeof asset.metadata?.assetId === 'string' ? asset.metadata.assetId : undefined;
                const baseId =
                    metadataAssetId ||
                    (typeof asset.id === 'string' && asset.id.length > 0 ? asset.id : generateUUID());
                const normalized = buildAtomicAssetResource({
                    assetId: baseId,
                    type,
                    url: resolveAtomicAssetResourceUrl(asset) || asset.url || '',
                    name: asset.name || `${type.toLowerCase()}-${idx + 1}`,
                    scene: asset.scene || MediaScene.REFERENCE,
                    metadata: {
                        ...(asset.metadata || {}),
                        assetId: baseId
                    }
                });
                return {
                    ...asset,
                    ...normalized,
                    metadata: {
                        ...(asset.metadata || {}),
                        ...(normalized.metadata || {})
                    }
                };
            });
            setAssets(normalizedAssets);

            const videoUrl = initialData.generation?.video?.url;
            const imageUrl =
                initialData.assets?.[0]?.url ||
                normalizedAssets.find((a) => resolveAtomicAssetResourceType(a) === MediaResourceType.IMAGE)?.url;

            if (videoUrl) {
                setMediaUrl(videoUrl);
                setMediaType('VIDEO');
            } else if (imageUrl) {
                setMediaUrl(imageUrl);
                setMediaType('IMAGE');
            } else {
                setMediaUrl(null);
            }
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        const filmAssets = assets.map(toFilmShotAssetResource);
        const data: Partial<FilmShot> = {
            duration,
            description,
            dialogue: { items: dialogueItems },
            generation: {
                ...initialData?.generation,
                product: genProduct,
                modelId: selectedPlatform,
                status: initialData?.generation?.status || 'PENDING',
                prompt: visualPrompt,
                base: visualPrompt,
                assets: filmAssets,
                video: initialData?.generation?.video
            } as FilmShot['generation'],
            assets: filmAssets
        };

        onSave(data);
        onClose();
    };

    const handleEnhancePrompt = async (currentText: string): Promise<string> => {
        if (!currentText && !description) return "";
        setIsEnhancing(true);
        try {
            const baseText = currentText || description || 'Cinematic shot';
            const enhanced = await genAIService.enhancePrompt(baseText);
            setVisualPrompt(enhanced);
            return enhanced;
        } catch (e) {
            console.error("Enhancement failed", e);
            return currentText;
        } finally {
            setIsEnhancing(false);
        }
    };

    const addAsset = (kind: MediaResourceType, role?: string) => {
        const scene =
            role === 'FIRST_FRAME'
                ? MediaScene.FIRST_FRAME
                : role === 'END_FRAME'
                ? MediaScene.END_FRAME
                : MediaScene.REFERENCE;
        const newAsset: AssetAtomicMediaResource = buildAtomicAssetResource({
            assetId: generateUUID(),
            type: kind,
            url: '',
            name: `${kind.toLowerCase()}-${assets.length + 1}`,
            scene,
            metadata: {
                origin: 'manual',
                source: 'film-shot-modal-add-slot'
            }
        });
        setAssets([...assets, newAsset]);
    };

    const updateAsset = (index: number, updates: Partial<AssetAtomicMediaResource>) => {
        setAssets(prev => prev.map((asset, i) => 
            i === index ? { ...asset, ...updates, updatedAt: Date.now() } : asset
        ));
    };

    const removeAsset = (index: number) => {
        setAssets(prev => prev.filter((_, i) => i !== index));
    };

    const inputAttachments = useMemo((): InputAttachment[] => {
        return assets.filter(a => a.url).map((asset, idx) => ({
            id: asset.uuid,
            name: asset.name || `asset-${idx + 1}`,
            url: asset.url,
            type: asset.type === MediaResourceType.IMAGE ? 'image' : asset.type === MediaResourceType.VIDEO ? 'video' : 'audio'
        }));
    }, [assets]);

    const handleChooseFromLibrary = (index: number) => {
        setAssetModalIndex(index);
        setShowAssetModal(true);
    };

    const handleAssetSelected = (selectedAssets: Asset[]) => {
        if (selectedAssets.length > 0 && assetModalIndex !== null) {
            const asset = selectedAssets[0];
            const assetWithLocator = asset as Asset & { remoteUrl?: string; url?: string; name?: string };
            const resourceType: MediaResourceType = 
                asset.type === 'video' ? MediaResourceType.VIDEO : 
                asset.type === 'audio' || asset.type === 'music' || asset.type === 'voice' ? MediaResourceType.AUDIO : MediaResourceType.IMAGE;
            
            updateAsset(assetModalIndex, {
                url: assetWithLocator.remoteUrl || assetWithLocator.url || asset.path,
                name: assetWithLocator.name,
                type: resourceType
            });
        }
        setShowAssetModal(false);
        setAssetModalIndex(null);
    };

    const addDialogueItem = () => {
        setDialogueItems(prev => [
            ...prev,
            { id: generateUUID(), characterId: characters.length > 0 ? characters[0].uuid : 'narrator', text: '' }
        ]);
    };

    const updateDialogueItem = (id: string, field: keyof FilmDialogueItem, value: string) => {
        setDialogueItems(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeDialogueItem = (id: string) => {
        setDialogueItems(prev => prev.filter(item => item.id !== id));
    };

    const handleLocalUpload = async (index: number) => {
        try {
            const accept = assets[index]?.type === MediaResourceType.AUDIO ? 'audio/*' : 'image/*,video/*';
            const files = await uploadHelper.pickFiles(false, accept);
            if (files.length > 0) {
                const file = files[0];
                const blob = new Blob([new Uint8Array(file.data)]);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    const fileName = file.name || 'uploaded';
                    const detectedType = file.name?.endsWith('.mp3') || file.name?.endsWith('.wav') ? MediaResourceType.AUDIO 
                        : file.name?.endsWith('.mp4') || file.name?.endsWith('.webm') ? MediaResourceType.VIDEO 
                        : MediaResourceType.IMAGE;
                    updateAsset(index, { 
                        url: base64, 
                        name: fileName,
                        type: detectedType
                    });
                };
                reader.readAsDataURL(blob);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAIModalSuccess = (url: string | string[]) => {
        const finalUrl = Array.isArray(url) ? url[0] : url;
        if (activeAssetIndex !== null) {
            updateAsset(activeAssetIndex, { url: finalUrl });
            setActiveAssetIndex(null);
        } else {
            setMediaUrl(finalUrl);
            setMediaType('IMAGE');
        }
        setShowAIModal(false);
    };

    const getAssetIcon = (kind: MediaResourceType) => {
        switch (kind) {
            case MediaResourceType.IMAGE: return ImageIcon;
            case MediaResourceType.VIDEO: return Video;
            case MediaResourceType.AUDIO: return Music;
            default: return FileImage;
        }
    };

    const renderAssetSlot = (asset: AssetAtomicMediaResource, index: number) => {
        const Icon = getAssetIcon(asset.type as MediaResourceType);
        
        const getTypeColor = () => {
            switch (asset.type) {
                case MediaResourceType.IMAGE: return 'text-blue-400 border-blue-500/30';
                case MediaResourceType.VIDEO: return 'text-green-400 border-green-500/30';
                case MediaResourceType.AUDIO: return 'text-purple-400 border-purple-500/30';
                default: return 'text-gray-400 border-gray-500/30';
            }
        };

        const getTypeLabel = () => {
            switch (asset.type) {
                case MediaResourceType.IMAGE: return "\u56fe\u7247";
                case MediaResourceType.VIDEO: return "\u89c6\u9891";
                case MediaResourceType.AUDIO: return "\u97f3\u9891";
                default: return "\u7d20\u6750";
            }
        };

        return (
            <div key={asset.id} className="space-y-3 group/slot">
                <div className="flex justify-between items-center gap-2 min-h-[44px]">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className={`p-2 rounded-lg bg-[#1a1a1a] ${getTypeColor()} flex-shrink-0`}>
                            <Icon size={14} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider leading-tight">
                                {asset.scene ? ASSET_ROLES[asset.scene as keyof typeof ASSET_ROLES] || getTypeLabel() : getTypeLabel()}
                            </span>
                            {asset.name && asset.url && (
                                <span className="text-[9px] text-gray-500 truncate max-w-[130px] leading-tight">{asset.name}</span>
                            )}
                        </div>
                    </div>
                    <select 
                        value={asset.scene || MediaScene.REFERENCE}
                        onChange={(e) => updateAsset(index, { scene: e.target.value as MediaScene })}
                        className="bg-[#18181b] border border-[#333] hover:border-[#444] rounded-lg px-2.5 py-1.5 text-[9px] text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer flex-shrink-0"
                    >
                        <option value={MediaScene.REFERENCE}>{"\u53c2\u8003"}</option>
                        <option value={MediaScene.FIRST_FRAME}>{"\u5f00\u59cb\u5e27"}</option>
                        <option value={MediaScene.END_FRAME}>{"\u7ed3\u675f\u5e27"}</option>
                        <option value="AUDIO_TRACK">{"\u97f3\u9891\u8f68"}</option>
                    </select>
                </div>
                
                <div className={`relative w-full ${asset.type === MediaResourceType.AUDIO ? 'h-32' : 'aspect-video'} bg-[#121214] border-2 border-[#27272a] hover:border-[#444] rounded-xl overflow-hidden flex flex-col transition-all group cursor-pointer shadow-sm hover:shadow-md`}>
                    {asset.url ? (
                        <>
                            {asset.type === MediaResourceType.AUDIO ? (
                                <div className="flex flex-col items-center justify-center w-full h-full p-5 bg-gradient-to-br from-purple-900/25 via-purple-900/10 to-indigo-900/25">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-3 rounded-full bg-purple-500/20">
                                            <Music size={28} className="text-purple-400 animate-pulse" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[12px] font-medium text-gray-200 truncate max-w-[150px] leading-tight">{asset.name || "\u97f3\u9891\u6587\u4ef6"}</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">{"\u70b9\u51fb\u64ad\u653e\u97f3\u9891"}</span>
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <audio 
                                            src={asset.url} 
                                            controls 
                                            className="w-full h-10 [&::-webkit-media-controls-panel]:bg-[#1a1a1a] [&::-webkit-media-controls-current-time-display]:text-gray-300 [&::-webkit-media-controls-time-remaining-display]:text-gray-300"
                                        />
                                    </div>
                                </div>
                            ) : asset.type === MediaResourceType.VIDEO ? (
                                <div className="relative w-full h-full">
                                    <video 
                                        src={asset.url} 
                                        className="w-full h-full object-cover"
                                        poster=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-4">
                                        <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                                            <Play size={14} className="text-white" />
                                            <span className="text-[11px] text-white font-medium">{"\u70b9\u51fb\u64ad\u653e"}</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                                        <Video size={12} className="text-green-400" />
                                        <span className="text-[10px] text-white font-medium">{"\u89c6\u9891"}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    <img 
                                        src={asset.url} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                        alt={asset.name}
                                    />
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                                        <ImageIcon size={12} className="text-blue-400" />
                                        <span className="text-[10px] text-white font-medium">{"\u56fe\u7247"}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 text-gray-600 w-full h-full p-5">
                            <div className={`p-4 rounded-2xl bg-[#1a1a1a] border border-dashed border-[#333] ${getTypeColor()}`}>
                                <Icon size={28} />
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[12px] font-medium text-gray-400">{"\u6dfb\u52a0"}{getTypeLabel()}</span>
                                <span className="text-[10px] text-gray-600">{"\u4e0a\u4f20\u6216\u4ece\u7d20\u6750\u5e93\u9009\u62e9"}</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3 z-10">
                        <button 
                            onClick={() => handleLocalUpload(index)}
                            className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#252526] text-gray-300 hover:text-white flex items-center justify-center transition-all border border-[#333] hover:border-gray-400 shadow-lg hover:shadow-xl hover:scale-110"
                            title="\u4e0a\u4f20\u6587\u4ef6"
                        >
                            <Upload size={18} />
                        </button>
                        
                        <button 
                            onClick={() => handleChooseFromLibrary(index)}
                            className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-[#252526] text-gray-300 hover:text-white flex items-center justify-center transition-all border border-[#333] hover:border-gray-400 shadow-lg hover:shadow-xl hover:scale-110"
                            title="\u4ece\u7d20\u6750\u5e93\u9009\u62e9"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        
                        {asset.type === MediaResourceType.IMAGE && (
                            <button 
                                onClick={() => { setActiveAssetIndex(index); setShowAIModal(true); }}
                                className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/30 hover:scale-110"
                                title="AI\u751f\u6210\u56fe\u7247"
                            >
                                <Wand2 size={18} />
                            </button>
                        )}

                        <button 
                            onClick={() => removeAsset(index)}
                            className="w-11 h-11 rounded-full bg-[#18181b] hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all border border-[#333] hover:border-red-500/30 shadow-lg hover:shadow-xl hover:scale-110"
                            title="\u5220\u9664\u7d20\u6750"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderGenInputs = () => {
        switch (genProduct) {
            case 'TEXT_TO_VIDEO':
                return (
                    <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                        <Type size={28} className="mx-auto mb-3 opacity-40" />
                        <p className="text-gray-400">{"\u5c06\u4f7f\u7528\u6587\u5b57\u63d0\u793a\u751f\u6210\u89c6\u9891"}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{"\u65e0\u9700\u4e0a\u4f20\u53c2\u8003\u8d44\u6e90"}</p>
                    </div>
                );
            
            case 'IMAGE_TO_VIDEO':
            case 'REFERENCE_GUIDED':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Layers size={12} /> {"\u53c2\u8003\u7d20\u6750\r\n                            "}</label>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => addAsset(MediaResourceType.IMAGE, 'REFERENCE')} 
                                    className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-blue-500/20 hover:border-blue-500/40"
                                >
                                    <Plus size={10} /> {"\u6dfb\u52a0\u56fe\u7247\r\n                                "}</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {assets.map((asset, idx) => renderAssetSlot(asset, idx))}
                        </div>
                        {assets.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <Layers size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">{"\u8bf7\u6dfb\u52a0\u53c2\u8003\u7d20\u6750"}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{"\u53c2\u8003\u7d20\u6750\u5c06\u5f71\u54cd\u89c6\u9891\u98ce\u683c"}</p>
                            </div>
                        )}
                    </div>
                );
            
            case 'START_END_FRAMES':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRightLeft size={12} /> {"\u9996\u5c3e\u5e27\r\n                            "}</label>
                            <div className="flex gap-1.5">
                                {!assets.find(a => a.scene === MediaScene.FIRST_FRAME) && (
                                    <button 
                                        onClick={() => addAsset(MediaResourceType.IMAGE, 'FIRST_FRAME')} 
                                        className="text-[10px] text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
                                    >
                                        <Plus size={10} /> {"\u5f00\u59cb\u5e27\r\n                                    "}</button>
                                )}
                                {!assets.find(a => a.scene === MediaScene.END_FRAME) && (
                                    <button 
                                        onClick={() => addAsset(MediaResourceType.IMAGE, 'END_FRAME')} 
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
                                    >
                                        <Plus size={10} /> {"\u7ed3\u675f\u5e27\r\n                                    "}</button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {(() => {
                                const startFrame = assets.find(a => a.scene === MediaScene.FIRST_FRAME);
                                const endFrame = assets.find(a => a.scene === MediaScene.END_FRAME);
                                const displayAssets: AssetAtomicMediaResource[] = [];
                                if (startFrame) displayAssets.push(startFrame);
                                if (endFrame) displayAssets.push(endFrame);
                                return displayAssets.map((asset) => renderAssetSlot(asset, assets.indexOf(asset)));
                            })()}
                        </div>
                        {assets.filter(a => a.scene === MediaScene.FIRST_FRAME || a.scene === MediaScene.END_FRAME).length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <ArrowRightLeft size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">{"\u8bf7\u6dfb\u52a0\u5f00\u59cb\u5e27\u548c\u7ed3\u675f\u5e27"}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{"\u8bbe\u7f6e\u9996\u5c3e\u5e27\u751f\u6210\u89c6\u9891"}</p>
                            </div>
                        )}
                    </div>
                );
            
            case 'MULTI_FRAME_INTELLIGENT':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Grid3x3 size={12} /> {"\u591a\u5e27\u53c2\u8003 (\u6700\u591a6\u4e2a)\r\n                            "}</label>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => addAsset(MediaResourceType.IMAGE, 'REFERENCE')} 
                                    disabled={assets.length >= 6}
                                    className={`text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border ${assets.length >= 6 ? 'text-gray-600 bg-gray-800/30 border-gray-700/30 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/40'}`}
                                >
                                    <Plus size={10} /> {"\u6dfb\u52a0\r\n                                "}</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {assets.slice(0, 6).map((asset, idx) => renderAssetSlot(asset, idx))}
                        </div>
                        {assets.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <Grid3x3 size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">{"\u8bf7\u6dfb\u52a0\u591a\u5e27\u53c2\u8003"}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{"\u667a\u80fd\u591a\u5e27/\u5206\u955c\u751f\u6210"}</p>
                            </div>
                        )}
                    </div>
                );
            
            case 'UNIVERSAL_REFERENCE':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity size={12} /> {"\u5168\u80fd\u667a\u80fd\u53c2\u8003 (\u56fe\u7247/\u89c6\u9891/\u97f3\u9891)\r\n                            "}</label>
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => addAsset(MediaResourceType.IMAGE)} 
                                    className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-blue-500/20 hover:border-blue-500/40"
                                >
                                    <ImageIcon size={10} /> {"\u56fe\u7247\r\n                                "}</button>
                                <button 
                                    onClick={() => addAsset(MediaResourceType.VIDEO)} 
                                    className="text-[10px] text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-green-500/20 hover:border-green-500/40"
                                >
                                    <Video size={10} /> {"\u89c6\u9891\r\n                                "}</button>
                                <button 
                                    onClick={() => addAsset(MediaResourceType.AUDIO)} 
                                    className="text-[10px] text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-purple-500/20 hover:border-purple-500/40"
                                >
                                    <Music size={10} /> {"\u97f3\u9891\r\n                                "}</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {assets.map((asset, idx) => renderAssetSlot(asset, idx))}
                        </div>
                        {assets.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#27272a] rounded-xl bg-[#121214]/50">
                                <Activity size={28} className="mx-auto mb-3 opacity-40" />
                                <p className="text-gray-400">{"\u8bf7\u6dfb\u52a0\u5168\u80fd\u667a\u80fd\u53c2\u8003\u7d20\u6750"}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{"\u652f\u6301\u56fe\u7247、\u89c6\u9891、\u97f3\u9891"}</p>
                            </div>
                        )}
                    </div>
                );
            
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-7xl bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex-none px-6 py-4 border-b border-[#333] bg-[#252526] flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Clapperboard size={18} className="text-blue-500" />
                        {"\u7f16\u8f91\u5206\u955c (Edit Shot) "}{sceneIndex ? `- Scene ${sceneIndex}` : ''} {initialData?.index ? `Shot ${initialData.index}` : ''}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-[520px] flex-none border-r border-[#333] bg-[#1a1a1a] flex flex-col p-6 overflow-y-auto custom-scrollbar">
                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Video size={12} /> Visual Result</span>
                                {mediaType === 'VIDEO' && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50">VIDEO GENERATED</span>}
                            </div>
                            <div className="relative group w-full aspect-video bg-[#000] border border-[#333] hover:border-[#555] rounded-xl overflow-hidden flex flex-col transition-all items-center justify-center shrink-0 shadow-lg">
                                {mediaUrl ? (
                                    <>
                                        {mediaType === 'VIDEO' ? <video src={mediaUrl} className="w-full h-full object-cover" controls /> : <img src={mediaUrl} className="w-full h-full object-cover" alt="Shot Visual" />}
                                        {mediaType === 'IMAGE' && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <button onClick={() => { setActiveAssetIndex(null); setShowAIModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-white text-xs font-medium border border-white/10 shadow-lg">
                                                    <Wand2 size={14} /> Regenerate Image
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center w-full h-full text-gray-600">
                                        <Clapperboard size={32} className="mb-2 opacity-50" />
                                        <p className="text-xs">No visual generated yet.</p>
                                        <Button size="sm" onClick={() => { setActiveAssetIndex(null); setShowAIModal(true); }} className="mt-4 bg-[#252526] hover:bg-[#333] border border-[#333]">
                                            <Wand2 size={14} className="mr-2" /> Generate Concept
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-[#333] mb-6" />

                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generation Settings</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{"\u751f\u6210\u4ea7\u54c1 (Product)"}</label>
                                    <div className="relative">
                                        <select
                                            value={genProduct}
                                            onChange={(e) => {
                                                const nextProduct = e.target.value;
                                                if (isGenerationProduct(nextProduct)) {
                                                    handleProductChange(nextProduct);
                                                }
                                            }}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-medium 
                                                bg-[#18181b] border-[#333] hover:border-[#444] hover:bg-[#202023] text-gray-300
                                                focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                                                appearance-none cursor-pointer
                                            `}
                                        >
                                            {GENERATION_MODES.map(m => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown size={12} className="text-gray-500" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-1">
                                        {GENERATION_MODES.find(m => m.value === genProduct)?.description}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">{"\u751f\u6210\u5e73\u53f0 (Platform)"}</label>
                                    <ModelSelector
                                        value={selectedPlatform}
                                        onChange={setSelectedPlatform}
                                        providers={PLATFORM_PROVIDERS}
                                        label="\u9009\u62e9\u5e73\u53f0 & \u6a21\u578b"
                                    />
                                </div>
                            </div>

                            {renderGenInputs()}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div>
                             <PromptTextInput 
                                label="\u89c6\u89c9\u63d0\u793a\u8bcd (Visual Prompt)"
                                value={visualPrompt}
                                onChange={setVisualPrompt}
                                rows={4}
                                className="bg-[#121214]"
                                placeholder="Cinematic shot of... (Used for AI generation)"
                                onEnhance={handleEnhancePrompt}
                                isEnhancing={isEnhancing}
                                assets={inputAttachments}
                            />
                        </div>

                        <div className="h-px bg-[#333]" />

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare size={12} /> {"\u53f0\u8bcd & \u811a\u672c (Dialogue)\r\n                                "}</label>
                                <button onClick={addDialogueItem} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                                    <Plus size={10} /> Add Line
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {dialogueItems.map((item) => {
                                    const char = characters.find(c => c.uuid === item.characterId);
                                    return (
                                        <div key={item.id} className="flex items-start gap-2 bg-[#121214] p-2 rounded-lg border border-[#27272a]">
                                             <div className="w-8 h-8 rounded bg-[#1e1e1e] flex-shrink-0 overflow-hidden border border-[#333]">
                                                 {(() => {
                                                     const avatarAsset = char?.refAssets?.find(a => a.scene === MediaScene.AVATAR);
                                                     const avatarUrl = avatarAsset?.url || avatarAsset?.image?.url;
                                                     return avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={14}/></div>;
                                                 })()}
                                             </div>
                                             
                                             <div className="flex-1 min-w-0 space-y-1">
                                                 <select 
                                                    value={item.characterId}
                                                    onChange={(e) => updateDialogueItem(item.id, 'characterId', e.target.value)}
                                                    className="w-full bg-[#18181b] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                                                 >
                                                     <option value="narrator">{"Narrator (\u65c1\u767d)"}</option>
                                                     {characters.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
                                                 </select>
                                                 <input 
                                                    type="text" 
                                                    value={item.text}
                                                    onChange={(e) => updateDialogueItem(item.id, 'text', e.target.value)}
                                                    placeholder="Enter dialogue..."
                                                    className="w-full bg-transparent border-b border-[#333] focus:border-blue-500 outline-none text-sm text-gray-200 py-1 transition-colors"
                                                 />
                                             </div>

                                             <button onClick={() => removeDialogueItem(item.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    );
                                })}
                                {dialogueItems.length === 0 && (
                                    <div className="text-center py-4 text-xs text-gray-600 border border-dashed border-[#27272a] rounded-lg">
                                        No dialogue. Click "Add Line" to start.
                                    </div>
                                )}
                            </div>
                        </div>

                        <SettingTextArea 
                            label="\u573a\u666f\u63cf\u8ff0 (Description)" 
                            value={description} 
                            onChange={setDescription} 
                            rows={4} 
                            fullWidth 
                            placeholder="Details about the scene environment, lighting, camera movement..."
                        />

                        <div>
                             <SettingSlider label="\u65f6\u957f (Duration)" value={duration} onChange={setDuration} min={1} max={10} step={0.5} unit="s" />
                        </div>

                    </div>
                </div>

                <div className="flex-none px-6 py-4 border-t border-[#333] bg-[#252526] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>{"\u53d6\u6d88"}</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 border-0"><Save size={16} className="mr-2" /> {"\u4fdd\u5b58\u4fee\u6539"}</Button>
                </div>
            </div>

            {showAIModal && (
                <AIImageGeneratorModal 
                    contextText={visualPrompt || description}
                    config={{ aspectRatio: '16:9', prompt: visualPrompt || `${description}, cinematic lighting, 8k` }}
                    onClose={() => setShowAIModal(false)}
                    onSuccess={handleAIModalSuccess}
                />
            )}

            {showAssetModal && (
                <ChooseAssetModal
                    isOpen={showAssetModal}
                    onClose={() => {
                        setShowAssetModal(false);
                        setAssetModalIndex(null);
                    }}
                    onConfirm={handleAssetSelected}
                    accepts={assetModalIndex !== null 
                        ? (assets[assetModalIndex]?.type === MediaResourceType.VIDEO 
                            ? ['video'] 
                            : assets[assetModalIndex]?.type === MediaResourceType.AUDIO 
                            ? ['audio', 'music', 'voice', 'sfx'] 
                            : ['image'])
                        : ['image', 'video', 'audio']}
                    title="\u9009\u62e9\u7d20\u6750"
                    multiple={false}
                />
            )}
        </div>,
        document.body
    );
};
